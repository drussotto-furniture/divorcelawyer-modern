import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Cache results for 5 minutes
const CACHE_MAX_AGE = 300

// Force dynamic to enable caching headers
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.trim() || ''

    if (!query || query.length < 1) {
      return NextResponse.json(
        { suggestions: [], type: null },
        { headers: getCacheHeaders() }
      )
    }

    const supabase = await createClient()
    const suggestions: Array<{ value: string; label: string; type: string }> = []
    let detectedType: string | null = null

    // Detect input type
    const isZipPattern = /^\d+$/.test(query)
    const isShortQuery = query.length <= 2
    
    // Run queries in parallel for speed
    const promises: Promise<void>[] = []

    // If looks like a zip code (starts with numbers)
    if (isZipPattern) {
      detectedType = 'zip'
      if (query.length >= 2) {
        promises.push(
          (async () => {
            const { data: zipCodes } = await supabase
              .from('zip_codes')
              .select('zip_code')
              .ilike('zip_code', `${query}%`)
              .order('zip_code', { ascending: true })
              .limit(8)

            if (zipCodes) {
              zipCodes.forEach(z => {
                suggestions.push({
                  value: z.zip_code,
                  label: z.zip_code,
                  type: 'zip'
                })
              })
            }
          })()
        )
      }
    } else {
      // Text query - search states and cities in parallel
      
      // Always search states (fast, small table)
      promises.push(
        (async () => {
          const { data: states } = await supabase
            .from('states')
            .select('name, abbreviation')
            .or(`name.ilike.${query}%,abbreviation.ilike.${query}%`)
            .order('name', { ascending: true })
            .limit(5)

          if (states && states.length > 0) {
            if (!detectedType) detectedType = 'state'
            states.forEach(s => {
              suggestions.push({
                value: s.name,
                label: `${s.name} (${s.abbreviation})`,
                type: 'state'
              })
            })
          }
        })()
      )

      // Search cities if query is >= 2 chars
      if (query.length >= 2) {
        promises.push(
          (async () => {
            const { data: cities } = await supabase
              .from('cities')
              .select(`
                name,
                states (
                  name,
                  abbreviation
                )
              `)
              .ilike('name', `${query}%`)
              .order('name', { ascending: true })
              .limit(10)

            if (cities && cities.length > 0) {
              if (!detectedType || detectedType === 'state') {
                // Cities take precedence if we have a longer query
                if (query.length >= 3) detectedType = 'city'
              }
              
              const seen = new Set<string>()
              cities.forEach((c: any) => {
                const state = c.states
                const value = state ? `${c.name}, ${state.abbreviation}` : c.name
                if (!seen.has(value)) {
                  seen.add(value)
                  suggestions.push({
                    value,
                    label: state ? `${c.name}, ${state.name}` : c.name,
                    type: 'city'
                  })
                }
              })
            }
          })()
        )
      }
    }

    // Wait for all queries to complete
    await Promise.all(promises)

    // Sort: states first, then cities (if mixed)
    suggestions.sort((a, b) => {
      if (a.type === 'state' && b.type === 'city') return -1
      if (a.type === 'city' && b.type === 'state') return 1
      return a.label.localeCompare(b.label)
    })

    // Limit total suggestions
    const limitedSuggestions = suggestions.slice(0, 12)

    const duration = Date.now() - startTime
    
    return NextResponse.json(
      { 
        suggestions: limitedSuggestions, 
        type: detectedType,
        duration 
      },
      { headers: getCacheHeaders() }
    )
  } catch (error: any) {
    console.error('Error in autocomplete:', error)
    return NextResponse.json(
      { suggestions: [], type: null, error: error.message },
      { status: 500 }
    )
  }
}

function getCacheHeaders() {
  return {
    'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_MAX_AGE * 2}`,
    'CDN-Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}`,
    'Vercel-CDN-Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}`,
  }
}

