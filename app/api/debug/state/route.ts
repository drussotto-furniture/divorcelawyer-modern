import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const state = searchParams.get('state')

    if (!state) {
      return NextResponse.json({ error: 'State name or abbreviation is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const trimmedState = state.trim()
    
    const debug: any = {
      input: trimmedState,
      steps: []
    }

    // Step 1: Try abbreviation
    if (trimmedState.length === 2) {
      const { data: abbrData, error: abbrError } = await supabase
        .from('states')
        .select('id, name, abbreviation')
        .eq('abbreviation', trimmedState.toUpperCase())
        .maybeSingle()
      
      debug.steps.push({
        step: 'abbreviation_lookup',
        query: trimmedState.toUpperCase(),
        found: !!abbrData,
        data: abbrData,
        error: abbrError?.message
      })

      if (abbrData) {
        const stateId = abbrData.id
        
        // Get cities
        const { data: citiesData } = await supabase
          .from('cities')
          .select('id')
          .eq('state_id', stateId)
        
        debug.steps.push({
          step: 'cities_lookup',
          stateId,
          citiesFound: citiesData?.length || 0
        })

        if (citiesData && citiesData.length > 0) {
          const cityIds = citiesData.map(c => c.id)
          
          // Get zip codes
          const { data: zipCodesData } = await supabase
            .from('zip_codes')
            .select('id, zip_code')
            .in('city_id', cityIds)
          
          debug.steps.push({
            step: 'zip_codes_lookup',
            zipCodesFound: zipCodesData?.length || 0,
            sampleZipCodes: zipCodesData?.slice(0, 5).map(z => z.zip_code) || []
          })

          if (zipCodesData && zipCodesData.length > 0) {
            const zipCodeIds = zipCodesData.map(z => z.id)
            
            // Get DMAs
            const { data: dmaData } = await (supabase as any)
              .from('zip_code_dmas')
              .select('dma_id, dmas(id, name, code)')
              .in('zip_code_id', zipCodeIds)
            
            const uniqueDmas = new Set()
            dmaData?.forEach((zcd: any) => {
              if (zcd.dmas?.id) uniqueDmas.add(zcd.dmas.id)
            })
            
            debug.steps.push({
              step: 'dma_lookup',
              dmasFound: uniqueDmas.size,
              sampleDmas: Array.from(uniqueDmas).slice(0, 3)
            })
          }
        }
      }
    }

    // Step 2: Try name
    if (!debug.steps.find((s: any) => s.step === 'abbreviation_lookup' && s.found)) {
      const { data: nameData, error: nameError } = await supabase
        .from('states')
        .select('id, name, abbreviation')
        .ilike('name', trimmedState)
        .limit(1)
      
      debug.steps.push({
        step: 'name_exact_lookup',
        query: trimmedState,
        found: !!nameData && nameData.length > 0,
        data: nameData?.[0],
        error: nameError?.message
      })

      if (!nameData || nameData.length === 0) {
        const { data: partialData } = await supabase
          .from('states')
          .select('id, name, abbreviation')
          .ilike('name', `%${trimmedState}%`)
          .limit(1)
        
        debug.steps.push({
          step: 'name_partial_lookup',
          query: `%${trimmedState}%`,
          found: !!partialData && partialData.length > 0,
          data: partialData?.[0]
        })
      }
    }

    return NextResponse.json(debug)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

