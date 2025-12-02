import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get Georgia state ID
    const { data: gaState } = await supabase
      .from('states')
      .select('id, name, abbreviation')
      .eq('abbreviation', 'GA')
      .maybeSingle()

    if (!gaState) {
      return NextResponse.json({ error: 'Georgia state not found' }, { status: 404 })
    }

    // Try querying lawyers by office_state_id
    const { data: lawyers, error: lawyersError } = await supabase
      .from('lawyers')
      .select('id, first_name, last_name, office_state_id, is_visible')
      .eq('office_state_id', gaState.id)
      .eq('is_visible', true)
      .limit(10)

    return NextResponse.json({
      georgiaState: gaState,
      lawyersFound: lawyers?.length || 0,
      lawyers: lawyers || [],
      error: lawyersError?.message
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

