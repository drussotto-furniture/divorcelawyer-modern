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
  const client = await supabase
  const { data: subscription, error } = await (client as any)
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
 * Helper: Get lawyers by DMA IDs with subscription limits
 * This is the core function that all search types (zip, city, state) use
 * after resolving to DMA IDs via zip_dma_city_state view
 */
async function getLawyersByDMAsWithSubscriptionLimits(
  dmaIds: string[]
): Promise<{
  lawyers: Lawyer[]
  groupedBySubscription: Record<string, Lawyer[]>
  subscriptionTypes: Array<{ name: string; display_name: string; sort_order: number }>
}> {
  const supabase = await createClient()

  if (!dmaIds || dmaIds.length === 0) {
    // Return empty results with subscription types
    const { data: subscriptionTypes } = await (supabase as any)
      .from('subscription_types')
      .select('name, display_name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    return { lawyers: [], groupedBySubscription: {}, subscriptionTypes: subscriptionTypes || [] }
  }

  console.log(`\n🔍 Fetching lawyers for ${dmaIds.length} DMA(s):`, dmaIds)

  // Step 1: Get subscription types
  const { data: subscriptionTypes, error: subTypesError } = await (supabase as any)
    .from('subscription_types')
    .select('name, display_name, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (subTypesError) {
    console.error('Error fetching subscription types:', subTypesError)
    return { lawyers: [], groupedBySubscription: {}, subscriptionTypes: [] }
  }

  // Step 2: Get all zip codes for all DMAs
  const allZipCodes = new Set<string>()
  const dmaZipCodeMap = new Map<string, string[]>() // DMA ID -> zip codes

  for (const dmaId of dmaIds) {
    const { data: dmaZipCodes, error: dmaZipError } = await (supabase as any)
      .from('zip_code_dmas')
      .select(`
        zip_code_id,
        zip_codes (
          zip_code
        )
      `)
      .eq('dma_id', dmaId)

    if (dmaZipError) {
      console.error(`❌ Error fetching zip codes for DMA ${dmaId}:`, dmaZipError)
      continue
    }

    const zipCodeList = (dmaZipCodes || [])
      .map((zcd: any) => zcd.zip_codes?.zip_code)
      .filter((zip: string | undefined): zip is string => !!zip)

    dmaZipCodeMap.set(dmaId, zipCodeList)
    zipCodeList.forEach((zip: string) => allZipCodes.add(zip))
  }

  const zipCodeArray = Array.from(allZipCodes)
  console.log(`✅ Found ${zipCodeArray.length} total zip codes across ${dmaIds.length} DMA(s)`)

  if (zipCodeArray.length === 0) {
    console.warn(`⚠️ No zip codes found for the specified DMAs`)
    return { lawyers: [], groupedBySubscription: {}, subscriptionTypes: subscriptionTypes || [] }
  }

  // Step 3: Fetch lawyers by office_zip_code (limit to 1000 to avoid Supabase limit)
  const limitedZipCodes = zipCodeArray.length > 1000 ? zipCodeArray.slice(0, 1000) : zipCodeArray
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
        dma_id,
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
        ),
        dmas (
          id,
          name,
          code
        )
      )
    `)
    .in('office_zip_code', limitedZipCodes)

  if (officeZipError) {
    console.error(`❌ Error fetching lawyers by office_zip_code:`, officeZipError)
  } else {
    console.log(`✅ Found ${(lawyersByOfficeZip || []).length} lawyers by office_zip_code`)
  }

  // Step 4: Fetch lawyers by firm zip_code
  const { data: firmsInDmas, error: firmsError } = await supabase
    .from('law_firms')
    .select('id')
    .in('zip_code', limitedZipCodes)

  let lawyersByFirm: Lawyer[] = []
  if (firmsError) {
    console.error(`❌ Error fetching firms by zip_code:`, firmsError)
  } else if (firmsInDmas && firmsInDmas.length > 0) {
    const firmIds = firmsInDmas.map((f: any) => f.id)
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
          dma_id,
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
          ),
          dmas (
            id,
            name,
            code
          )
        )
      `)
      .in('law_firm_id', firmIds)

    if (lawyersByFirmError) {
      console.error(`❌ Error fetching lawyers by firm:`, lawyersByFirmError)
    } else {
      lawyersByFirm = (lawyersByFirmData || []) as Lawyer[]
      console.log(`✅ Found ${lawyersByFirm.length} lawyers by firm zip_code`)
    }
  }

  // Step 5: Fetch lawyers by service area DMA
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
          city_id,
          dma_id,
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
          ),
          dmas (
            id,
            name,
            code
          )
        )
      )
    `)
    .in('dma_id', dmaIds)

  let lawyersByServiceArea: Lawyer[] = []
  if (serviceAreaError) {
    console.error(`❌ Error fetching lawyers by service area:`, serviceAreaError)
  } else if (serviceAreaLawyers) {
    lawyersByServiceArea = (serviceAreaLawyers
      .map((sa: any) => sa.lawyers)
      .filter((l: any) => l !== null && l !== undefined) as Lawyer[])
    console.log(`✅ Found ${lawyersByServiceArea.length} lawyers by service area DMA`)
  }

  // Step 6: Combine and deduplicate lawyers
  const allLawyersArray = [
    ...(lawyersByOfficeZip || []),
    ...lawyersByFirm,
    ...lawyersByServiceArea
  ]

  const uniqueLawyersMap = new Map<string, Lawyer>()
  allLawyersArray.forEach((lawyer: Lawyer) => {
    if (!uniqueLawyersMap.has(lawyer.id)) {
      uniqueLawyersMap.set(lawyer.id, lawyer)
    }
  })

  const uniqueLawyers = Array.from(uniqueLawyersMap.values())
  console.log(`✅ Total unique lawyers: ${uniqueLawyers.length}`)

  // Step 7: Get DMA-level subscriptions for all lawyers
  const lawyerIds = uniqueLawyers.map((l: Lawyer) => l.id)
  const { data: dmaSubscriptions, error: subsError } = await (supabase as any)
    .from('lawyer_dma_subscriptions')
    .select('lawyer_id, dma_id, subscription_type')
    .in('lawyer_id', lawyerIds)
    .in('dma_id', dmaIds)

  if (subsError) {
    console.error('Error fetching DMA subscriptions:', subsError)
  }

  // Build maps for quick lookup
  const lawyerDmaSubscriptionsMap = new Map<string, Map<string, string>>() // lawyer_id -> (dma_id -> subscription_type)
  if (dmaSubscriptions) {
    (dmaSubscriptions as any[]).forEach((sub: any) => {
      if (!lawyerDmaSubscriptionsMap.has(sub.lawyer_id)) {
        lawyerDmaSubscriptionsMap.set(sub.lawyer_id, new Map())
      }
      lawyerDmaSubscriptionsMap.get(sub.lawyer_id)!.set(sub.dma_id, sub.subscription_type)
    })
  }

  // Map each lawyer to their DMAs (for determining subscription)
  const lawyerDmaMap = new Map<string, string[]>() // lawyer_id -> [dma_ids]
  uniqueLawyers.forEach((lawyer: Lawyer) => {
    const lawyerZips = new Set<string>()
    if ((lawyer as any).office_zip_code) {
      lawyerZips.add((lawyer as any).office_zip_code)
    }
    if ((lawyer as any).law_firms?.zip_code) {
      lawyerZips.add((lawyer as any).law_firms.zip_code)
    }

    const lawyerDmas: string[] = []
    for (const [dmaId, zips] of dmaZipCodeMap.entries()) {
      if (Array.from(lawyerZips).some(zip => zips.includes(zip))) {
        lawyerDmas.push(dmaId)
      }
    }

    // Also check service areas
    if ((lawyer as any).lawyer_service_areas) {
      ((lawyer as any).lawyer_service_areas as any[]).forEach((sa: any) => {
        if (sa.dma_id && dmaIds.includes(sa.dma_id) && !lawyerDmas.includes(sa.dma_id)) {
          lawyerDmas.push(sa.dma_id)
        }
      })
    }

    lawyerDmaMap.set(lawyer.id, lawyerDmas)
  })

  // Step 8: Determine subscription type for each lawyer
  // If in multiple DMAs, pick the highest subscription (lowest sort_order)
  const subscriptionTypeMap = new Map((subscriptionTypes as any)?.map((st: any) => [st.name, st.sort_order]) || [])
  const lawyerSubscriptionMap = new Map<string, string>() // lawyer_id -> subscription_type

  uniqueLawyers.forEach((lawyer: Lawyer) => {
    const lawyerDmas = lawyerDmaMap.get(lawyer.id) || []
    const subscriptions = lawyerDmaSubscriptionsMap.get(lawyer.id)

    let subscriptionType: string = (lawyer as any).subscription_type || 'free'

    if (lawyerDmas.length === 1) {
      // Lawyer in single DMA - use that DMA's subscription
      subscriptionType = subscriptions?.get(lawyerDmas[0]) || (lawyer as any).subscription_type || 'free'
    } else if (lawyerDmas.length > 1) {
      // Lawyer in multiple DMAs - pick highest subscription
      let highestSub: { type: string; sortOrder: number } | null = null

      for (const dmaIdForLawyer of lawyerDmas) {
        const subType = subscriptions?.get(dmaIdForLawyer) || (lawyer as any).subscription_type || 'free'
        const sortOrder = (subscriptionTypeMap.get(subType) as number) ?? 999
        if (!highestSub || sortOrder < highestSub.sortOrder) {
          highestSub = { type: subType, sortOrder }
        }
      }

      subscriptionType = highestSub?.type || (lawyer as any).subscription_type || 'free'
    }

    lawyerSubscriptionMap.set(lawyer.id, subscriptionType)
  })

  // Step 9: Group by subscription type
  const groupedBySubscription: Record<string, Lawyer[]> = {}
  subscriptionTypes?.forEach((subType: any) => {
    groupedBySubscription[subType.name] = []
  })

  uniqueLawyers.forEach((lawyer: Lawyer) => {
    const subscriptionType = lawyerSubscriptionMap.get(lawyer.id) || 'free'
    if (groupedBySubscription[subscriptionType]) {
      groupedBySubscription[subscriptionType].push(lawyer)
    }
  })

  // Step 10: Get subscription limits (DMA-specific if available, otherwise global)
  // Scale limits by the number of DMAs (e.g., 2 DMAs = 2x the limit)
  const limitsMap = new Map<string, number | null>()
  const dmaCount = dmaIds.length

  // Get global limits as baseline
  const { data: globalLimits } = await (supabase as any)
    .from('subscription_limits')
    .select('subscription_type, max_lawyers')
    .eq('location_type', 'global')
    .eq('location_value', 'default')

  // Get DMA-specific limits (most restrictive across all DMAs)
  const dmaSpecificLimits = new Map<string, number | null>()
  for (const dmaId of dmaIds) {
    const { data: dmaLimits } = await (supabase as any)
      .from('subscription_limits')
      .select('subscription_type, max_lawyers')
      .eq('location_type', 'dma')
      .eq('location_value', String(dmaId))

    if (dmaLimits) {
      (dmaLimits as any[]).forEach((limit: any) => {
        const existing = dmaSpecificLimits.get(limit.subscription_type)
        const newLimit = limit.max_lawyers
        // Use the most restrictive (lowest) limit, or null if any is unlimited
        if (existing === null || newLimit === null) {
          dmaSpecificLimits.set(limit.subscription_type, null) // Unlimited if any DMA is unlimited
        } else if (existing === undefined || newLimit < existing) {
          dmaSpecificLimits.set(limit.subscription_type, newLimit)
        }
      })
    }
  }

  // Determine final limits: use DMA-specific if available (scaled), otherwise use global (scaled)
  subscriptionTypes?.forEach((subType: any) => {
    const subTypeName = subType.name
    const dmaSpecific = dmaSpecificLimits.get(subTypeName)
    const globalLimit = globalLimits?.find((l: any) => l.subscription_type === subTypeName)?.max_lawyers

    if (dmaSpecific !== undefined) {
      // Use DMA-specific limit, scaled by number of DMAs
      if (dmaSpecific === null) {
        limitsMap.set(subTypeName, null) // Unlimited
      } else {
        limitsMap.set(subTypeName, dmaSpecific * dmaCount)
      }
    } else if (globalLimit !== undefined) {
      // Use global limit, scaled by number of DMAs
      if (globalLimit === null) {
        limitsMap.set(subTypeName, null) // Unlimited
      } else {
        limitsMap.set(subTypeName, globalLimit * dmaCount)
      }
    }
  })

  console.log(`📊 Scaled subscription limits for ${dmaCount} DMA(s):`, 
    Array.from(limitsMap.entries()).map(([type, limit]) => `${type}: ${limit === null ? 'unlimited' : limit}`).join(', '))

  // Step 11: Apply limits to each subscription type
  const limitedGroups: Record<string, Lawyer[]> = {}
  subscriptionTypes?.forEach((subType: any) => {
    const lawyers = groupedBySubscription[subType.name] || []
    const maxLawyers = limitsMap.get(subType.name) ?? null
    const limitedLawyers = maxLawyers === null 
      ? lawyers 
      : lawyers.slice(0, maxLawyers)
    
    limitedGroups[subType.name] = limitedLawyers
  })

  console.log(`\n✅ Final results: ${Object.values(limitedGroups).flat().length} lawyers`)
  console.log(`   Group counts:`, Object.keys(limitedGroups).map(key => `${key}: ${limitedGroups[key].length}`))

  return {
    lawyers: Object.values(limitedGroups).flat(),
    groupedBySubscription: limitedGroups,
    subscriptionTypes: subscriptionTypes || []
  }
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
  const { data: subscriptions, error } = await (supabase as any)
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
    const { data: lawyer } = await (supabase as any)
      .from('lawyers')
      .select('subscription_type')
      .eq('id', lawyerId)
      .maybeSingle()
    
    if ((lawyer as any)?.subscription_type) {
      return { subscription_type: (lawyer as any).subscription_type, dma_id: dmaIds[0] }
    }
    return null
  }
  
  // Get subscription types with their sort orders
  const { data: subscriptionTypes } = await (supabase as any)
    .from('subscription_types')
    .select('name, sort_order')
    .eq('is_active', true)
  
  if (!subscriptionTypes) return { subscription_type: (subscriptions as any)[0].subscription_type, dma_id: (subscriptions as any)[0].dma_id }
  
  // Find the subscription with the lowest sort_order (highest tier)
  const subscriptionTypeMap = new Map((subscriptionTypes as any[]).map((st: any) => [st.name, st.sort_order]))
  
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
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('states')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching states:', error)
      return [] // Return empty array instead of throwing
    }
    return (data || []) as State[]
  } catch (error) {
    console.error('Error in getStates:', error)
    return [] // Return empty array on any error
  }
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
export async function getLawyersByZipCodeWithSubscriptionLimits(zipCode: string): Promise<{
  lawyers: Lawyer[]
  groupedBySubscription: Record<string, Lawyer[]>
  dma: { id: string; name: string; code: number } | null
  subscriptionTypes: Array<{ name: string; display_name: string; sort_order: number }>
}> {
  try {
    const supabase = await createClient()

    console.log(`\n🔍 ========================================`)
    console.log(`🔍 SEARCHING FOR ZIP CODE: ${zipCode}`)
    console.log(`🔍 Using zip_dma_city_state view`)
    console.log(`🔍 ========================================`)

    // Step 1: Query zip_dma_city_state view to find DMA for this zip code
    const { data: zipLocationData, error: locationError } = await (supabase as any)
      .from('zip_dma_city_state')
      .select('dma_id, dma_name, dma_code')
      .eq('zip_code', zipCode)
      .not('dma_id', 'is', null)
      .limit(1)

    if (locationError) {
      console.error('Error querying zip_dma_city_state view:', locationError)
      const { data: subscriptionTypes } = await (supabase as any)
        .from('subscription_types')
        .select('name, display_name, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
    }

    let dmaInfo: { id: string; name: string; code: number } | null = null
    let uniqueDmaIds: string[] = []

    if (zipLocationData && zipLocationData.length > 0) {
      dmaInfo = {
        id: zipLocationData[0].dma_id as string,
        name: (zipLocationData[0] as any).dma_name || '',
        code: (zipLocationData[0] as any).dma_code || 0
      }
      uniqueDmaIds.push(dmaInfo.id)
      console.log(`✅ Found DMA: ${dmaInfo.name} (${dmaInfo.code}) for zip code ${zipCode}`)
    } else {
      console.warn(`⚠️ No DMA found for zip code "${zipCode}" in zip_dma_city_state view.`)
      const { data: subscriptionTypes } = await (supabase as any)
        .from('subscription_types')
        .select('name, display_name, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
    }

    // Step 2: Use helper function to get lawyers by DMA IDs
    const result = await getLawyersByDMAsWithSubscriptionLimits(uniqueDmaIds)

    console.log(`\n✅ ========================================`)
    console.log(`✅ FINAL RESULTS FOR ZIP CODE "${zipCode}"`)
    console.log(`✅ Total lawyers: ${result.lawyers.length}`)
    console.log(`✅ Subscription groups: ${Object.keys(result.groupedBySubscription).length}`)
    console.log(`✅ Group counts:`, Object.keys(result.groupedBySubscription).map(key => `${key}: ${result.groupedBySubscription[key].length}`))
    console.log(`✅ ========================================\n`)

    return {
      lawyers: result.lawyers,
      groupedBySubscription: result.groupedBySubscription,
      dma: dmaInfo,
      subscriptionTypes: result.subscriptionTypes
    }
  } catch (error: any) {
    console.error(`\n❌ ========================================`)
    console.error(`❌ ERROR in getLawyersByZipCodeWithSubscriptionLimits for "${zipCode}":`)
    console.error(`❌ Error:`, error)
    console.error(`❌ Stack:`, error?.stack)
    console.error(`❌ ========================================\n`)

    try {
      const supabase = await createClient()
      const { data: subscriptionTypes } = await (supabase as any)
        .from('subscription_types')
        .select('name, display_name, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
    } catch (subError) {
      console.error('❌ Could not fetch subscription types in error handler:', subError)
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
    }
  }
}

/**
 * OLD VERSION REMOVED - Now using zip_dma_city_state view and getLawyersByDMAsWithSubscriptionLimits helper
 * The new implementation is much simpler and consistent with state and city searches
 */

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

  // Query 2: Lawyers whose firm has zip_code matching
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

    if (!lawyersByFirmError) {
      lawyersByFirmZip = lawyersByFirm || []
    }
  }

  // Combine and deduplicate
  const allLawyers = [
    ...(lawyersByOfficeZip || []),
    ...lawyersByFirmZip
  ]

  const uniqueLawyers = Array.from(
    new Map(allLawyers.map(l => [l.id, l])).values()
  ) as Lawyer[]

  if (uniqueLawyers.length === 0) {
    const { data: subscriptionTypes } = await (supabase as any)
      .from('subscription_types')
      .select('name, display_name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
  }

  // Get subscription types
  const { data: subscriptionTypes, error: subTypesError } = await (supabase as any)
    .from('subscription_types')
    .select('name, display_name, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (subTypesError) {
    console.error('Error fetching subscription types:', subTypesError)
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
  }

  // Get global limits
  const { data: globalLimits } = await (supabase as any)
    .from('subscription_limits')
    .select('subscription_type, max_lawyers')
    .eq('location_type', 'global')
    .eq('location_value', 'default')

  const limitsMap = new Map<string, number | null>()
  if (globalLimits) {
    (globalLimits as any[]).forEach((limit: any) => {
      limitsMap.set(limit.subscription_type, limit.max_lawyers)
    })
  }

  // Group by subscription type
  const groupedBySubscription: Record<string, Lawyer[]> = {}
  subscriptionTypes?.forEach((subType: any) => {
    groupedBySubscription[subType.name] = []
  })

  uniqueLawyers.forEach((lawyer: any) => {
    const subType = lawyer.subscription_type || 'free'
    if (subType && groupedBySubscription[subType]) {
      groupedBySubscription[subType].push(lawyer as Lawyer)
    }
  })

  // Apply limits
  const limitedGroups: Record<string, Lawyer[]> = {}
  const allLawyersLimited: Lawyer[] = []

  subscriptionTypes?.forEach((subType: any) => {
    const lawyers = groupedBySubscription[subType.name] || []
    const maxLawyers = limitsMap.get(subType.name) ?? null

    const limitedLawyers = maxLawyers === null
      ? lawyers
      : lawyers.slice(0, maxLawyers)

    limitedGroups[subType.name] = limitedLawyers
    allLawyersLimited.push(...limitedLawyers)
  })

  return {
    lawyers: allLawyersLimited,
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
  
  console.log(`\n🔍 Searching for lawyers named "${name}" within ${maxMiles} miles of zip code ${zipCode}`)
  
  // Geocode the zip code to get coordinates
  const zipCoordinates = await geocodeAddress(zipCode)
  if (!zipCoordinates) {
    console.error(`Could not geocode zip code ${zipCode}`)
    const { data: subscriptionTypes } = await (supabase as any)
      .from('subscription_types')
      .select('name, display_name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
  }
  
  // Find all cities within maxMiles
  const { data: allCities, error: citiesError } = await supabase
    .from('cities')
    .select('id, name, latitude, longitude')
  
  if (citiesError) {
    console.error('Error fetching cities:', citiesError)
    const { data: subscriptionTypes } = await (supabase as any)
      .from('subscription_types')
      .select('name, display_name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
  }
  
  // Filter cities within maxMiles
  const citiesWithinRange = (allCities || []).filter((city: any) => {
    if (!city.latitude || !city.longitude) return false
    const distance = calculateDistance(
      zipCoordinates,
      { latitude: city.latitude, longitude: city.longitude }
    )
    return distance <= maxMiles
  })
  
  console.log(`✅ Found ${citiesWithinRange.length} cities within ${maxMiles} miles`)
  
  // Get all zip codes for these cities
  const cityIds = citiesWithinRange.map((c: any) => c.id)
  const { data: zipCodesData, error: zipCodesError } = await supabase
    .from('zip_codes')
    .select('zip_code')
    .in('city_id', cityIds)
  
  if (zipCodesError) {
    console.error('Error fetching zip codes:', zipCodesError)
    const { data: subscriptionTypes } = await (supabase as any)
      .from('subscription_types')
      .select('name, display_name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
  }
  
  const zipCodeList = (zipCodesData || []).map((z: any) => z.zip_code).filter((z: string | null): z is string => !!z)
  
  // Find DMAs for these zip codes using the view
  const { data: dmaData, error: dmaError } = await (supabase as any)
    .from('zip_dma_city_state')
    .select('dma_id')
    .in('zip_code', zipCodeList)
    .not('dma_id', 'is', null)
  
  if (dmaError) {
    console.error('Error fetching DMAs:', dmaError)
    const { data: subscriptionTypes } = await (supabase as any)
      .from('subscription_types')
      .select('name, display_name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
  }
  
  const uniqueDmaIds = [...new Set((dmaData || []).map((d: any) => d.dma_id).filter((id: any): id is string => !!id))] as string[]
  
  if (uniqueDmaIds.length === 0) {
    console.warn(`No DMAs found for zip codes within ${maxMiles} miles of ${zipCode}`)
    const { data: subscriptionTypes } = await (supabase as any)
      .from('subscription_types')
      .select('name, display_name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
  }
  
  // Get lawyers from these DMAs
  const result = await getLawyersByDMAsWithSubscriptionLimits(uniqueDmaIds)
  
  // Filter lawyers by name
  const nameLower = name.toLowerCase().trim()
  const filteredLawyers = result.lawyers.filter((lawyer: any) => {
    const firstName = (lawyer.first_name || '').toLowerCase()
    const lastName = (lawyer.last_name || '').toLowerCase()
    const fullName = `${firstName} ${lastName}`.trim()
    return firstName.includes(nameLower) || lastName.includes(nameLower) || fullName.includes(nameLower)
  })
  
  // Re-group filtered lawyers by subscription
  const filteredGrouped: Record<string, Lawyer[]> = {}
  Object.keys(result.groupedBySubscription).forEach((subType: string) => {
    filteredGrouped[subType] = result.groupedBySubscription[subType].filter((lawyer: any) => {
      const firstName = (lawyer.first_name || '').toLowerCase()
      const lastName = (lawyer.last_name || '').toLowerCase()
      const fullName = `${firstName} ${lastName}`.trim()
      const nameLower = name.toLowerCase().trim()
      return firstName.includes(nameLower) || lastName.includes(nameLower) || fullName.includes(nameLower)
    })
  })
  
  console.log(`✅ Found ${filteredLawyers.length} lawyers matching "${name}" within ${maxMiles} miles of ${zipCode}`)
  
  return {
    lawyers: filteredLawyers,
    groupedBySubscription: filteredGrouped,
    dma: null, // Multiple DMAs possible
    subscriptionTypes: result.subscriptionTypes
  }
}


/**
 * Get lawyers by state - uses zip_dma_city_state view to find DMAs, then fetches lawyers
 */
export async function getLawyersByStateWithSubscriptionLimits(
  stateNameOrAbbr: string
): Promise<{
  lawyers: Lawyer[]
  groupedBySubscription: Record<string, Lawyer[]>
  dma: { id: string; name: string; code: number } | null
  subscriptionTypes: Array<{ name: string; display_name: string; sort_order: number }>
}> {
  try {
    const supabase = await createClient()

    const trimmedState = stateNameOrAbbr.trim()
    console.log(`\n🔍 ========================================`)
    console.log(`🔍 SEARCHING FOR STATE: "${trimmedState}"`)
    console.log(`🔍 Using zip_dma_city_state view`)
    console.log(`🔍 ========================================`)

    // Step 1: Find state by name or abbreviation
    // Try abbreviation first (exact match), then name (partial match)
    let stateData: any = null
    let stateError: any = null
    
    // First try exact abbreviation match (only if 2 characters)
    if (trimmedState.length === 2) {
      const { data: abbrData, error: abbrError } = await supabase
        .from('states')
        .select('id, name, abbreviation')
        .eq('abbreviation', trimmedState.toUpperCase())
        .maybeSingle()
      
      if (abbrError) {
        console.error(`❌ Error finding state by abbreviation "${trimmedState}":`, abbrError)
        stateError = abbrError
      } else if (abbrData) {
        stateData = abbrData
        console.log(`✅ Found state by abbreviation: ${stateData.name} (${stateData.abbreviation})`)
      }
    }
    
    // If no abbreviation match (or not a 2-char input), try name search
    if (!stateData && !stateError) {
      console.log(`⚠️ No abbreviation match for "${trimmedState}", trying name search...`)
      
      // First try exact match (case-insensitive)
      let { data: nameDataArray, error: nameError } = await supabase
        .from('states')
        .select('id, name, abbreviation')
        .ilike('name', trimmedState)
        .limit(1)
      
      // If no exact match, try partial match
      if (!nameError && (!nameDataArray || nameDataArray.length === 0)) {
        console.log(`   No exact match, trying partial match with "%${trimmedState}%"...`)
        const partialResult = await supabase
          .from('states')
          .select('id, name, abbreviation')
          .ilike('name', `%${trimmedState}%`)
          .limit(1)
        nameDataArray = partialResult.data
        nameError = partialResult.error
      }
      
      if (nameError) {
        console.error(`❌ Error finding state by name "${trimmedState}":`, nameError)
        stateError = nameError
      } else if (nameDataArray && nameDataArray.length > 0) {
        stateData = nameDataArray[0]
        console.log(`✅ Found state by name: ${stateData.name} (${stateData.abbreviation})`)
      } else {
        console.error(`❌ State not found: "${trimmedState}"`)
        console.error(`   Tried searches:`)
        console.error(`   - Abbreviation: "${trimmedState.length === 2 ? trimmedState.toUpperCase() : 'N/A (not 2 chars)'}"`)
        console.error(`   - Exact name match: "${trimmedState}"`)
        console.error(`   - Partial name match: "%${trimmedState}%"`)
        
        // Debug: List all states to help troubleshoot
        const { data: allStates } = await supabase
          .from('states')
          .select('name, abbreviation')
          .limit(10)
        console.error(`   Sample states in database:`, allStates?.map(s => `${s.name} (${s.abbreviation})`).join(', ') || 'None found')
      }
    }

    if (stateError) {
      console.error(`❌ Error finding state "${trimmedState}":`, stateError)
      // Still return subscription types even on error
      const { data: subscriptionTypes } = await (supabase as any)
        .from('subscription_types')
        .select('name, display_name, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
    }

    if (!stateData) {
      console.error(`❌ State not found: "${trimmedState}"`)
      console.error(`   Attempted searches:`)
      console.error(`   - Abbreviation: "${trimmedState.length === 2 ? trimmedState.toUpperCase() : 'N/A (not 2 chars)'}"`)
      console.error(`   - Name ilike: "%${trimmedState}%"`)
      // Still return subscription types even if state not found
      const { data: subscriptionTypes } = await (supabase as any)
        .from('subscription_types')
        .select('name, display_name, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
    }

    console.log(`✅ Found state: ${stateData.name} (${stateData.abbreviation})`)

    // Step 2: Query zip_dma_city_state view to get all unique DMAs for this state
    const { data: stateLocationData, error: locationError } = await (supabase as any)
      .from('zip_dma_city_state')
      .select('dma_id, dma_name, dma_code')
      .or(`state_abbreviation.eq.${stateData.abbreviation},state_name.ilike.%${stateData.name}%`)
      .not('dma_id', 'is', null)

    if (locationError) {
      console.error('Error querying zip_dma_city_state view:', locationError)
      // Still return subscription types even on error
      const { data: subscriptionTypes } = await (supabase as any)
        .from('subscription_types')
        .select('name, display_name, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
    }

    // Extract unique DMA IDs
    const uniqueDmaIds = [...new Set((stateLocationData || [])
      .map((row: any) => row.dma_id)
      .filter((id: any): id is string => !!id))] as string[]

    console.log(`✅ Found ${uniqueDmaIds.length} unique DMA(s) in ${stateData.name}`)
    if (uniqueDmaIds.length > 0 && stateLocationData) {
      const dmaNames = [...new Set((stateLocationData as any[]).map((r: any) => r.dma_name).filter(Boolean))]
      console.log(`   DMAs: ${dmaNames.join(', ')}`)
    }

    if (uniqueDmaIds.length === 0) {
      console.warn(`⚠️ No DMAs found for state ${stateData.name} in zip_dma_city_state view`)
      console.warn(`   Attempting fallback: searching lawyers directly by state...`)
      
      // Fallback: Search lawyers directly by office_state_id
      console.warn(`⚠️ No cities found for state ${stateData.name}`)
      console.warn(`   Attempting fallback: searching lawyers directly by state...`)
      
      // Fallback: Search lawyers directly by office_state_id (primary) or state text field
      let lawyersByState: any[] = []
      let lawyersError: any = null
      
      // First try by office_state_id (most reliable)
      const { data: lawyersByStateId, error: error1 } = await supabase
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
        .eq('office_state_id', stateData.id)
      
      if (error1) {
        console.error('Error searching by office_state_id:', error1)
        lawyersError = error1
      } else {
        lawyersByState = lawyersByStateId || []
        console.log(`   Found ${lawyersByState.length} lawyers by office_state_id`)
      }
      
      // Also try by state text field as backup
      if (lawyersByState.length === 0) {
        const { data: lawyersByStateText, error: error2 } = await supabase
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
          .or(`state.ilike.%${stateData.name}%,state.ilike.%${stateData.abbreviation}%`)
          .eq('is_visible', true)
        
        if (error2) {
          console.error('Error searching by state text:', error2)
          if (!lawyersError) lawyersError = error2
        } else {
          lawyersByState = lawyersByStateText || []
          console.log(`   Found ${lawyersByState.length} lawyers by state text field`)
        }
      }
      
      if (lawyersError) {
        console.error('Error in fallback lawyer search:', lawyersError)
        const { data: subscriptionTypes } = await (supabase as any)
          .from('subscription_types')
          .select('name, display_name, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
        return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
      }
      
      const fallbackLawyers = (lawyersByState || []) as Lawyer[]
      console.log(`✅ Fallback: Found ${fallbackLawyers.length} lawyers via direct state search`)
      
      if (fallbackLawyers.length === 0) {
        const { data: subscriptionTypes } = await (supabase as any)
          .from('subscription_types')
          .select('name, display_name, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
        return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
      }
      
      // Group by subscription type
      const grouped: Record<string, Lawyer[]> = {}
      for (const lawyer of fallbackLawyers) {
        const subscriptionType = (lawyer as any).subscription_type || 'free'
        if (!grouped[subscriptionType]) {
          grouped[subscriptionType] = []
        }
        grouped[subscriptionType].push(lawyer)
      }
      
      // Get subscription types
      const { data: subscriptionTypes } = await (supabase as any)
        .from('subscription_types')
        .select('name, display_name, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      
      return {
        lawyers: fallbackLawyers,
        groupedBySubscription: grouped,
        dma: null, // No DMA when using fallback
        subscriptionTypes: subscriptionTypes || []
      }
    }

    // Step 3: Use helper function to get lawyers by DMA IDs
    const result = await getLawyersByDMAsWithSubscriptionLimits(uniqueDmaIds)
    
    // Return null for dma since we have multiple DMAs (or single, but we don't track which)
    console.log(`\n✅ ========================================`)
    console.log(`✅ FINAL RESULTS FOR STATE "${trimmedState}"`)
    console.log(`✅ Total lawyers: ${result.lawyers.length}`)
    console.log(`✅ Subscription groups: ${Object.keys(result.groupedBySubscription).length}`)
    console.log(`✅ Group counts:`, Object.keys(result.groupedBySubscription).map(key => `${key}: ${result.groupedBySubscription[key].length}`))
    console.log(`✅ ========================================\n`)
    
    return {
      lawyers: result.lawyers,
      groupedBySubscription: result.groupedBySubscription,
      dma: null, // Multiple DMAs possible, so no single DMA
      subscriptionTypes: result.subscriptionTypes
    }
  } catch (error: any) {
    console.error(`\n❌ ========================================`)
    console.error(`❌ ERROR in getLawyersByStateWithSubscriptionLimits for "${stateNameOrAbbr}":`)
    console.error(`❌ Error:`, error)
    console.error(`❌ Stack:`, error?.stack)
    console.error(`❌ ========================================\n`)
    
    // Try to return subscription types even on error
    try {
      const supabase = await createClient()
      const { data: subscriptionTypes } = await (supabase as any)
        .from('subscription_types')
        .select('name, display_name, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
    } catch (subError) {
      console.error('❌ Could not fetch subscription types in error handler:', subError)
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
    }
  }
}

/**
 * Get lawyers by city - uses zip_dma_city_state view to find DMAs, then fetches lawyers
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
  try {
    const supabase = await createClient()

    console.log(`\n🔍 ========================================`)
    console.log(`🔍 SEARCHING FOR CITY: ${cityName}${stateAbbr ? `, ${stateAbbr}` : ''}`)
    console.log(`🔍 Using zip_dma_city_state view`)
    console.log(`🔍 ========================================`)

    // Step 1: Query zip_dma_city_state view to find DMAs for this city
    // Try multiple matching strategies for better results
    const cleanCityName = cityName.trim()
    let cityLocationData: any[] | null = null
    let locationError: any = null

    // Strategy 1: Exact match (case-insensitive)
    let cityQuery = (supabase as any)
      .from('zip_dma_city_state')
      .select('dma_id, dma_name, dma_code')
      .ilike('city_name', cleanCityName)
      .not('dma_id', 'is', null)

    if (stateAbbr) {
      cityQuery = cityQuery.eq('state_abbreviation', stateAbbr.toUpperCase())
    }

    const exactResult = await cityQuery
    if (!exactResult.error && exactResult.data && exactResult.data.length > 0) {
      console.log(`✅ Found exact match for city "${cleanCityName}"`)
      cityLocationData = exactResult.data
    } else {
      // Strategy 2: Starts-with match
      let startsWithQuery = (supabase as any)
        .from('zip_dma_city_state')
        .select('dma_id, dma_name, dma_code')
        .ilike('city_name', `${cleanCityName}%`)
        .not('dma_id', 'is', null)

      if (stateAbbr) {
        startsWithQuery = startsWithQuery.eq('state_abbreviation', stateAbbr.toUpperCase())
      }

      const startsWithResult = await startsWithQuery
      if (!startsWithResult.error && startsWithResult.data && startsWithResult.data.length > 0) {
        console.log(`✅ Found starts-with match for city "${cleanCityName}"`)
        cityLocationData = startsWithResult.data
      } else {
        // Strategy 3: Contains match (for partial city names)
        let containsQuery = (supabase as any)
          .from('zip_dma_city_state')
          .select('dma_id, dma_name, dma_code')
          .ilike('city_name', `%${cleanCityName}%`)
          .not('dma_id', 'is', null)
          .limit(100) // Limit for performance

        if (stateAbbr) {
          containsQuery = containsQuery.eq('state_abbreviation', stateAbbr.toUpperCase())
        }

        const containsResult = await containsQuery
        if (!containsResult.error && containsResult.data && containsResult.data.length > 0) {
          console.log(`✅ Found contains match for city "${cleanCityName}"`)
          cityLocationData = containsResult.data
        } else {
          locationError = exactResult.error || startsWithResult.error || containsResult.error
        }
      }
    }

    if (locationError) {
      console.error('Error querying zip_dma_city_state view:', locationError)
      const { data: subscriptionTypes } = await (supabase as any)
        .from('subscription_types')
        .select('name, display_name, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
    }

    // Extract unique DMA IDs
    const uniqueDmaIds = [...new Set((cityLocationData || [])
      .map((row: any) => row.dma_id)
      .filter((id: any): id is string => !!id))] as string[]

    console.log(`✅ Found ${uniqueDmaIds.length} unique DMA(s) for city "${cityName}"`)
    if (uniqueDmaIds.length > 0 && cityLocationData) {
      const dmaNames = [...new Set((cityLocationData as any[]).map((r: any) => r.dma_name).filter(Boolean))]
      console.log(`   DMAs: ${dmaNames.join(', ')}`)
    }

    if (uniqueDmaIds.length === 0) {
      console.warn(`⚠️ No DMAs found for city "${cityName}" in zip_dma_city_state view`)
      const { data: subscriptionTypes } = await (supabase as any)
        .from('subscription_types')
        .select('name, display_name, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
    }

    // Step 2: Use helper function to get lawyers by DMA IDs
    const result = await getLawyersByDMAsWithSubscriptionLimits(uniqueDmaIds)

    // Return first DMA info if only one DMA found
    const dmaInfo = uniqueDmaIds.length === 1 && cityLocationData && cityLocationData.length > 0
      ? {
          id: uniqueDmaIds[0],
          name: (cityLocationData[0] as any).dma_name || '',
          code: (cityLocationData[0] as any).dma_code || 0
        }
      : null

    console.log(`\n✅ ========================================`)
    console.log(`✅ FINAL RESULTS FOR CITY "${cityName}"`)
    console.log(`✅ Total lawyers: ${result.lawyers.length}`)
    console.log(`✅ Subscription groups: ${Object.keys(result.groupedBySubscription).length}`)
    console.log(`✅ Group counts:`, Object.keys(result.groupedBySubscription).map(key => `${key}: ${result.groupedBySubscription[key].length}`))
    console.log(`✅ ========================================\n`)

    return {
      lawyers: result.lawyers,
      groupedBySubscription: result.groupedBySubscription,
      dma: dmaInfo,
      subscriptionTypes: result.subscriptionTypes
    }
  } catch (error: any) {
    console.error(`\n❌ ========================================`)
    console.error(`❌ ERROR in getLawyersByCityWithSubscriptionLimits for "${cityName}":`)
    console.error(`❌ Error:`, error)
    console.error(`❌ Stack:`, error?.stack)
    console.error(`❌ ========================================\n`)

    try {
      const supabase = await createClient()
      const { data: subscriptionTypes } = await (supabase as any)
        .from('subscription_types')
        .select('name, display_name, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: subscriptionTypes || [] }
    } catch (subError) {
      console.error('❌ Could not fetch subscription types in error handler:', subError)
      return { lawyers: [], groupedBySubscription: {}, dma: null, subscriptionTypes: [] }
    }
  }
}
