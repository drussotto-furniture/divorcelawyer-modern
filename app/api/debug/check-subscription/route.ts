import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const lawyerId = request.nextUrl.searchParams.get('lawyerId')
  const dmaId = request.nextUrl.searchParams.get('dmaId')

  if (!lawyerId) {
    return NextResponse.json({ error: 'lawyerId required' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 })
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Get all subscriptions for this lawyer
  const { data: subscriptions, error: subError } = await adminClient
    .from('lawyer_dma_subscriptions')
    .select('*')
    .eq('lawyer_id', lawyerId)

  // Get all service areas for this lawyer
  const { data: serviceAreas, error: saError } = await adminClient
    .from('lawyer_service_areas')
    .select('*')
    .eq('lawyer_id', lawyerId)

  // Get the lawyer's default subscription
  const { data: lawyer, error: lawyerError } = await adminClient
    .from('lawyers')
    .select('id, first_name, last_name, subscription_type')
    .eq('id', lawyerId)
    .single()

  return NextResponse.json({
    lawyer,
    lawyerError: lawyerError?.message,
    subscriptions,
    subscriptionError: subError?.message,
    serviceAreas,
    serviceAreaError: saError?.message,
  })
}

