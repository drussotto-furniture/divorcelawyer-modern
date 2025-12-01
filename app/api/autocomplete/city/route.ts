import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const supabase = await createClient()

    // Search for cities matching the query, include state information
    const { data: cities, error } = await supabase
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
      .limit(20)

    if (error) {
      console.error('Error fetching city suggestions:', error)
      return NextResponse.json({ suggestions: [] })
    }

    const suggestions = (cities || [])
      .map(c => {
        const state = c.states as any
        return {
          value: state ? `${c.name}, ${state.abbreviation}` : c.name,
          label: state ? `${c.name}, ${state.name}` : c.name,
          cityName: c.name,
          stateAbbr: state?.abbreviation,
          stateName: state?.name
        }
      })
      .filter((s, index, self) => 
        // Remove duplicates based on value
        index === self.findIndex(t => t.value === s.value)
      )

    return NextResponse.json({ suggestions })
  } catch (error: any) {
    console.error('Error in city autocomplete:', error)
    return NextResponse.json({ suggestions: [] })
  }
}


