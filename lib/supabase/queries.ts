import { createClient } from './server'
import type { Database } from '@/types/database.types'

type Article = Database['public']['Tables']['articles']['Row']
type State = Database['public']['Tables']['states']['Row']
type City = Database['public']['Tables']['cities']['Row']
type Lawyer = Database['public']['Tables']['lawyers']['Row']
type LawFirm = Database['public']['Tables']['law_firms']['Row']

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
        slug
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
      console.error('City not found:', citySlug, cityError)
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
        const { data: lawyersData } = await supabase
          .from('lawyers')
          .select('id, first_name, last_name, slug, photo_url, title')
          .eq('law_firm_id', firm.id)
          .limit(3)
        
        return {
          ...firm,
          lawyers: lawyersData || [],
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
    return firmsWithLawyers.filter(firm => firm.lawyers.length > 0)
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

