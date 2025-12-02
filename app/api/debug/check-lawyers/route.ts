import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Count lawyers
    const { count: totalLawyers } = await supabase
      .from('lawyers')
      .select('*', { count: 'exact', head: true })

    // Sample lawyers with state info
    const { data: sampleLawyers } = await supabase
      .from('lawyers')
      .select('id, first_name, last_name, state, office_state_id, is_visible')
      .limit(10)

    // Count lawyers in Georgia
    const { count: gaLawyers } = await supabase
      .from('lawyers')
      .select('*', { count: 'exact', head: true })
      .or('state.ilike.%Georgia%,state.ilike.%GA%')

    // Get Georgia state ID
    const { data: gaState } = await supabase
      .from('states')
      .select('id')
      .eq('abbreviation', 'GA')
      .maybeSingle()

    let gaLawyersByStateId = 0
    if (gaState) {
      const { count } = await supabase
        .from('lawyers')
        .select('*', { count: 'exact', head: true })
        .eq('office_state_id', gaState.id)
      gaLawyersByStateId = count || 0
    }

    return NextResponse.json({
      totalLawyers: totalLawyers || 0,
      lawyersInGeorgia: gaLawyers || 0,
      lawyersInGeorgiaByStateId: gaLawyersByStateId,
      georgiaStateId: gaState?.id,
      sample: sampleLawyers || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

