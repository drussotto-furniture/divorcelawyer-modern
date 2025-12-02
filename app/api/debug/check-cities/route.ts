import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check total cities
    const { data: allCities, error: allError } = await supabase
      .from('cities')
      .select('id, name, state_id')
      .limit(10)

    // Check cities with state_id
    const { data: citiesWithState, error: withStateError } = await supabase
      .from('cities')
      .select('id, name, state_id')
      .not('state_id', 'is', null)
      .limit(10)

    // Check cities without state_id
    const { data: citiesWithoutState, error: withoutStateError } = await supabase
      .from('cities')
      .select('id, name, state_id')
      .is('state_id', null)
      .limit(10)

    // Count cities
    const { count: totalCount } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true })

    const { count: withStateCount } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true })
      .not('state_id', 'is', null)

    return NextResponse.json({
      totalCities: totalCount || 0,
      citiesWithStateId: withStateCount || 0,
      citiesWithoutStateId: (totalCount || 0) - (withStateCount || 0),
      sampleAll: allCities || [],
      sampleWithState: citiesWithState || [],
      sampleWithoutState: citiesWithoutState || [],
      errors: {
        all: allError?.message,
        withState: withStateError?.message,
        withoutState: withoutStateError?.message
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

