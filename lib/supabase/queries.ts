import { createClient } from './server'
import type { Database } from '@/types/database.types'
import { geocodeAddress, geocodeCityWithZipCodes, calculateDistance, type Coordinates } from '@/lib/geocoding'

type Article = Database['public']['Tables']['articles']['Row']
type State = Database['public']['Tables']['states']['Row']
type City = Database['public']['Tables']['cities']['Row']
type Lawyer = Database['public']['Tables']['lawyers']['Row']
type LawFirm = Database['public']['Tables']['law_firms']['Row']

/**
 * Helper: Get subscription type for a lawyer in a specific DMA
 * Falls back to lawyer's subscription_type if no DMA-specific subscription exists
 */
async function getLawyerSubscriptionForDma(
  supabase: ReturnType<typeof createClient>,
  lawyerId: string,
  dmaId: string
): Promise<string | null> {
  const { data: subscription, error } = await supabase
    .from('lawyer_dma_subscriptions')
    .select('subscription_type')
    .eq('lawyer_id', lawyerId)
    .eq('dma_id', dmaId)
    .maybeSingle()
  
  if (error) {
    console.error(`Error fetching subscription for lawyer ${lawyerId} in DMA ${dmaId}:`, error)
    return null
  }
  
  return subscription?.subscription_type || null
}

/**
 * Helper: Get the highest subscription (lowest sort_order) for a lawyer across multiple DMAs
 * Used when a lawyer appears in multiple DMAs in search results
 */
async function getHighestSubscriptionForLawyer(
  supabase: ReturnType<typeof createClient>,
  lawyerId: string,
  dmaIds: string[]
): Promise<{ subscription_type: string; dma_id: string } | null> {
  if (dmaIds.length === 0) return null
  
  // Get all subscriptions for this lawyer in the given DMAs
  const { data: subscriptions, error } = await supabase
    .from('lawyer_dma_subscriptions')
    .select('subscription_type, dma_id')
    .eq('lawyer_id', lawyerId)
    .in('dma_id', dmaIds)
  
  if (error) {
    console.error(`Error fetching subscriptions for lawyer ${lawyerId}:`, error)
    return null
  }
  
  if (!subscriptions || subscriptions.length === 0) {
    // Fallback to lawyer's default subscription_type
    const { data: lawyer } = await supabase
      .from('lawyers')
      .select('subscription_type')
      .eq('id', lawyerId)
      .maybeSingle()
    
    if (lawyer?.subscription_type) {
      return { subscription_type: lawyer.subscription_type, dma_id: dmaIds[0] }
    }
    return null
  }
  
  // Get subscription types with their sort orders
  const { data: subscriptionTypes } = await supabase
    .from('subscription_types')
    .select('name, sort_order')
    .eq('is_active', true)
  
  if (!subscriptionTypes) return { subscription_type: subscriptions[0].subscription_type, dma_id: subscriptions[0].dma_id }
  
  // Find the subscription with the lowest sort_order (highest tier)
  const subscriptionTypeMap = new Map(subscriptionTypes.map(st => [st.name, st.sort_order]))
  
  let highestSubscription = subscriptions[0]
  let lowestSortOrder = subscriptionTypeMap.get(subscriptions[0].subscription_type) ?? 999
  
  for (const sub of subscriptions) {
    const sortOrder = subscriptionTypeMap.get(sub.subscription_type) ?? 999
    if (sortOrder < lowestSortOrder) {
      lowestSortOrder = sortOrder
      highestSubscription = sub
    }
  }
  
  return {
    subscription_type: highestSubscription.subscription_type,
    dma_id: highestSubscription.dma_id
  }
}

/**
 * Get all published articles
 */
export async function getArticles(limit = 50) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as Article[]
}

/**
 * Get a single article by slug
 */
export async function getArticleBySlug(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      article_categories (
        id,
        name,
        slug
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) throw error
  return data
}

/**
 * Get all states
 */
export async function getStates() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('states')
    .select('*')
    .order('name')

  if (error) throw error
  return data as State[]
}

/**
 * Get a state by slug
 */
export async function getStateBySlug(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('states')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data as State
}

/**
 * Get cities for a state
 */
export async function getCitiesByState(stateId: string, limit = 100) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('state_id', stateId)
    .order('name')
    .limit(limit)

  if (error) throw error
  return data as City[]
}

/**
 * Get a city by slug
 */
export async function getCityBySlug(stateSlug: string, citySlug: string) {
  const supabase = await createClient()
  
  // First get the state
  const state = await getStateBySlug(stateSlug)
  
  // Then get the city
  const { data, error } = await supabase
    .from('cities')
    .select(`
      *,
      states (
        id,
        name,
        slug,
        abbreviation
      )
    `)
    .eq('state_id', state.id)
    .eq('slug', citySlug)
    .single()

  if (error) throw error
  return data
}

/**
 * Get lawyers for a city
 */
export async function getLawyersByCity(cityId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('lawyers')
    .select(`
      *,
      law_firms (
        id,
        name,
        slug,
        city_id
      )
    `)
    .eq('law_firms.city_id', cityId)

  if (error) throw error
  return data as Lawyer[]
}

/**
 * Get all lawyers
 */
export async function getLawyers(limit = 50) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('lawyers')
    .select(`
      *,
      law_firms (
        id,
        name,
        slug,
        cities (
          id,
          name,
          slug,
          latitude,
          longitude,
          states (
            id,
            name,
            abbreviation
          )
        )
      ),
      lawyer_service_areas (
        cities (
          id,
          name,
          slug,
          latitude,
          longitude,
          states (
            id,
            name,
            abbreviation
          )
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as Lawyer[]
}

/**
 * Get a lawyer by slug
 */
export async function getLawyerBySlug(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('lawyers')
    .select(`
      *,
      law_firms (
        id,
        name,
        slug,
        description,
        phone,
        email,
        website
      )
    `)
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
}

/**
 * Get all questions/FAQs
 */
export async function getQuestions() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get all videos
 */
export async function getVideos(limit = 50) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Get stages of divorce
 */
export async function getStages() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('stages')
    .select('*')
    .order('order_index')

  if (error) throw error
  return data
}

/**
 * Get emotions
 */
export async function getEmotions() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('emotions')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

/**
 * Get featured law firms by city
 */
export async function getLawFirmsByCity(citySlug: string, limit = 3) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('law_firms')
    .select(`
      *,
      cities (
        name,
        slug,
        states (
          name,
          code
        )
      )
    `)
    .eq('cities.slug', citySlug)
    .eq('verified', true)
    .eq('featured', true)
    .order('rating', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data || []
}

/**
 * Get lawyers by law firm
 */
export async function getLawyersByFirm(firmId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('lawyers')
    .select('*')
    .eq('law_firm_id', firmId)
    .limit(3)
  
  if (error) throw error
  return data || []
}

/**
 * Get featured lawyers grouped by firm for a city
 */
export async function getFeaturedLawyersWithFirmsByCity(citySlug: string, limit = 3) {
  const supabase = await createClient()
  
  try {
    // First get the city
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('id, name, slug, state_id')
      .eq('slug', citySlug)
      .single()
    
    if (cityError || !cityData) {
      // Only log if it's not a "not found" error (PGRST116 is PostgREST "not found")
      // Missing cities are expected and handled gracefully
      if (cityError && cityError.code !== 'PGRST116') {
        console.error('Error fetching city:', citySlug, cityError)
      }
      return []
    }
    
    // Get the state abbreviation
    const { data: stateData } = await supabase
      .from('states')
      .select('abbreviation')
      .eq('id', cityData.state_id as string)
      .single()
    
    // Get law firms in this city
    const { data: firmsData, error: firmsError } = await supabase
      .from('law_firms')
      .select('id, name, slug')
      .eq('city_id', cityData.id)
      .eq('verified', true)
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(limit)
    
    if (firmsError) {
      console.error('Error fetching law firms:', firmsError)
      return []
    }
    
    if (!firmsData || firmsData.length === 0) {
      return []
    }
    
    // Get lawyers for each firm
    const firmsWithLawyers = await Promise.all(
      firmsData.map(async (firm) => {
        const { data: lawyersData, error: lawyersError } = await supabase
          .from('lawyers')
          .select('id, first_name, last_name, slug, photo_url, title')
          .eq('law_firm_id', firm.id)
          .limit(3)
        
        if (lawyersError) {
          console.error(`Error fetching lawyers for firm ${firm.id} (${firm.name}):`, lawyersError)
        }
        
        const lawyers = lawyersData || []
        if (lawyers.length === 0) {
          console.warn(`⚠️ Firm ${firm.id} (${firm.name}) has no lawyers`)
        }
        
        return {
          ...firm,
          lawyers: lawyers,
          cities: {
            name: cityData.name,
            slug: cityData.slug,
            states: {
              code: stateData?.abbreviation || 'GA'
            }
          }
        }
      })
    )
    
    // Filter out firms with no lawyers
    const filteredFirms = firmsWithLawyers.filter(firm => firm.lawyers.length > 0)
    
    if (filteredFirms.length < firmsData.length) {
      console.warn(`⚠️ Filtered out ${firmsData.length - filteredFirms.length} firms with no lawyers`)
    }
    
    return filteredFirms
  } catch (error) {
    console.error('Error in getFeaturedLawyersWithFirmsByCity:', error)
    return []
  }
}

/**
 * Get content blocks by component type
 */
export async function getContentBlocks(componentType?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('content_blocks' as any)
    .select('*')
    .eq('active', true)
    .order('component_type', { ascending: true })
    .order('order_index', { ascending: true })
  
  if (componentType) {
    query = query.eq('component_type', componentType)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching content blocks:', error)
    return []
  }
  
  return data || []
}

/**
 * Get a single content block by slug
 */
export async function getContentBlockBySlug(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('content_blocks' as any)
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single()
  
  if (error) {
    console.error('Error fetching content block:', error)
    return null
  }
  
  return data
}

/**
 * Get homepage content by section
 */
export async function getHomepageContent(section?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('homepage_content' as any)
    .select('*')
    .eq('active', true)
    .order('section', { ascending: true })
    .order('order_index', { ascending: true })
  
  if (section) {
    query = query.eq('section', section)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching homepage content:', error)
    return []
  }
  
  return data || []
}

/**
 * Get site settings
 */
export async function getSiteSettings(keys?: string[]) {
  const supabase = await createClient()
  
  let query = supabase
    .from('site_settings' as any)
    .select('*')
  
  if (keys && keys.length > 0) {
    query = query.in('key', keys)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching site settings:', error)
    return []
  }
  
  return data || []
}

/**
 * Get real voices stories
 */
export async function getRealVoicesStories(limit = 10) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('real_voices_stories' as any)
    .select('*')
    .eq('status', 'published')
    .order('order_index', { ascending: true })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching real voices stories:', error)
    return []
  }
  
  return data || []
}

/**
 * Get content categories for homepage
 */
export async function getContentCategories() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('content_categories' as any)
    .select('*')
    .eq('active', true)
    .eq('featured', true)
    .order('order_index', { ascending: true })
  
  if (error) {
    console.error('Error fetching content categories:', error)
    return []
  }
  
  return data || []
}

/**
 * Get fallback lawyers (when location cannot be detected or no lawyers in location)
 */
export async function getFallbackLawyers() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('fallback_lawyers' as any)
    .select(`
      *,
      lawyers (
        *,
        law_firms (
          id,
          name,
          slug,
          cities (
            id,
            name,
            slug,
            latitude,
            longitude,
            states (
              id,
              name,
              abbreviation
            )
          )
        ),
        lawyer_service_areas (
          cities (
            id,
            name,
            slug,
            latitude,
            longitude,
            states (
              id,
              name,
              abbreviation
            )
          )
        )
      )
    `)
    .eq('active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching fallback lawyers:', error)
    return []
  }

  // Extract lawyers from the nested structure
  return (data || []).map((item: any) => item.lawyers).filter(Boolean) as Lawyer[]
}

/**
 * Get lawyers by city and state (for location-based search)
 */
export async function getLawyersByLocation(city?: string, stateCode?: string) {
  const supabase = await createClient()
  
  // First, find matching cities
  let cityIds: string[] = []
  let stateId: string | null = null

  if (city) {
    const { data: cityData } = await supabase
      .from('cities')
      .select('id')
      .or(`name.ilike.%${city}%,slug.ilike.%${city}%`)
    
    if (cityData) {
      cityIds = cityData.map(c => c.id)
    }
  }

  if (stateCode) {
    const { data: stateData } = await supabase
      .from('states')
      .select('id')
      .eq('abbreviation', stateCode.toUpperCase())
      .maybeSingle()
    
    if (stateData) {
      stateId = stateData.id
      
      // If we have a state but no city, get all cities in that state
      if (cityIds.length === 0) {
        const { data: stateCities } = await supabase
          .from('cities')
          .select('id')
          .eq('state_id', stateId)
        
        if (stateCities) {
          cityIds = stateCities.map(c => c.id)
        }
      }
    }
  }

  // If no location found, return empty
  if (cityIds.length === 0 && !stateId) {
    return []
  }

  // Get lawyers by service areas
  let lawyerIds: string[] = []
  
  if (cityIds.length > 0) {
    const { data: serviceAreas } = await supabase
      .from('lawyer_service_areas')
      .select('lawyer_id')
      .in('city_id', cityIds)
    
    if (serviceAreas) {
      lawyerIds = serviceAreas.map(sa => sa.lawyer_id)
    }

    // Also get lawyers whose firms are in these cities
    const { data: firms } = await supabase
      .from('law_firms')
      .select('id')
      .in('city_id', cityIds)
    
    if (firms && firms.length > 0) {
      const firmIds = firms.map(f => f.id)
      const { data: firmLawyers } = await supabase
        .from('lawyers')
        .select('id')
        .in('law_firm_id', firmIds)
      
      if (firmLawyers) {
        lawyerIds = [...new Set([...lawyerIds, ...firmLawyers.map(l => l.id)])]
      }
    }
  }

  // If no lawyers found by city, but we have a state, try to get lawyers by state
  if (lawyerIds.length === 0 && stateId) {
    // Get all cities in state
    const { data: stateCities } = await supabase
      .from('cities')
      .select('id')
      .eq('state_id', stateId)
    
    if (stateCities && stateCities.length > 0) {
      const stateCityIds = stateCities.map(c => c.id)
      
      // Get lawyers by service areas in state
      const { data: serviceAreas } = await supabase
        .from('lawyer_service_areas')
        .select('lawyer_id')
        .in('city_id', stateCityIds)
      
      if (serviceAreas) {
        lawyerIds = serviceAreas.map(sa => sa.lawyer_id)
      }

      // Get lawyers whose firms are in state cities
      const { data: firms } = await supabase
        .from('law_firms')
        .select('id')
        .in('city_id', stateCityIds)
      
      if (firms && firms.length > 0) {
        const firmIds = firms.map(f => f.id)
        const { data: firmLawyers } = await supabase
          .from('lawyers')
          .select('id')
          .in('law_firm_id', firmIds)
        
        if (firmLawyers) {
          lawyerIds = [...new Set([...lawyerIds, ...firmLawyers.map(l => l.id)])]
        }
      }
    }
  }

  // If still no lawyers, return empty
  if (lawyerIds.length === 0) {
    return []
  }

  // Fetch full lawyer data
  const { data, error } = await supabase
    .from('lawyers')
    .select(`
      *,
      law_firms (
        id,
        name,
        slug,
        city_id,
        cities (
          id,
          name,
          slug,
          latitude,
          longitude,
          state_id,
          states (
            id,
            name,
            abbreviation
          )
        )
      ),
      lawyer_service_areas (
        city_id,
        cities (
          id,
          name,
          slug,
          latitude,
          longitude,
          state_id,
          states (
            id,
            name,
            abbreviation
          )
        )
      )
    `)
    .in('id', lawyerIds)
    .limit(100)

  if (error) {
    console.error('Error fetching lawyers by location:', error)
    return []
  }

  return (data || []) as Lawyer[]
}

/**
 * Search lawyers by name or location
 */
export async function searchLawyers(searchTerm: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('lawyers')
    .select(`
      *,
      law_firms (
        id,
        name,
        slug,
        cities (
          id,
          name,
          slug,
          latitude,
          longitude,
          states (
            id,
            name,
            abbreviation
          )
        )
      ),
      lawyer_service_areas (
        cities (
          id,
          name,
          slug,
          latitude,
          longitude,
          states (
            id,
            name,
            abbreviation
          )
        )
      )
    `)
    .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,law_firms.name.ilike.%${searchTerm}%`)
    .limit(50)

  if (error) {
    console.error('Error searching lawyers:', error)
    return []
  }

  return (data || []) as Lawyer[]
}

/**
 * Get all lawyers with filters
 */
export async function getLawyersWithFilters(filters: {
  specializations?: string[]
  yearsExperienceMin?: number
  verified?: boolean
  featured?: boolean
  barAdmissions?: string[]
  languages?: string[]
  limit?: number
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('lawyers')
    .select(`
      *,
      law_firms (
        id,
        name,
        slug,
        cities (
          id,
          name,
          slug,
          latitude,
          longitude,
          states (
            id,
            name,
            abbreviation
          )
        )
      ),
      lawyer_service_areas (
        cities (
          id,
          name,
          slug,
          latitude,
          longitude,
          states (
            id,
            name,
            abbreviation
          )
        )
      )
    `)

  if (filters.verified !== undefined) {
    query = query.eq('verified', filters.verified)
  }

  if (filters.featured !== undefined) {
    query = query.eq('featured', filters.featured)
  }

  if (filters.yearsExperienceMin) {
    query = query.gte('years_experience', filters.yearsExperienceMin)
  }

  if (filters.specializations && filters.specializations.length > 0) {
    query = query.overlaps('specializations', filters.specializations)
  }

  if (filters.barAdmissions && filters.barAdmissions.length > 0) {
    query = query.overlaps('bar_admissions', filters.barAdmissions)
  }

  if (filters.languages && filters.languages.length > 0) {
    query = query.overlaps('languages', filters.languages)
  }

  query = query.order('created_at', { ascending: false })
  
  if (filters.limit) {
    query = query.limit(filters.limit)
  } else {
    query = query.limit(100)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching lawyers with filters:', error)
    return []
  }

  return (data || []) as Lawyer[]
}

/**
 * Get lawyers by zip code, grouped by subscription type with limits applied
 * Returns ALL lawyers in the DMA that the zip code belongs to, organized by subscription type,
 * sorted by subscription sort_order and limited to max_lawyers per subscription type for the DMA
 */
export async function getLawyersByZipCodeWithSubscriptionLimits(zipCode: string) {
  const supabase = await createClient()
  
  console.log(`\n🔍 ========================================`)
  console.log(`🔍 SEARCHING FOR ZIP CODE: ${zipCode}`)
  console.log(`🔍 ========================================`)
  
  // Step 1: Resolve DMA from zip code
  const { data: zipCodeData, error: zipError } = await supabase
    .from('zip_codes')
    .select(`
      id,
      zip_code,
      zip_code_dmas (
        dma_id,
        dmas (
          id,
          name,
          code
        )
      )
    `)
    .eq('zip_code', zipCode)
    .maybeSingle()

  let dma: { id: string; name: string; code: number } | null = null
  let dmaId: string | null = null

  if (zipError) {
    console.error('Error fetching zip code from zip_codes table:', zipError)
  } else if (zipCodeData && zipCodeData.zip_code_dmas && zipCodeData.zip_code_dmas.length > 0) {
    dma = (zipCodeData.zip_code_dmas[0] as any).dmas
    dmaId = dma.id
    console.log(`Found DMA: ${dma.name} (${dma.code}) for zip code ${zipCode}`)
  } else {
    console.warn(`\n⚠️ Zip code ${zipCode} not found in zip_codes table or not mapped to a DMA.`)
    console.warn(`   Attempting to resolve DMA using related zip codes...`)
    
    const zipPrefix = zipCode.substring(0, 3)
    console.log(`\n🔍 Step 1: Searching for related zip codes starting with ${zipPrefix} to resolve DMA for ${zipCode}`)
    
    // First, try to find a known working zip code in the same area (e.g., if searching 30342, try 30309)
    // This is a direct approach for common zip code patterns
    const knownZipCodes = [
      zipCode.substring(0, 3) + '09', // Common pattern
      zipCode.substring(0, 3) + '01', // Common pattern
      zipCode.substring(0, 3) + '02', // Common pattern
    ]
    
    console.log(`   Trying known zip code patterns first:`, knownZipCodes)
    
    for (const knownZip of knownZipCodes) {
      // First, get the zip code ID
      const { data: knownZipData, error: knownZipError } = await supabase
        .from('zip_codes')
        .select('id, zip_code')
        .eq('zip_code', knownZip)
        .maybeSingle()
      
      if (!knownZipError && knownZipData) {
        console.log(`   Found zip code ${knownZip} in database (ID: ${knownZipData.id})`)
        
        // Now query zip_code_dmas directly using the zip_code_id
        const { data: zipCodeDmaMapping, error: dmaMappingError } = await supabase
          .from('zip_code_dmas')
          .select(`
            dma_id,
            dmas (
              id,
              name,
              code
            )
          `)
          .eq('zip_code_id', knownZipData.id)
          .maybeSingle()
        
        if (!dmaMappingError && zipCodeDmaMapping) {
          const dmaData = zipCodeDmaMapping.dmas as any
          if (dmaData) {
            dma = dmaData
            dmaId = dma.id
            console.log(`\n✅ FOUND DMA: ${dma.name} (DMA ${dma.code})`)
            console.log(`   Using known zip code: ${knownZip}`)
            console.log(`   Will now fetch ALL lawyers in this DMA, not just those with zip code ${zipCode}`)
            break
          } else {
            console.warn(`   Zip code ${knownZip} has zip_code_dmas entry but dmas data is missing`)
          }
        } else if (dmaMappingError) {
          console.warn(`   Error fetching DMA mapping for ${knownZip}:`, dmaMappingError)
        } else {
          console.warn(`   Zip code ${knownZip} found but has no DMA mapping in zip_code_dmas table`)
        }
      } else if (knownZipError) {
        console.warn(`   Error fetching known zip code ${knownZip}:`, knownZipError)
      } else {
        console.warn(`   Known zip code ${knownZip} not found in database`)
      }
    }
    
    // If we still don't have a DMA, try the broader search
    if (!dmaId) {
      console.log(`   Known patterns didn't work, trying broader search...`)
      
      const { data: relatedZipCodes, error: relatedZipError } = await supabase
        .from('zip_codes')
        .select('id, zip_code')
        .like('zip_code', `${zipPrefix}%`)
        .limit(100) // Increase limit to find more potential matches

      if (relatedZipError) {
        console.error('❌ Error fetching related zip codes:', relatedZipError)
      } else if (!relatedZipCodes || relatedZipCodes.length === 0) {
        console.warn(`⚠️ No zip codes found starting with ${zipPrefix}`)
      } else {
        console.log(`✅ Found ${relatedZipCodes.length} zip codes starting with ${zipPrefix}`)
        console.log(`   Sample zip codes:`, relatedZipCodes.slice(0, 5).map((z: any) => z.zip_code))
        
        // Find the first zip code that has a DMA mapping
        // Query zip_code_dmas directly for better reliability
        let foundDMA = false
        for (const relatedZip of relatedZipCodes) {
          if (!relatedZip.id) continue
          
          // Query zip_code_dmas directly using zip_code_id
          const { data: zipCodeDmaMapping, error: dmaMappingError } = await supabase
            .from('zip_code_dmas')
            .select(`
              dma_id,
              dmas (
                id,
                name,
                code
              )
            `)
            .eq('zip_code_id', relatedZip.id)
            .maybeSingle()
          
          if (!dmaMappingError && zipCodeDmaMapping) {
            const dmaData = zipCodeDmaMapping.dmas as any
            if (dmaData) {
              dma = dmaData
              dmaId = dma.id
              console.log(`\n✅ FOUND DMA: ${dma.name} (DMA ${dma.code})`)
              console.log(`   Using related zip code: ${relatedZip.zip_code}`)
              console.log(`   Will now fetch ALL lawyers in this DMA, not just those with zip code ${zipCode}`)
              foundDMA = true
              break
            }
          }
        }
        
        if (!foundDMA) {
          console.warn(`⚠️ Found ${relatedZipCodes.length} related zip codes, but none have DMA mappings`)
          console.warn(`   Checking first few zip codes:`, relatedZipCodes.slice(0, 3).map((z: any) => ({
            zip: z.zip_code,
            hasDmaMapping: !!(z.zip_code_dmas && Array.isArray(z.zip_code_dmas) && z.zip_code_dmas.length > 0)
          })))
        }
      }
    }

    // If we still don't have a DMA, try one more approach:
    // Look for lawyers or firms with zip codes starting with the same prefix,
    // then check if their zip codes are in the zip_codes table with DMA mappings
    if (!dmaId) {
      console.log(`\n🔍 Step 2: Trying alternative approach - checking lawyers/firms with zip codes starting with ${zipPrefix}`)
      
      // Get a sample of zip codes from lawyers/firms in this area
      const { data: sampleLawyers, error: sampleError } = await supabase
        .from('lawyers')
        .select('office_zip_code')
        .like('office_zip_code', `${zipPrefix}%`)
        .not('office_zip_code', 'is', null)
        .limit(20)
      
      const { data: sampleFirms, error: firmsSampleError } = await supabase
        .from('law_firms')
        .select('zip_code')
        .like('zip_code', `${zipPrefix}%`)
        .not('zip_code', 'is', null)
        .limit(20)
      
      if (sampleError) {
        console.error('❌ Error fetching sample lawyers:', sampleError)
      }
      if (firmsSampleError) {
        console.error('❌ Error fetching sample firms:', firmsSampleError)
      }
      
      // Collect unique zip codes
      const sampleZipCodes = new Set<string>()
      if (sampleLawyers) {
        sampleLawyers.forEach((l: any) => {
          if (l.office_zip_code) sampleZipCodes.add(l.office_zip_code)
        })
      }
      if (sampleFirms) {
        sampleFirms.forEach((f: any) => {
          if (f.zip_code) sampleZipCodes.add(f.zip_code)
        })
      }
      
      console.log(`📋 Found ${sampleZipCodes.size} unique zip codes from lawyers/firms in area ${zipPrefix}`)
      if (sampleZipCodes.size > 0) {
        console.log(`   Sample zip codes:`, Array.from(sampleZipCodes).slice(0, 5))
      }
      
      // Try to find DMA for any of these zip codes
      // Query zip_code_dmas directly for better reliability
      if (sampleZipCodes.size > 0) {
        const zipCodeArray = Array.from(sampleZipCodes)
        console.log(`🔍 Checking if these zip codes have DMA mappings...`)
        
        // First get the zip code IDs
        const { data: zipCodesData, error: zipCodesError } = await supabase
          .from('zip_codes')
          .select('id, zip_code')
          .in('zip_code', zipCodeArray)
          .limit(50)
        
        if (zipCodesError) {
          console.error('❌ Error fetching zip codes:', zipCodesError)
        } else if (zipCodesData && zipCodesData.length > 0) {
          console.log(`✅ Found ${zipCodesData.length} zip codes in database`)
          
          // Now query zip_code_dmas for each zip code ID
          for (const zipCodeRow of zipCodesData) {
            const { data: zipCodeDmaMapping, error: dmaMappingError } = await supabase
              .from('zip_code_dmas')
              .select(`
                dma_id,
                dmas (
                  id,
                  name,
                  code
                )
              `)
              .eq('zip_code_id', zipCodeRow.id)
              .maybeSingle()
            
            if (!dmaMappingError && zipCodeDmaMapping) {
              const dmaData = zipCodeDmaMapping.dmas as any
              if (dmaData) {
                dma = dmaData
                dmaId = dma.id
                console.log(`\n✅ FOUND DMA: ${dma.name} (DMA ${dma.code})`)
                console.log(`   Using zip code: ${zipCodeRow.zip_code} from lawyers/firms in area`)
                break
              }
            }
          }
          
          if (!dmaId) {
            console.warn(`⚠️ None of the ${zipCodesData.length} zip codes from lawyers/firms have DMA mappings`)
          }
        } else {
          console.warn(`⚠️ None of the ${sampleZipCodes.size} zip codes from lawyers/firms exist in zip_codes table`)
        }
      } else {
        console.warn(`⚠️ No lawyers or firms found with zip codes starting with ${zipPrefix}`)
      }
    }
    
    // If we still don't have a DMA, try one final approach:
    // Query ALL lawyers with zip codes starting with the same prefix
    // This is a last resort to ensure we get results for the area
    if (!dmaId) {
      console.log(`\n🔍 Step 3: Final fallback - querying ALL lawyers with zip codes starting with ${zipPrefix}`)
      console.log(`   This ensures we get results even if DMA resolution fails`)
      
      // Query lawyers with office_zip_code starting with prefix
      const { data: lawyersByPrefix, error: prefixError } = await supabase
        .from('lawyers')
        .select(`
          *,
          law_firms (
            id,
            name,
            slug,
            zip_code,
            city_id,
            cities (
              id,
              name,
              slug,
              latitude,
              longitude,
              states (
                id,
                name,
                abbreviation
              )
            )
          ),
          lawyer_service_areas (
            city_id,
            cities (
              id,
              name,
              slug,
              latitude,
              longitude,
              states (
                id,
                name,
                abbreviation
              )
            )
          )
        `)
        .like('office_zip_code', `${zipPrefix}%`)
      
      // Query firms with zip_code starting with prefix
      const { data: firmsByPrefix, error: firmsPrefixError } = await supabase
        .from('law_firms')
        .select('id')
        .like('zip_code', `${zipPrefix}%`)
      
      let lawyersByFirmPrefix: any[] = []
      if (!firmsPrefixError && firmsByPrefix && firmsByPrefix.length > 0) {
        const firmIds = firmsByPrefix.map(f => f.id)
        const { data: lawyersByFirm, error: lawyersByFirmError } = await supabase
          .from('lawyers')
          .select(`
            *,
            law_firms (
              id,
              name,
              slug,
              zip_code,
              city_id,
              cities (
                id,
                name,
                slug,
                latitude,
                longitude,
                states (
                  id,
                  name,
                  abbreviation
                )
              )
            ),
            lawyer_service_areas (
              city_id,
              cities (
                id,
                name,
                slug,
                latitude,
                longitude,
                states (
                  id,
                  name,
                  abbreviation
                )
              )
            )
          `)
          .in('law_firm_id', firmIds)
        
        if (!lawyersByFirmError) {
          lawyersByFirmPrefix = lawyersByFirm || []
        }
      }
      
      // Combine and deduplicate
      const allLawyersByPrefix = [
        ...(lawyersByPrefix || []),
        ...lawyersByFirmPrefix
      ]
      
      const uniqueLawyers = Array.from(
        new Map(allLawyersByPrefix.map(l => [l.id, l])).values()
      )
      
      if (uniqueLawyers.length > 0) {
        console.log(`✅ Found ${uniqueLawyers.length} lawyers with zip codes starting with ${zipPrefix}`)
        console.log(`   Grouping by subscription type and applying limits...`)
        
        // Get subscription types
        const { data: subscriptionTypes, error: subTypesError } = await supabase
          .from('subscription_types')
          .select('name, display_name, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
        
        if (subTypesError) {
          console.error('Error fetching subscription types:', subTypesError)
          return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
        }
        
        // Get global limits
        const { data: globalLimits } = await supabase
          .from('subscription_limits')
          .select('subscription_type, max_lawyers')
          .eq('location_type', 'global')
          .eq('location_value', 'default')
        
        const limitsMap = new Map<string, number | null>()
        if (globalLimits) {
          globalLimits.forEach(limit => {
            limitsMap.set(limit.subscription_type, limit.max_lawyers)
          })
        }
        
        // Group by subscription type
        const groupedBySubscription: Record<string, Lawyer[]> = {}
        subscriptionTypes?.forEach(subType => {
          groupedBySubscription[subType.name] = []
        })
        
        uniqueLawyers.forEach(lawyer => {
          const subType = lawyer.subscription_type
          if (subType && groupedBySubscription[subType]) {
            groupedBySubscription[subType].push(lawyer as Lawyer)
          }
        })
        
        // Apply limits
        const limitedGroups: Record<string, Lawyer[]> = {}
        const allLawyers: Lawyer[] = []
        
        subscriptionTypes?.forEach(subType => {
          const lawyers = groupedBySubscription[subType.name] || []
          const maxLawyers = limitsMap.get(subType.name) ?? null
          
          const limitedLawyers = maxLawyers === null 
            ? lawyers 
            : lawyers.slice(0, maxLawyers)
          
          limitedGroups[subType.name] = limitedLawyers
          allLawyers.push(...limitedLawyers)
        })
        
        console.log(`✅ Returning ${allLawyers.length} lawyers grouped by subscription`)
        console.log(`   ⚠️ WARNING: Using prefix-based fallback (NOT DMA-based)`)
        console.log(`   ⚠️ DMA was not resolved, so results may not include all lawyers in the DMA`)
        
        return {
          lawyers: allLawyers,
          groupedBySubscription: limitedGroups,
          dma: null, // No DMA found - this is NOT scalable
          subscriptionTypes: subscriptionTypes || []
        }
      }
      
      // If even the prefix search returns nothing, fall back to exact zip code search
      console.error(`\n❌ ========================================`)
      console.error(`❌ ALL ATTEMPTS FAILED FOR ZIP CODE ${zipCode}`)
      console.error(`❌ Falling back to exact zip-code-only search`)
      console.error(`❌ ========================================\n`)
      return await getLawyersByZipCodeOnly(zipCode)
    }
    
    // If we found a DMA using a related zip code, continue with the normal flow
    // to get ALL lawyers in that DMA (not just those with the specific zip code)
    console.log(`\n✅ DMA RESOLVED: ${dma.name} (DMA ${dma.code})`)
    console.log(`📋 Will now fetch ALL lawyers in this DMA, not just those with zip code ${zipCode}`)
  }

  // Step 2: Get ALL zip codes in this DMA
  console.log(`\n📋 Step 2: Getting all zip codes in DMA ${dma.name}...`)
  const { data: zipCodesInDMA, error: zipCodesError } = await supabase
    .from('zip_code_dmas')
    .select(`
      zip_code_id,
      zip_codes (
        zip_code
      )
    `)
    .eq('dma_id', dmaId)

  if (zipCodesError) {
    console.error('Error fetching zip codes in DMA:', zipCodesError)
    return { lawyers: [], groupedBySubscription: {}, dma, subscriptionTypes: [] }
  }

  const zipCodeList = (zipCodesInDMA || [])
    .map((zcd: any) => zcd.zip_codes?.zip_code)
    .filter((zip: string | undefined): zip is string => !!zip)

  console.log(`✅ Found ${zipCodeList.length} zip codes in DMA ${dma.name}`)
  console.log(`   Sample zip codes:`, zipCodeList.slice(0, 10))
  console.log(`   Does list include 30309?`, zipCodeList.includes('30309'))
  console.log(`   Does list include 30342?`, zipCodeList.includes('30342'))

  if (zipCodeList.length === 0) {
    console.warn(`No zip codes found in DMA ${dma.name}`)
    return { lawyers: [], groupedBySubscription: {}, dma, subscriptionTypes: [] }
  }

  // Check if we have too many zip codes (Supabase .in() has a limit)
  if (zipCodeList.length > 1000) {
    console.warn(`⚠️ DMA has ${zipCodeList.length} zip codes, which exceeds Supabase .in() limit. Using first 1000.`)
    zipCodeList.splice(1000)
  }

  // Step 3: Find ALL lawyers in this DMA
  // Query 1: Lawyers with office_zip_code in any zip code in the DMA
  console.log(`🔍 Querying lawyers with office_zip_code in ${zipCodeList.length} zip codes...`)
  console.log(`   Sample zip codes being queried:`, zipCodeList.slice(0, 5))
  
  const { data: lawyersByOfficeZip, error: officeZipError } = await supabase
    .from('lawyers')
    .select(`
      *,
      law_firms (
        id,
        name,
        slug,
        zip_code,
        city_id,
        cities (
          id,
          name,
          slug,
          latitude,
          longitude,
          states (
            id,
            name,
            abbreviation
          )
        )
      ),
      lawyer_service_areas (
        city_id,
        cities (
          id,
          name,
          slug,
          latitude,
          longitude,
          states (
            id,
            name,
            abbreviation
          )
        )
      )
    `)
    .in('office_zip_code', zipCodeList)

  if (officeZipError) {
    console.error('❌ Error finding lawyers by office_zip_code in DMA:', officeZipError)
    console.error('   Error details:', JSON.stringify(officeZipError, null, 2))
  } else {
    console.log(`✅ Found ${lawyersByOfficeZip?.length || 0} lawyers by office_zip_code`)
    if (lawyersByOfficeZip && lawyersByOfficeZip.length > 0) {
      console.log(`   Sample lawyer zip codes:`, lawyersByOfficeZip.slice(0, 3).map((l: any) => l.office_zip_code))
    }
  }

  // Query 2: Lawyers whose law firm has zip_code in any zip code in the DMA
  console.log(`🔍 Querying law firms with zip_code in ${zipCodeList.length} zip codes...`)
  const { data: firmsWithZip, error: firmsError } = await supabase
    .from('law_firms')
    .select('id')
    .in('zip_code', zipCodeList)

  if (firmsError) {
    console.error('❌ Error finding firms by zip_code in DMA:', firmsError)
    console.error('   Error details:', JSON.stringify(firmsError, null, 2))
  } else {
    console.log(`✅ Found ${firmsWithZip?.length || 0} firms by zip_code`)
    if (firmsWithZip && firmsWithZip.length > 0) {
      console.log(`   Sample firm IDs:`, firmsWithZip.slice(0, 5).map((f: any) => f.id))
    }
  }

  let lawyersByFirmZip: any[] = []
  if (!firmsError && firmsWithZip && firmsWithZip.length > 0) {
    console.log(`🔍 Querying lawyers for ${firmsWithZip.length} firms...`)
    const firmIds = firmsWithZip.map(f => f.id)
    const { data: lawyersByFirm, error: lawyersByFirmError } = await supabase
      .from('lawyers')
      .select(`
        *,
        law_firms (
          id,
          name,
          slug,
          zip_code,
          city_id,
          cities (
            id,
            name,
            slug,
            latitude,
            longitude,
            states (
              id,
              name,
              abbreviation
            )
          )
        ),
        lawyer_service_areas (
          dma_id,
          dmas (
            id,
            name,
            code
          )
        )
      `)
      .in('law_firm_id', firmIds)

    if (lawyersByFirmError) {
      console.error('Error finding lawyers by law_firm zip_code in DMA:', lawyersByFirmError)
    } else {
      lawyersByFirmZip = lawyersByFirm || []
    }
  }

  // Query 3: Lawyers who have this DMA in their service areas
  console.log(`🔍 Querying lawyers with DMA ${dmaId} in service areas...`)
  const { data: serviceAreaLawyers, error: serviceAreaError } = await supabase
    .from('lawyer_service_areas')
    .select(`
      lawyer_id,
      dma_id,
      lawyers (
        *,
        law_firms (
          id,
          name,
          slug,
          zip_code,
          city_id,
          cities (
            id,
            name,
            slug,
            latitude,
            longitude,
            states (
              id,
              name,
              abbreviation
            )
          )
        ),
        lawyer_service_areas (
          dma_id,
          dmas (
            id,
            name,
            code
          )
        )
      )
    `)
    .eq('dma_id', dmaId)

  let lawyersByServiceArea: any[] = []
  if (serviceAreaError) {
    console.error('Error finding lawyers by service area DMA:', serviceAreaError)
  } else if (serviceAreaLawyers) {
    lawyersByServiceArea = serviceAreaLawyers
      .map((sa: any) => sa.lawyers)
      .filter((l: any) => l !== null)
    console.log(`✅ Found ${lawyersByServiceArea.length} lawyers with DMA ${dmaId} in service areas`)
  }

  // Combine results and remove duplicates
  const allLawyersInDMA = [
    ...(lawyersByOfficeZip || []),
    ...lawyersByFirmZip,
    ...lawyersByServiceArea
  ]
  
  console.log(`📊 Combined ${allLawyersInDMA.length} lawyers before deduplication`)
  
  // Remove duplicates by lawyer ID
  const uniqueLawyers = Array.from(
    new Map(allLawyersInDMA.map(l => [l.id, l])).values()
  )

  console.log(`✅ Found ${uniqueLawyers.length} unique lawyers in DMA ${dma.name}`)
  console.log(`   - ${lawyersByOfficeZip?.length || 0} by office_zip_code`)
  console.log(`   - ${lawyersByFirmZip.length} by law_firm zip_code`)
  console.log(`   - ${lawyersByServiceArea.length} by service area DMA`)
  console.log(`   - ${allLawyersInDMA.length - uniqueLawyers.length} duplicates removed`)

  if (uniqueLawyers.length === 0) {
    console.warn(`No lawyers found in DMA ${dma.name}`)
    return { lawyers: [], groupedBySubscription: {}, dma, subscriptionTypes: [] }
  }

  const lawyersInDMA = uniqueLawyers as Lawyer[]

  // Step 4: Get subscription types with sort_order
  const { data: subscriptionTypes, error: subTypesError } = await supabase
    .from('subscription_types')
    .select('name, display_name, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (subTypesError) {
    console.error('Error fetching subscription types:', subTypesError)
    return { lawyers: [], groupedBySubscription: {}, dma, subscriptionTypes: [] }
  }

  // Step 5: Get subscription limits (DMA-specific if available, otherwise global)
  let subscriptionLimits: any[] = []
  let limitsError: any = null

  if (dmaId) {
    // Try DMA-specific limits first
    // Note: location_value stores DMA UUID as TEXT, so ensure dmaId is a string
    const { data: dmaLimits, error: dmaLimitsError } = await supabase
      .from('subscription_limits')
      .select('subscription_type, max_lawyers')
      .eq('location_type', 'dma')
      .eq('location_value', String(dmaId))
    
    subscriptionLimits = dmaLimits || []
    limitsError = dmaLimitsError
  }

  if (limitsError) {
    console.error('Error fetching DMA subscription limits:', limitsError)
  }

  // Create a map of subscription type to max lawyers
  const limitsMap = new Map<string, number | null>()
  if (subscriptionLimits) {
    subscriptionLimits.forEach(limit => {
      limitsMap.set(limit.subscription_type, limit.max_lawyers)
    })
  }

  // Also get global limits as fallback
  const { data: globalLimits } = await supabase
    .from('subscription_limits')
    .select('subscription_type, max_lawyers')
    .eq('location_type', 'global')
    .eq('location_value', 'default')

  if (globalLimits) {
    globalLimits.forEach(limit => {
      if (!limitsMap.has(limit.subscription_type)) {
        limitsMap.set(limit.subscription_type, limit.max_lawyers)
      }
    })
  }

  // Step 6: Get DMA-level subscriptions for all lawyers and group by subscription type
  const groupedBySubscription: Record<string, Lawyer[]> = {}
  
  subscriptionTypes?.forEach(subType => {
    groupedBySubscription[subType.name] = []
  })

  // Fetch all subscriptions for these lawyers in this DMA
  const lawyerIds = lawyersInDMA.map(l => l.id)
  const { data: dmaSubscriptions, error: subsError } = await supabase
    .from('lawyer_dma_subscriptions')
    .select('lawyer_id, subscription_type')
    .eq('dma_id', dmaId)
    .in('lawyer_id', lawyerIds)
  
  if (subsError) {
    console.error('Error fetching DMA subscriptions:', subsError)
  }
  
  // Create a map of lawyer_id -> subscription_type for this DMA
  const subscriptionMap = new Map<string, string>()
  if (dmaSubscriptions) {
    dmaSubscriptions.forEach(sub => {
      subscriptionMap.set(sub.lawyer_id, sub.subscription_type)
    })
  }

  lawyersInDMA.forEach(lawyer => {
    // Use DMA-specific subscription if available, otherwise fall back to lawyer's default
    const subType = subscriptionMap.get(lawyer.id) || lawyer.subscription_type || 'free'
    if (subType && groupedBySubscription[subType]) {
      groupedBySubscription[subType].push(lawyer)
    }
  })

  // Step 7: Apply limits to each subscription type
  const limitedGroups: Record<string, Lawyer[]> = {}
  const allLawyers: Lawyer[] = []

  subscriptionTypes?.forEach(subType => {
    const lawyers = groupedBySubscription[subType.name] || []
    const maxLawyers = limitsMap.get(subType.name) ?? null
    
    // If maxLawyers is null, it means unlimited
    // Otherwise, limit to maxLawyers
    const limitedLawyers = maxLawyers === null 
      ? lawyers 
      : lawyers.slice(0, maxLawyers)
    
    limitedGroups[subType.name] = limitedLawyers
    allLawyers.push(...limitedLawyers)
  })

  console.log(`\n✅ ========================================`)
  console.log(`✅ FINAL RESULTS FOR ZIP CODE ${zipCode}`)
  console.log(`✅ DMA: ${dma.name} (${dma.code})`)
  console.log(`✅ Total lawyers: ${allLawyers.length}`)
  console.log(`✅ Subscription groups: ${Object.keys(limitedGroups).length}`)
  console.log(`✅ Group counts:`, Object.keys(limitedGroups).map(key => `${key}: ${limitedGroups[key].length}`))
  if (allLawyers.length === 0) {
    console.error(`❌ WARNING: No lawyers found despite DMA resolution!`)
    console.error(`   This suggests the query for lawyers in DMA failed or returned no results.`)
    console.error(`   Check if lawyers have office_zip_code matching zip codes in the DMA.`)
  }
  console.log(`✅ ========================================\n`)
  
  return {
    lawyers: allLawyers,
    groupedBySubscription: limitedGroups,
    dma,
    subscriptionTypes: subscriptionTypes || []
  }
}

/**
 * Fallback function: Get lawyers by zip code only (when DMA is not found)
 * This is used when a zip code doesn't map to a DMA
 */
async function getLawyersByZipCodeOnly(zipCode: string) {
  const supabase = await createClient()
  
  console.log(`Fallback: Searching for lawyers with zip code: ${zipCode} (no DMA mapping found)`)
  
  // Query 1: Lawyers with office_zip_code matching
  const { data: lawyersByOfficeZip, error: officeZipError } = await supabase
    .from('lawyers')
    .select(`
      *,
      law_firms (
        id,
        name,
        slug,
        zip_code,
        city_id,
        cities (
          id,
          name,
          slug,
          latitude,
          longitude,
          states (
            id,
            name,
            abbreviation
          )
        )
      ),
      lawyer_service_areas (
        city_id,
        cities (
          id,
          name,
          slug,
          latitude,
          longitude,
          states (
            id,
            name,
            abbreviation
          )
        )
      )
    `)
    .eq('office_zip_code', zipCode)

  if (officeZipError) {
    console.error('Error finding lawyers by office_zip_code:', officeZipError)
  }

  // Query 2: Lawyers whose law firm has matching zip_code
  const { data: firmsWithZip, error: firmsError } = await supabase
    .from('law_firms')
    .select('id')
    .eq('zip_code', zipCode)

  let lawyersByFirmZip: any[] = []
  if (!firmsError && firmsWithZip && firmsWithZip.length > 0) {
    const firmIds = firmsWithZip.map(f => f.id)
    const { data: lawyersByFirm, error: lawyersByFirmError } = await supabase
      .from('lawyers')
      .select(`
        *,
        law_firms (
          id,
          name,
          slug,
          zip_code,
          city_id,
          cities (
            id,
            name,
            slug,
            latitude,
            longitude,
            states (
              id,
              name,
              abbreviation
            )
          )
        ),
        lawyer_service_areas (
          city_id,
          cities (
            id,
            name,
            slug,
            latitude,
            longitude,
            states (
              id,
              name,
              abbreviation
            )
          )
        )
      `)
      .in('law_firm_id', firmIds)

    if (lawyersByFirmError) {
      console.error('Error finding lawyers by law_firm zip_code:', lawyersByFirmError)
    } else {
      lawyersByFirmZip = lawyersByFirm || []
    }
  }

  // Combine results and remove duplicates
  const allLawyersByZip = [
    ...(lawyersByOfficeZip || []),
    ...lawyersByFirmZip
  ]
  
  // Remove duplicates by lawyer ID
  const uniqueLawyers = Array.from(
    new Map(allLawyersByZip.map(l => [l.id, l])).values()
  )

  console.log(`Found ${uniqueLawyers.length} lawyers with zip code ${zipCode} (${lawyersByOfficeZip?.length || 0} by office_zip_code, ${lawyersByFirmZip.length} by law_firm zip_code)`)

  // Get subscription types and apply global limits
  const { data: subscriptionTypes, error: subTypesError } = await supabase
    .from('subscription_types')
    .select('name, display_name, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (subTypesError) {
    console.error('Error fetching subscription types:', subTypesError)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  // Get global limits
  const { data: globalLimits } = await supabase
    .from('subscription_limits')
    .select('subscription_type, max_lawyers')
    .eq('location_type', 'global')
    .eq('location_value', 'default')

  const limitsMap = new Map<string, number | null>()
  if (globalLimits) {
    globalLimits.forEach(limit => {
      limitsMap.set(limit.subscription_type, limit.max_lawyers)
    })
  }

  // Group lawyers by subscription type
  const groupedBySubscription: Record<string, Lawyer[]> = {}
  
  subscriptionTypes?.forEach(subType => {
    groupedBySubscription[subType.name] = []
  })

  uniqueLawyers.forEach(lawyer => {
    const subType = lawyer.subscription_type
    if (subType && groupedBySubscription[subType]) {
      groupedBySubscription[subType].push(lawyer as Lawyer)
    }
  })

  // Apply limits
  const limitedGroups: Record<string, Lawyer[]> = {}
  const allLawyers: Lawyer[] = []

  subscriptionTypes?.forEach(subType => {
    const lawyers = groupedBySubscription[subType.name] || []
    const maxLawyers = limitsMap.get(subType.name) ?? null
    
    const limitedLawyers = maxLawyers === null 
      ? lawyers 
      : lawyers.slice(0, maxLawyers)
    
    limitedGroups[subType.name] = limitedLawyers
    allLawyers.push(...limitedLawyers)
  })

  return {
    lawyers: allLawyers,
    groupedBySubscription: limitedGroups,
    dma: null,
    subscriptionTypes: subscriptionTypes || []
  }
}

/**
 * Get lawyers by name within a specified distance from a zip code
 * Searches for lawyers matching the name within maxMiles of the zip code
 */
export async function getLawyersByNameWithDistance(
  zipCode: string,
  name: string,
  maxMiles: number = 200
): Promise<{
  lawyers: Lawyer[]
  groupedBySubscription: Record<string, Lawyer[]>
  dma: { id: string; name: string; code: number } | null
  subscriptionTypes: Array<{ name: string; display_name: string; sort_order: number }>
}> {
  const supabase = await createClient()

  // Step 1: Geocode the zip code to get coordinates
  console.log(`\n🔍 Searching for lawyers named "${name}" within ${maxMiles} miles of zip code ${zipCode}`)
  const zipCoordinates = await geocodeAddress(zipCode)
  
  if (!zipCoordinates) {
    console.error(`❌ Could not geocode zip code ${zipCode}`)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  console.log(`📍 Zip code ${zipCode} coordinates: ${zipCoordinates.latitude}, ${zipCoordinates.longitude}`)

  // Step 2: Get all cities with coordinates
  const { data: allCities, error: citiesError } = await supabase
    .from('cities')
    .select('id, name, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (citiesError) {
    console.error('Error fetching cities:', citiesError)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  // Step 3: Filter cities within maxMiles
  const citiesWithinRadius = (allCities || []).filter(city => {
    if (!city.latitude || !city.longitude) return false
    const distance = calculateDistance(
      zipCoordinates,
      { latitude: city.latitude, longitude: city.longitude }
    )
    return distance <= maxMiles
  })

  console.log(`✅ Found ${citiesWithinRadius.length} cities within ${maxMiles} miles`)

  if (citiesWithinRadius.length === 0) {
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  const cityIds = citiesWithinRadius.map(c => c.id)

  // Step 4: Get all zip codes for these cities
  const { data: zipCodesData, error: zipCodesError } = await supabase
    .from('zip_codes')
    .select('id, zip_code, city_id')
    .in('city_id', cityIds)

  if (zipCodesError) {
    console.error('Error fetching zip codes:', zipCodesError)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  const zipCodeList = (zipCodesData || []).map(z => z.zip_code).filter((z): z is string => !!z)
  console.log(`✅ Found ${zipCodeList.length} zip codes in cities within ${maxMiles} miles`)

  if (zipCodeList.length === 0) {
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  // Step 5: Get unique DMAs for these zip codes
  const zipCodeIds = (zipCodesData || []).map(z => z.id)
  const { data: zipCodeDmas, error: dmaError } = await supabase
    .from('zip_code_dmas')
    .select(`
      dma_id,
      dmas (
        id,
        name,
        code
      )
    `)
    .in('zip_code_id', zipCodeIds)

  if (dmaError) {
    console.error('Error fetching DMAs:', dmaError)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  const uniqueDmaIds = new Set<string>()
  const dmaMap = new Map<string, { id: string; name: string; code: number }>()
  
  ;(zipCodeDmas || []).forEach((zcd: any) => {
    const dma = zcd.dmas as any
    if (dma && dma.id) {
      uniqueDmaIds.add(dma.id)
      if (!dmaMap.has(dma.id)) {
        dmaMap.set(dma.id, { id: dma.id, name: dma.name, code: dma.code })
      }
    }
  })

  console.log(`✅ Found ${uniqueDmaIds.size} unique DMAs`)

  // Step 6: Search for lawyers by name first (without zip code filter)
  // This ensures we find lawyers even if their zip code isn't in the cities table
  const nameParts = name.trim().split(/\s+/)
  let lawyersQuery = supabase
    .from('lawyers')
    .select(`
      *,
      law_firms (
        id,
        name,
        slug,
        zip_code,
        city_id,
        cities (
          id,
          name,
          slug,
          latitude,
          longitude,
          states (
            id,
            name,
            abbreviation
          )
        )
      ),
      lawyer_service_areas (
        city_id,
        cities (
          id,
          name,
          slug,
          latitude,
          longitude,
          states (
            id,
            name,
            abbreviation
          )
        )
      )
    `)

  // Apply name filter - search in first_name and last_name
  if (nameParts.length === 1) {
    // Single word - search in both first and last name
    lawyersQuery = lawyersQuery.or(`first_name.ilike.%${nameParts[0]}%,last_name.ilike.%${nameParts[0]}%`)
  } else {
    // Multiple words - first word in first_name, rest in last_name
    lawyersQuery = lawyersQuery.ilike('first_name', `%${nameParts[0]}%`)
    if (nameParts.length > 1) {
      const lastName = nameParts.slice(1).join(' ')
      lawyersQuery = lawyersQuery.ilike('last_name', `%${lastName}%`)
    }
  }

  const { data: lawyersData, error: lawyersError } = await lawyersQuery

  if (lawyersError) {
    console.error('Error searching lawyers by name:', lawyersError)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  console.log(`✅ Found ${(lawyersData || []).length} lawyers matching name "${name}" (before distance filter)`)

  // Step 7: Filter lawyers to only those within maxMiles (using city coordinates or zip code geocoding)
  const filteredLawyers = (lawyersData || []).filter((lawyer: any) => {
    // Check firm city coordinates first
    const firmCity = lawyer.law_firms?.cities
    if (firmCity?.latitude && firmCity?.longitude) {
      const distance = calculateDistance(
        zipCoordinates,
        { latitude: firmCity.latitude, longitude: firmCity.longitude }
      )
      if (distance <= maxMiles) return true
    }

    // Check service area cities
    const serviceAreas = lawyer.lawyer_service_areas || []
    for (const area of serviceAreas) {
      const city = area.cities
      if (city?.latitude && city?.longitude) {
        const distance = calculateDistance(
          zipCoordinates,
          { latitude: city.latitude, longitude: city.longitude }
        )
        if (distance <= maxMiles) return true
      }
    }

    // Fallback: If no city coordinates, try geocoding the office zip code
    if (lawyer.office_zip_code) {
      // Check if this zip code is in our list of zip codes within radius
      // (we already have this list from Step 4)
      if (zipCodeList.includes(lawyer.office_zip_code)) {
        return true
      }
    }

    // Also check firm zip code
    if (lawyer.law_firms?.zip_code) {
      if (zipCodeList.includes(lawyer.law_firms.zip_code)) {
        return true
      }
    }

    return false
  }) as Lawyer[]

  console.log(`✅ Found ${filteredLawyers.length} lawyers matching name "${name}" within ${maxMiles} miles`)

  // Step 8: Get subscription types
  const { data: subscriptionTypes, error: subTypesError } = await supabase
    .from('subscription_types')
    .select('name, display_name, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (subTypesError) {
    console.error('Error fetching subscription types:', subTypesError)
    return { lawyers: filteredLawyers, groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  // Step 9: Group by subscription type and apply limits per DMA
  const groupedBySubscription: Record<string, Lawyer[]> = {}
  subscriptionTypes?.forEach(subType => {
    groupedBySubscription[subType.name] = []
  })

  // Group lawyers by DMA and subscription type, then apply limits
  const dmaGroups = new Map<string, Map<string, Lawyer[]>>()
  
  filteredLawyers.forEach(lawyer => {
    // Determine which DMA this lawyer belongs to
    const lawyerZip = lawyer.office_zip_code
    if (!lawyerZip) return

    const zipCodeRow = zipCodesData?.find(z => z.zip_code === lawyerZip)
    if (!zipCodeRow) return

    // Find DMA for this zip code
    const zipCodeDma = zipCodeDmas?.find((zcd: any) => zcd.zip_code_id === zipCodeRow.id)
    if (!zipCodeDma) return

    const dmaId = (zipCodeDma.dmas as any)?.id
    if (!dmaId) return

    if (!dmaGroups.has(dmaId)) {
      dmaGroups.set(dmaId, new Map())
      subscriptionTypes?.forEach(subType => {
        dmaGroups.get(dmaId)!.set(subType.name, [])
      })
    }

    const subType = lawyer.subscription_type
    if (subType && dmaGroups.get(dmaId)!.has(subType)) {
      dmaGroups.get(dmaId)!.get(subType)!.push(lawyer)
    }
  })

  // Apply subscription limits per DMA
  const limitedGroups: Record<string, Lawyer[]> = {}
  subscriptionTypes?.forEach(subType => {
    limitedGroups[subType.name] = []
  })

  for (const [dmaId, subTypeGroups] of dmaGroups.entries()) {
    // Get limits for this DMA
    const { data: dmaLimits } = await supabase
      .from('subscription_limits')
      .select('subscription_type, max_lawyers')
      .eq('location_type', 'dma')
      .eq('location_value', String(dmaId))

    const { data: globalLimits } = await supabase
      .from('subscription_limits')
      .select('subscription_type, max_lawyers')
      .eq('location_type', 'global')
      .eq('location_value', 'default')

    const limitsMap = new Map<string, number | null>()
    if (dmaLimits) {
      dmaLimits.forEach(limit => {
        limitsMap.set(limit.subscription_type, limit.max_lawyers)
      })
    }
    if (globalLimits) {
      globalLimits.forEach(limit => {
        if (!limitsMap.has(limit.subscription_type)) {
          limitsMap.set(limit.subscription_type, limit.max_lawyers)
        }
      })
    }

    // Apply limits
    subscriptionTypes?.forEach(subType => {
      const lawyers = subTypeGroups.get(subType.name) || []
      const maxLawyers = limitsMap.get(subType.name) ?? null
      const limited = maxLawyers === null ? lawyers : lawyers.slice(0, maxLawyers)
      limitedGroups[subType.name].push(...limited)
    })
  }

  // Use first DMA found (or null if multiple)
  const firstDma = dmaMap.size === 1 ? Array.from(dmaMap.values())[0] : null

  return {
    lawyers: Object.values(limitedGroups).flat(),
    groupedBySubscription: limitedGroups,
    dma: firstDma,
    subscriptionTypes: subscriptionTypes || []
  }
}

/**
 * Get lawyers by state - finds all DMAs in the state and shows lawyers from all DMAs
 */
export async function getLawyersByStateWithSubscriptionLimits(
  stateNameOrAbbr: string
): Promise<{
  lawyers: Lawyer[]
  groupedBySubscription: Record<string, Lawyer[]>
  dma: { id: string; name: string; code: number } | null
  subscriptionTypes: Array<{ name: string; display_name: string; sort_order: number }>
}> {
  const supabase = await createClient()

  console.log(`\n🔍 Searching for lawyers in state: ${stateNameOrAbbr}`)

  // Step 1: Find state by name or abbreviation
  const { data: stateData, error: stateError } = await supabase
    .from('states')
    .select('id, name, abbreviation')
    .or(`name.ilike.%${stateNameOrAbbr}%,abbreviation.ilike.%${stateNameOrAbbr}%`)
    .maybeSingle()

  if (stateError) {
    console.error(`❌ Error finding state "${stateNameOrAbbr}":`, stateError)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  if (!stateData) {
    console.error(`❌ State not found: "${stateNameOrAbbr}"`)
    console.error(`   Searched for: name.ilike.%${stateNameOrAbbr}% OR abbreviation.ilike.%${stateNameOrAbbr}%`)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  console.log(`✅ Found state: ${stateData.name} (${stateData.abbreviation})`)

  // Step 2: Get all cities in this state first
  const { data: citiesData, error: citiesError } = await supabase
    .from('cities')
    .select('id')
    .eq('state_id', stateData.id)

  if (citiesError) {
    console.error('Error fetching cities:', citiesError)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  const cityIds = (citiesData || []).map(c => c.id)
  console.log(`✅ Found ${cityIds.length} cities in ${stateData.name}`)

  if (cityIds.length === 0) {
    console.warn(`⚠️ No cities found for state ${stateData.name}`)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  // Step 3: Get all zip codes for these cities
  const { data: zipCodesData, error: zipCodesError } = await supabase
    .from('zip_codes')
    .select('id, zip_code')
    .in('city_id', cityIds)

  if (zipCodesError) {
    console.error('Error fetching zip codes:', zipCodesError)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  const zipCodeList = (zipCodesData || []).map(z => z.zip_code).filter((z): z is string => !!z)
  const zipCodeIds = (zipCodesData || []).map(z => z.id)

  console.log(`✅ Found ${zipCodeList.length} zip codes in ${stateData.name}`)

  if (zipCodeList.length === 0) {
    console.warn(`⚠️ No zip codes found for state ${stateData.name}`)
    console.warn(`   Attempting fallback: searching for lawyers by firm state...`)
    
    // Fallback: Try to find lawyers whose firms are in this state
    const { data: firmsInState, error: firmsError } = await supabase
      .from('law_firms')
      .select(`
        id,
        cities!inner (
          state_id
        )
      `)
      .eq('cities.state_id', stateData.id)
    
    if (firmsError) {
      console.error('Error in fallback firm search:', firmsError)
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
    }
    
    if (!firmsInState || firmsInState.length === 0) {
      console.warn(`⚠️ No firms found in state ${stateData.name}`)
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
    }
    
    const firmIds = firmsInState.map(f => f.id)
    const { data: lawyersByFirm, error: lawyersError } = await supabase
      .from('lawyers')
      .select(`
        *,
        law_firms (
          id,
          name,
          slug,
          zip_code,
          city_id,
          cities (
            id,
            name,
            slug,
            latitude,
            longitude,
            states (
              id,
              name,
              abbreviation
            )
          )
        ),
        lawyer_service_areas (
          city_id,
          cities (
            id,
            name,
            slug,
            latitude,
            longitude,
            states (
              id,
              name,
              abbreviation
            )
          )
        )
      `)
      .in('law_firm_id', firmIds)
    
    if (lawyersError) {
      console.error('Error fetching lawyers by firm:', lawyersError)
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
    }
    
    const fallbackLawyers = (lawyersByFirm || []) as Lawyer[]
    console.log(`✅ Fallback: Found ${fallbackLawyers.length} lawyers via firm state search`)
    
    if (fallbackLawyers.length === 0) {
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
    }
    
    // Get subscription types and group
    const { data: subscriptionTypes, error: subTypesError } = await supabase
      .from('subscription_types')
      .select('name, display_name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    
    if (subTypesError) {
      console.error('Error fetching subscription types:', subTypesError)
      return { lawyers: fallbackLawyers, groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
    }
    
    // Group by subscription type (no limits applied in fallback)
    const groupedBySubscription: Record<string, Lawyer[]> = {}
    subscriptionTypes?.forEach(subType => {
      groupedBySubscription[subType.name] = []
    })
    
    fallbackLawyers.forEach(lawyer => {
      const subType = lawyer.subscription_type
      if (subType && groupedBySubscription[subType]) {
        groupedBySubscription[subType].push(lawyer)
      }
    })
    
    return {
      lawyers: fallbackLawyers,
      groupedBySubscription,
      dma: null,
      subscriptionTypes: subscriptionTypes || []
    }
  }

  // Step 4: Get all unique DMAs for these zip codes
  const { data: zipCodeDmas, error: dmaError } = await supabase
    .from('zip_code_dmas')
    .select(`
      dma_id,
      dmas (
        id,
        name,
        code
      )
    `)
    .in('zip_code_id', zipCodeIds)

  if (dmaError) {
    console.error('Error fetching DMAs:', dmaError)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  const uniqueDmaIds = new Set<string>()
  const dmaMap = new Map<string, { id: string; name: string; code: number }>()
  
  ;(zipCodeDmas || []).forEach((zcd: any) => {
    const dma = zcd.dmas as any
    if (dma && dma.id) {
      uniqueDmaIds.add(dma.id)
      if (!dmaMap.has(dma.id)) {
        dmaMap.set(dma.id, { id: dma.id, name: dma.name, code: dma.code })
      }
    }
  })

  console.log(`✅ Found ${uniqueDmaIds.size} unique DMAs in ${stateData.name}`)

  if (uniqueDmaIds.size === 0) {
    console.warn(`⚠️ No DMAs found for zip codes in state ${stateData.name}`)
    console.warn(`   This means zip codes in ${stateData.name} are not mapped to DMAs`)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  // Step 5: For each DMA, fetch lawyers (similar to zip code search logic)
  // We'll fetch all lawyers from all DMAs, then group by subscription type
  const allLawyers: Lawyer[] = []
  const lawyersByDma = new Map<string, Lawyer[]>()

  for (const dmaId of uniqueDmaIds) {
    // Get all zip codes for this DMA
    const { data: dmaZipCodes, error: dmaZipError } = await supabase
      .from('zip_code_dmas')
      .select(`
        zip_code_id,
        zip_codes (
          zip_code
        )
      `)
      .eq('dma_id', dmaId)

    if (dmaZipError) {
      console.error(`Error fetching zip codes for DMA ${dmaId}:`, dmaZipError)
      continue
    }

    const dmaZipCodeList = (dmaZipCodes || [])
      .map((zcd: any) => zcd.zip_codes?.zip_code)
      .filter((zip: string | undefined): zip is string => !!zip)

    if (dmaZipCodeList.length === 0) continue

    // Limit zip codes to avoid Supabase .in() limit
    const limitedZipCodes = dmaZipCodeList.length > 1000 ? dmaZipCodeList.slice(0, 1000) : dmaZipCodeList

    // Fetch lawyers with office_zip_code in this DMA
    const { data: lawyersByOfficeZip, error: officeZipError } = await supabase
      .from('lawyers')
      .select(`
        *,
        law_firms (
          id,
          name,
          slug,
          zip_code,
          city_id,
          cities (
            id,
            name,
            slug,
            latitude,
            longitude,
            states (
              id,
              name,
              abbreviation
            )
          )
        ),
        lawyer_service_areas (
          city_id,
          cities (
            id,
            name,
            slug,
            latitude,
            longitude,
            states (
              id,
              name,
              abbreviation
            )
          )
        )
      `)
      .in('office_zip_code', limitedZipCodes)

    // Fetch lawyers whose firms are in this DMA
    const { data: firmsInDma, error: firmsError } = await supabase
      .from('law_firms')
      .select('id')
      .in('zip_code', limitedZipCodes)

    let lawyersByFirm: Lawyer[] = []
    if (!firmsError && firmsInDma && firmsInDma.length > 0) {
      const firmIds = firmsInDma.map(f => f.id)
      const { data: lawyersByFirmData, error: lawyersByFirmError } = await supabase
        .from('lawyers')
        .select(`
          *,
          law_firms (
            id,
            name,
            slug,
            zip_code,
            city_id,
            cities (
              id,
              name,
              slug,
              latitude,
              longitude,
              states (
                id,
                name,
                abbreviation
              )
            )
          ),
          lawyer_service_areas (
            city_id,
            cities (
              id,
              name,
              slug,
              latitude,
              longitude,
              states (
                id,
                name,
                abbreviation
              )
            )
          )
        `)
        .in('law_firm_id', firmIds)

      if (!lawyersByFirmError) {
        lawyersByFirm = (lawyersByFirmData || []) as Lawyer[]
      }
    }

    // Combine and deduplicate
    const dmaLawyers = [
      ...(lawyersByOfficeZip || []),
      ...lawyersByFirm
    ]
    const uniqueDmaLawyers = Array.from(
      new Map(dmaLawyers.map(l => [l.id, l])).values()
    ) as Lawyer[]

    lawyersByDma.set(dmaId, uniqueDmaLawyers)
    allLawyers.push(...uniqueDmaLawyers)
  }

  // Deduplicate all lawyers
  const uniqueLawyers = Array.from(
    new Map(allLawyers.map(l => [l.id, l])).values()
  ) as Lawyer[]

  console.log(`✅ Found ${uniqueLawyers.length} total lawyers across ${uniqueDmaIds.size} DMAs`)

  if (uniqueLawyers.length === 0) {
    console.warn(`⚠️ No lawyers found in any DMA for state ${stateData.name}`)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  // Step 6: Get subscription types
  const { data: subscriptionTypes, error: subTypesError } = await supabase
    .from('subscription_types')
    .select('name, display_name, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (subTypesError) {
    console.error('Error fetching subscription types:', subTypesError)
    return { lawyers: uniqueLawyers, groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  // Step 7: Group by subscription type and apply limits per DMA
  // For lawyers in multiple DMAs, use their highest subscription (lowest sort_order)
  const groupedBySubscription: Record<string, Lawyer[]> = {}
  subscriptionTypes?.forEach(subType => {
    groupedBySubscription[subType.name] = []
  })

  // Track which DMAs each lawyer appears in
  const lawyerDmaMap = new Map<string, string[]>()
  for (const [dmaId, dmaLawyers] of lawyersByDma.entries()) {
    dmaLawyers.forEach(lawyer => {
      if (!lawyerDmaMap.has(lawyer.id)) {
        lawyerDmaMap.set(lawyer.id, [])
      }
      lawyerDmaMap.get(lawyer.id)!.push(dmaId)
    })
  }

  // Get subscriptions for all lawyer-DMA pairs
  const allLawyerIds = Array.from(lawyerDmaMap.keys())
  const { data: allSubscriptions, error: allSubsError } = await supabase
    .from('lawyer_dma_subscriptions')
    .select('lawyer_id, dma_id, subscription_type')
    .in('lawyer_id', allLawyerIds)
  
  if (allSubsError) {
    console.error('Error fetching all DMA subscriptions:', allSubsError)
  }

  // Create a map: lawyer_id -> { dma_id -> subscription_type }
  const lawyerSubscriptionsMap = new Map<string, Map<string, string>>()
  if (allSubscriptions) {
    allSubscriptions.forEach(sub => {
      if (!lawyerSubscriptionsMap.has(sub.lawyer_id)) {
        lawyerSubscriptionsMap.set(sub.lawyer_id, new Map())
      }
      lawyerSubscriptionsMap.get(sub.lawyer_id)!.set(sub.dma_id, sub.subscription_type)
    })
  }

  // For each unique lawyer, determine their subscription
  // If in multiple DMAs, pick the highest subscription (lowest sort_order)
  const uniqueLawyersMap = new Map<string, { lawyer: Lawyer; subscription: string }>()
  
  for (const [dmaId, dmaLawyers] of lawyersByDma.entries()) {
    for (const lawyer of dmaLawyers) {
      if (!uniqueLawyersMap.has(lawyer.id)) {
        // First time seeing this lawyer - determine their subscription
        const lawyerDmas = lawyerDmaMap.get(lawyer.id) || []
        const subscriptions = lawyerSubscriptionsMap.get(lawyer.id)
        
        let subscriptionType: string | null = null
        
        if (lawyerDmas.length === 1) {
          // Lawyer in single DMA - use that DMA's subscription
          subscriptionType = subscriptions?.get(lawyerDmas[0]) || lawyer.subscription_type || 'free'
        } else {
          // Lawyer in multiple DMAs - pick highest subscription
          const subscriptionTypeMap = new Map(subscriptionTypes?.map(st => [st.name, st.sort_order]) || [])
          let highestSub: { type: string; sortOrder: number } | null = null
          
          for (const dmaIdForLawyer of lawyerDmas) {
            const subType = subscriptions?.get(dmaIdForLawyer) || lawyer.subscription_type || 'free'
            const sortOrder = subscriptionTypeMap.get(subType) ?? 999
            if (!highestSub || sortOrder < highestSub.sortOrder) {
              highestSub = { type: subType, sortOrder }
            }
          }
          
          subscriptionType = highestSub?.type || lawyer.subscription_type || 'free'
        }
        
        uniqueLawyersMap.set(lawyer.id, { lawyer, subscription: subscriptionType })
      }
    }
  }

  // Group unique lawyers by their determined subscription
  for (const { lawyer, subscription } of uniqueLawyersMap.values()) {
    if (subscription && groupedBySubscription[subscription]) {
      groupedBySubscription[subscription].push(lawyer)
    }
  }

  // Step 8: Apply limits to the grouped subscriptions
  // Use the most restrictive limit across all DMAs (or global if no DMA-specific limits)
  const limitedGroups: Record<string, Lawyer[]> = {}
  subscriptionTypes?.forEach(subType => {
    limitedGroups[subType.name] = []
  })

  // Get global limits as baseline
  const { data: globalLimits } = await supabase
    .from('subscription_limits')
    .select('subscription_type, max_lawyers')
    .eq('location_type', 'global')
    .eq('location_value', 'default')

  const globalLimitsMap = new Map<string, number | null>()
  if (globalLimits) {
    globalLimits.forEach(limit => {
      globalLimitsMap.set(limit.subscription_type, limit.max_lawyers)
    })
  }

  // Get DMA-specific limits and use the most restrictive
  const limitsMap = new Map<string, number | null>()
  for (const dmaId of uniqueDmaIds) {
    // Note: location_value stores DMA UUID as TEXT
    const { data: dmaLimits } = await supabase
      .from('subscription_limits')
      .select('subscription_type, max_lawyers')
      .eq('location_type', 'dma')
      .eq('location_value', String(dmaId))

    if (dmaLimits) {
      dmaLimits.forEach(limit => {
        const existing = limitsMap.get(limit.subscription_type)
        const newLimit = limit.max_lawyers
        // Use the most restrictive (lowest) limit, or null if any is unlimited
        if (existing === null || newLimit === null) {
          limitsMap.set(limit.subscription_type, null) // Unlimited if any DMA is unlimited
        } else if (existing === undefined || newLimit < existing) {
          limitsMap.set(limit.subscription_type, newLimit)
        }
      })
    }
  }

  // Fallback to global limits for subscription types without DMA limits
  globalLimitsMap.forEach((limit, subType) => {
    if (!limitsMap.has(subType)) {
      limitsMap.set(subType, limit)
    }
  })

  // Apply limits to each subscription type
  subscriptionTypes?.forEach(subType => {
    const lawyers = groupedBySubscription[subType.name] || []
    const maxLawyers = limitsMap.get(subType.name) ?? null
    const limitedLawyers = maxLawyers === null 
      ? lawyers 
      : lawyers.slice(0, maxLawyers)
    
    limitedGroups[subType.name] = limitedLawyers
  })

  // Return null for dma since we have multiple DMAs
  return {
    lawyers: Object.values(limitedGroups).flat(),
    groupedBySubscription: limitedGroups,
    dma: null, // Multiple DMAs, so no single DMA
    subscriptionTypes: subscriptionTypes || []
  }
}

/**
 * Get lawyers by city - finds the most central zip code and maps to DMA
 */
export async function getLawyersByCityWithSubscriptionLimits(
  cityName: string,
  stateAbbr?: string
): Promise<{
  lawyers: Lawyer[]
  groupedBySubscription: Record<string, Lawyer[]>
  dma: { id: string; name: string; code: number } | null
  subscriptionTypes: Array<{ name: string; display_name: string; sort_order: number }>
}> {
  const supabase = await createClient()

  console.log(`\n🔍 ========================================`)
  console.log(`🔍 SEARCHING FOR CITY: ${cityName}${stateAbbr ? `, ${stateAbbr}` : ''}`)
  console.log(`🔍 ========================================`)

  // Step 1: Find city by name (optionally filter by state)
  // First, get the state ID if state abbreviation is provided
  let stateId: string | null = null
  if (stateAbbr) {
    console.log(`🔍 Looking up state: ${stateAbbr}`)
    const { data: stateData, error: stateError } = await supabase
      .from('states')
      .select('id, name, abbreviation')
      .eq('abbreviation', stateAbbr.toUpperCase())
      .maybeSingle()
    
    if (stateError) {
      console.error('❌ Error fetching state:', stateError)
    } else if (stateData) {
      stateId = stateData.id
      console.log(`✅ Found state: ${stateData.name} (${stateData.abbreviation}) - ID: ${stateId}`)
    } else {
      console.warn(`⚠️ State not found: ${stateAbbr}`)
    }
  }

  // Build city query - try exact match first, then partial
  console.log(`🔍 Querying cities with name starting with: "${cityName.trim()}"${stateId ? `, state_id=${stateId}` : ''}`)
  let cityQuery = supabase
    .from('cities')
    .select(`
      id,
      name,
      latitude,
      longitude,
      state_id,
      states (
        id,
        name,
        abbreviation
      )
    `)
    .ilike('name', `${cityName.trim()}%`) // Case-insensitive "starts with"

  // Filter by state_id if we have it
  if (stateId) {
    cityQuery = cityQuery.eq('state_id', stateId)
  } else if (stateAbbr) {
    // If we have state abbreviation but couldn't find state_id, try filtering by state abbreviation via join
    // This is a fallback in case state lookup failed
    console.log(`⚠️ No state_id found, but have state abbreviation: ${stateAbbr}`)
  }

  let { data: citiesData, error: citiesError } = await cityQuery

  if (citiesError) {
    console.error('❌ Error fetching city:', citiesError)
    console.error('   Query details:', { cityName, stateAbbr, stateId })
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  console.log(`📋 City query returned ${citiesData?.length || 0} results`)

  if (!citiesData || citiesData.length === 0) {
    console.error(`❌ City not found in database: ${cityName}${stateAbbr ? `, ${stateAbbr}` : ''}`)
    console.error(`   Searched with: name.ilike.${cityName.trim()}%${stateId ? `, state_id=${stateId}` : ''}`)
    
    // Try a more lenient search without state filter if state was provided
    if (stateAbbr) {
      console.log(`🔄 Retrying city search without state filter...`)
      const { data: retryData, error: retryError } = await supabase
        .from('cities')
        .select(`
          id,
          name,
          latitude,
          longitude,
          state_id,
          states (
            id,
            name,
            abbreviation
          )
        `)
        .ilike('name', `${cityName.trim()}%`)
        .limit(5)
      
      if (retryError) {
        console.error('❌ Retry city search error:', retryError)
      } else if (retryData && retryData.length > 0) {
        console.log(`✅ Retry found ${retryData.length} cities:`, retryData.map((c: any) => `${c.name} (state: ${(c.states as any)?.abbreviation})`))
        citiesData = retryData
      }
    }
    
    // If still no city found, use Nominatim geocoding as fallback
    if (!citiesData || citiesData.length === 0) {
      console.log(`🌐 City not in database, trying external geocoding service (Nominatim)...`)
      const geocodeResult = await geocodeCityWithZipCodes(cityName, stateAbbr)
      
      if (geocodeResult && geocodeResult.coordinates) {
        console.log(`✅ Found city via geocoding: ${geocodeResult.cityName}`)
        console.log(`   Coordinates: ${geocodeResult.coordinates.latitude}, ${geocodeResult.coordinates.longitude}`)
        
        if (geocodeResult.zipCodes.length > 0) {
          console.log(`   Zip codes from Nominatim: ${geocodeResult.zipCodes.join(', ')}`)
          // Use the first zip code to find lawyers
          const firstZipCode = geocodeResult.zipCodes[0]
          console.log(`🔄 Using zip code ${firstZipCode} from geocoding to find lawyers...`)
          return await getLawyersByZipCodeWithSubscriptionLimits(firstZipCode)
        } else {
          // No zip codes from Nominatim - try to find zip codes near the coordinates
          console.log(`⚠️ Nominatim didn't return zip codes, searching for nearby zip codes in database...`)
          
          // Find zip codes within ~10 miles of the coordinates
          // Get all cities with coordinates
          const { data: nearbyCities, error: citiesError } = await supabase
            .from('cities')
            .select('id, name, latitude, longitude')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
          
          if (!citiesError && nearbyCities) {
            // Find cities within 10 miles
            const nearbyCityIds: string[] = []
            nearbyCities.forEach((c: any) => {
              if (c.latitude && c.longitude) {
                const distance = calculateDistance(
                  geocodeResult.coordinates!,
                  { latitude: c.latitude, longitude: c.longitude }
                )
                if (distance <= 10) {
                  nearbyCityIds.push(c.id)
                }
              }
            })
            
            if (nearbyCityIds.length > 0) {
              // Get zip codes for nearby cities
              const { data: nearbyZipCodes } = await supabase
                .from('zip_codes')
                .select('zip_code')
                .in('city_id', nearbyCityIds)
                .limit(5)
              
              if (nearbyZipCodes && nearbyZipCodes.length > 0) {
                const zipCodeList = nearbyZipCodes.map((z: any) => z.zip_code).filter((z): z is string => !!z)
                console.log(`✅ Found ${zipCodeList.length} nearby zip codes: ${zipCodeList.join(', ')}`)
                return await getLawyersByZipCodeWithSubscriptionLimits(zipCodeList[0])
              }
            }
          }
          
          console.error(`❌ Could not find zip codes for geocoded city "${geocodeResult.cityName}"`)
          // Still return subscription types
          const { data: subscriptionTypes } = await supabase
            .from('subscription_types')
            .select('name, display_name, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
          return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
        }
      } else {
        console.error(`❌ Could not geocode city "${cityName}"${stateAbbr ? `, ${stateAbbr}` : ''}`)
        // Still return subscription types even if no lawyers found
        const { data: subscriptionTypes } = await supabase
          .from('subscription_types')
          .select('name, display_name, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
        return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
      }
    }
  }

  // If multiple cities found, prefer the one matching the state if provided
  let city = citiesData[0]
  if (stateId && citiesData.length > 1) {
    const stateMatch = citiesData.find(c => (c as any).state_id === stateId)
    if (stateMatch) {
      city = stateMatch
      console.log(`✅ Selected city matching state: ${city.name}`)
    } else {
      console.log(`⚠️ Multiple cities found, using first: ${city.name}`)
    }
  } else if (citiesData.length > 1) {
    console.log(`⚠️ Multiple cities found (${citiesData.length}), using first: ${city.name}`)
  }
  
  const cityState = (city as any).states as any
  console.log(`✅ Found city: ${city.name}${cityState ? `, ${cityState.name}` : ''} at ${city.latitude}, ${city.longitude}`)
  
  if (!city.latitude || !city.longitude) {
    console.error(`❌ City ${cityName} does not have coordinates`)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  // Step 2: Get all zip codes for this city
  console.log(`🔍 Fetching zip codes for city_id: ${city.id} (${city.name})...`)
  const { data: zipCodesData, error: zipCodesError } = await supabase
    .from('zip_codes')
    .select(`
      id,
      zip_code,
      city_id,
      cities (
        id,
        latitude,
        longitude
      )
    `)
    .eq('city_id', city.id)

  if (zipCodesError) {
    console.error('❌ Error fetching zip codes:', zipCodesError)
    console.error('   City ID:', city.id)
    // Still return subscription types
    const { data: subscriptionTypes } = await supabase
      .from('subscription_types')
      .select('name, display_name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
  }

  if (!zipCodesData || zipCodesData.length === 0) {
    console.error(`❌ No zip codes found for city ${cityName} in database`)
    console.log(`🌐 Trying external geocoding service to find zip codes...`)
    
    // Fallback to geocoding service
    const geocodeResult = await geocodeCityWithZipCodes(cityName, stateAbbr)
    
    if (geocodeResult && geocodeResult.coordinates) {
      if (geocodeResult.zipCodes.length > 0) {
        console.log(`✅ Found zip codes via geocoding: ${geocodeResult.zipCodes.join(', ')}`)
        // Use the first zip code to find lawyers
        const firstZipCode = geocodeResult.zipCodes[0]
        console.log(`🔄 Using zip code ${firstZipCode} from geocoding to find lawyers...`)
        return await getLawyersByZipCodeWithSubscriptionLimits(firstZipCode)
      } else {
        // No zip codes from Nominatim - use reverse geocoding to find zip codes
        console.log(`⚠️ Nominatim didn't return zip codes, using reverse geocoding...`)
        
        // Use Nominatim reverse geocoding to get zip codes from coordinates
        try {
          const reverseResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${geocodeResult.coordinates.latitude}&lon=${geocodeResult.coordinates.longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'DivorceLawyer.com/1.0'
              }
            }
          )
          
          if (reverseResponse.ok) {
            const reverseData = await reverseResponse.json()
            if (reverseData.address?.postcode) {
              const zipCode = reverseData.address.postcode
              console.log(`✅ Found zip code via reverse geocoding: ${zipCode}`)
              return await getLawyersByZipCodeWithSubscriptionLimits(zipCode)
            }
          }
        } catch (reverseError) {
          console.error('Error in reverse geocoding:', reverseError)
        }
        
        // Last resort: try to find zip codes in database near the coordinates
        console.log(`🔍 Searching for zip codes near coordinates ${geocodeResult.coordinates.latitude}, ${geocodeResult.coordinates.longitude}...`)
        
        // Get all cities with coordinates
        const { data: allCities } = await supabase
          .from('cities')
          .select('id, name, latitude, longitude')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
        
        if (allCities) {
          // Find cities within 5 miles
          const nearbyCityIds: string[] = []
          allCities.forEach((c: any) => {
            if (c.latitude && c.longitude) {
              const distance = calculateDistance(
                geocodeResult.coordinates!,
                { latitude: c.latitude, longitude: c.longitude }
              )
              if (distance <= 5) {
                nearbyCityIds.push(c.id)
              }
            }
          })
          
          if (nearbyCityIds.length > 0) {
            // Get zip codes for nearby cities
            const { data: nearbyZipCodes } = await supabase
              .from('zip_codes')
              .select('zip_code')
              .in('city_id', nearbyCityIds)
              .limit(1)
            
            if (nearbyZipCodes && nearbyZipCodes.length > 0) {
              const zipCode = nearbyZipCodes[0].zip_code
              console.log(`✅ Found nearby zip code: ${zipCode}`)
              return await getLawyersByZipCodeWithSubscriptionLimits(zipCode)
            }
          }
        }
        
        console.error(`❌ Could not find zip codes for city "${cityName}" via any method`)
        // Still return subscription types even if no lawyers found
        const { data: subscriptionTypes } = await supabase
          .from('subscription_types')
          .select('name, display_name, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
        return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
      }
    } else {
      console.error(`❌ Could not geocode city "${cityName}"${stateAbbr ? `, ${stateAbbr}` : ''}`)
      // Still return subscription types even if no lawyers found
      const { data: subscriptionTypes } = await supabase
        .from('subscription_types')
        .select('name, display_name, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
    }
  }

  console.log(`✅ Found ${zipCodesData.length} zip codes in ${city.name}`)

  // Step 3: Find the most central zip code (closest to city coordinates)
  const cityCoords: Coordinates = { latitude: city.latitude, longitude: city.longitude }
  
  let closestZipCode: { id: string; zip_code: string } | null = null
  let minDistance = Infinity

  for (const zipCodeRow of zipCodesData) {
    const zipCity = zipCodeRow.cities as any
    if (zipCity?.latitude && zipCity?.longitude) {
      const distance = calculateDistance(
        cityCoords,
        { latitude: zipCity.latitude, longitude: zipCity.longitude }
      )
      if (distance < minDistance) {
        minDistance = distance
        closestZipCode = { id: zipCodeRow.id, zip_code: zipCodeRow.zip_code }
      }
    }
  }

  // If no zip code with coordinates found, use the first one
  if (!closestZipCode) {
    closestZipCode = { id: zipCodesData[0].id, zip_code: zipCodesData[0].zip_code }
  }

  console.log(`✅ Selected most central zip code: ${closestZipCode.zip_code}`)

  // Step 4: Use the zip code search function directly
  // This reuses the proven zip code search logic which handles DMA resolution
  console.log(`🔄 Using zip code search for ${closestZipCode.zip_code} to find lawyers in ${city.name}...`)
  console.log(`   This will search for lawyers in the DMA containing zip code ${closestZipCode.zip_code}`)
  
  const zipCodeSearchResult = await getLawyersByZipCodeWithSubscriptionLimits(closestZipCode.zip_code)
  
  console.log(`📊 Zip code search result for ${closestZipCode.zip_code}:`, {
    lawyersCount: zipCodeSearchResult.lawyers?.length || 0,
    hasDMA: !!zipCodeSearchResult.dma,
    dmaName: zipCodeSearchResult.dma?.name,
    groupedCount: Object.keys(zipCodeSearchResult.groupedBySubscription || {}).length
  })
  
  return zipCodeSearchResult
}

