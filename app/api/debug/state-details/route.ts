import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const stateQuery = searchParams.get('state')

    if (!stateQuery) {
      return NextResponse.json({ error: 'State query is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const trimmedState = stateQuery.trim()

    // Find state
    let stateData: any = null
    if (trimmedState.length === 2) {
      const { data: abbrData } = await supabase
        .from('states')
        .select('id, name, abbreviation')
        .eq('abbreviation', trimmedState.toUpperCase())
        .maybeSingle()
      if (abbrData) stateData = abbrData
    }
    
    if (!stateData) {
      const { data: nameData } = await supabase
        .from('states')
        .select('id, name, abbreviation')
        .ilike('name', trimmedState)
        .limit(1)
      if (nameData && nameData.length > 0) stateData = nameData[0]
    }

    if (!stateData) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 })
    }

    // Get cities in this state
    const { data: citiesData, error: citiesError } = await supabase
      .from('cities')
      .select('id, name')
      .eq('state_id', stateData.id)
      .limit(10)

    // Get zip codes for cities in this state
    const cityIds = (citiesData || []).map(c => c.id)
    let zipCodesData: any[] = []
    if (cityIds.length > 0) {
      const { data: zips } = await supabase
        .from('zip_codes')
        .select('id, zip_code, city_id')
        .in('city_id', cityIds)
        .limit(20)
      zipCodesData = zips || []
    }

    // Get DMAs for these zip codes
    const zipCodeIds = zipCodesData.map(z => z.id)
    let dmasData: any[] = []
    if (zipCodeIds.length > 0) {
      const { data: dmaMappings } = await (supabase as any)
        .from('zip_code_dmas')
        .select(`
          zip_code_id,
          dmas (
            id,
            name,
            code
          )
        `)
        .in('zip_code_id', zipCodeIds)
        .limit(10)
      dmasData = dmaMappings || []
    }

    return NextResponse.json({
      state: stateData,
      citiesCount: citiesData?.length || 0,
      cities: citiesData || [],
      zipCodesCount: zipCodesData.length,
      zipCodes: zipCodesData.slice(0, 10),
      dmasCount: dmasData.length,
      dmas: dmasData.map((d: any) => d.dmas).filter(Boolean).slice(0, 5),
      errors: {
        cities: citiesError?.message,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

