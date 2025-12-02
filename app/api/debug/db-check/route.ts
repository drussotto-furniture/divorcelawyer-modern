import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const debug: any = {
      timestamp: new Date().toISOString(),
      checks: []
    }

    // Check 1: Can we query the states table?
    const { data: statesData, error: statesError } = await supabase
      .from('states')
      .select('id, name, abbreviation')
      .limit(5)
    
    debug.checks.push({
      name: 'states_table',
      success: !statesError,
      count: statesData?.length || 0,
      sample: statesData?.slice(0, 3).map((s: any) => s.name) || [],
      error: statesError?.message
    })

    // Check 2: Can we query the zip_dma_city_state view?
    const { data: viewData, error: viewError } = await (supabase as any)
      .from('zip_dma_city_state')
      .select('zip_code, dma_name, city_name, state_name')
      .limit(5)
    
    debug.checks.push({
      name: 'zip_dma_city_state_view',
      success: !viewError,
      count: viewData?.length || 0,
      sample: viewData?.slice(0, 3) || [],
      error: viewError?.message
    })

    // Check 3: Query for Georgia specifically
    const { data: gaData, error: gaError } = await (supabase as any)
      .from('zip_dma_city_state')
      .select('zip_code, dma_id, dma_name, city_name, state_name')
      .eq('state_abbreviation', 'GA')
      .limit(10)
    
    debug.checks.push({
      name: 'georgia_in_view',
      success: !gaError,
      count: gaData?.length || 0,
      sample: gaData?.slice(0, 5) || [],
      error: gaError?.message
    })

    // Check 4: Query for zip code 30309
    const { data: zipData, error: zipError } = await (supabase as any)
      .from('zip_dma_city_state')
      .select('zip_code, dma_id, dma_name, city_name, state_name')
      .eq('zip_code', '30309')
    
    debug.checks.push({
      name: 'zip_30309_in_view',
      success: !zipError,
      count: zipData?.length || 0,
      data: zipData || [],
      error: zipError?.message
    })

    // Check 5: Check if DMAs exist
    const { data: dmasData, error: dmasError } = await (supabase as any)
      .from('dmas')
      .select('id, name, code')
      .limit(5)
    
    debug.checks.push({
      name: 'dmas_table',
      success: !dmasError,
      count: dmasData?.length || 0,
      sample: dmasData?.slice(0, 3) || [],
      error: dmasError?.message
    })

    // Check 6: Check zip_code_dmas junction table
    const { data: junctionData, error: junctionError } = await (supabase as any)
      .from('zip_code_dmas')
      .select('zip_code_id, dma_id')
      .limit(5)
    
    debug.checks.push({
      name: 'zip_code_dmas_junction',
      success: !junctionError,
      count: junctionData?.length || 0,
      sample: junctionData?.slice(0, 3) || [],
      error: junctionError?.message
    })

    // Check 7: Check lawyers table
    const { data: lawyersData, error: lawyersError } = await supabase
      .from('lawyers')
      .select('id, first_name, last_name, office_zip_code')
      .limit(5)
    
    debug.checks.push({
      name: 'lawyers_table',
      success: !lawyersError,
      count: lawyersData?.length || 0,
      sample: lawyersData?.slice(0, 3).map((l: any) => `${l.first_name} ${l.last_name} (${l.office_zip_code})`) || [],
      error: lawyersError?.message
    })

    // Summary
    debug.summary = {
      allChecksPass: debug.checks.every((c: any) => c.success),
      failedChecks: debug.checks.filter((c: any) => !c.success).map((c: any) => c.name)
    }

    return NextResponse.json(debug)
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

