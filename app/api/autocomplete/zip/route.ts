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

    // Search for zip codes matching the query
    const { data: zipCodes, error } = await supabase
      .from('zip_codes')
      .select('zip_code')
      .ilike('zip_code', `${query}%`)
      .order('zip_code', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Error fetching zip code suggestions:', error)
      return NextResponse.json({ suggestions: [] })
    }

    const suggestions = (zipCodes || []).map(z => ({
      value: z.zip_code,
      label: z.zip_code
    }))

    return NextResponse.json({ suggestions })
  } catch (error: any) {
    console.error('Error in zip autocomplete:', error)
    return NextResponse.json({ suggestions: [] })
  }
}


