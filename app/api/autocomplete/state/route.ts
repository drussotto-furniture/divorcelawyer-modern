import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (!query || query.length < 1) {
      return NextResponse.json({ suggestions: [] })
    }

    const supabase = await createClient()

    // Search for states matching the query (name or abbreviation)
    const { data: states, error } = await supabase
      .from('states')
      .select('name, abbreviation')
      .or(`name.ilike.%${query}%,abbreviation.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(20)

    if (error) {
      console.error('Error fetching state suggestions:', error)
      return NextResponse.json({ suggestions: [] })
    }

    const suggestions = (states || []).map(s => ({
      value: s.name,
      label: `${s.name} (${s.abbreviation})`,
      abbreviation: s.abbreviation
    }))

    return NextResponse.json({ suggestions })
  } catch (error: any) {
    console.error('Error in state autocomplete:', error)
    return NextResponse.json({ suggestions: [] })
  }
}

