import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lawyerId } = await params
    
    if (!lawyerId) {
      return NextResponse.json({ error: 'Lawyer ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all service areas (DMAs) for this lawyer
    const { data: serviceAreas, error: saError } = await (supabase as any)
      .from('lawyer_service_areas')
      .select('dma_id')
      .eq('lawyer_id', lawyerId)

    if (saError) {
      console.error('Error fetching service areas:', saError)
      return NextResponse.json({ error: 'Failed to fetch service areas' }, { status: 500 })
    }

    if (!serviceAreas || serviceAreas.length === 0) {
      return NextResponse.json({ dmas: [] })
    }

    const dmaIds = serviceAreas.map((sa: any) => sa.dma_id).filter((id: string | null) => !!id)

    if (dmaIds.length === 0) {
      return NextResponse.json({ dmas: [] })
    }

    // Get DMA details
    const { data: dmas, error: dmaError } = await (supabase as any)
      .from('dmas')
      .select('id, name, code')
      .in('id', dmaIds)
      .order('name', { ascending: true })

    if (dmaError) {
      console.error('Error fetching DMAs:', dmaError)
      return NextResponse.json({ error: 'Failed to fetch DMAs' }, { status: 500 })
    }

    // Get subscriptions for each DMA
    const { data: subscriptions, error: subError } = await (supabase as any)
      .from('lawyer_dma_subscriptions')
      .select('dma_id, subscription_type')
      .eq('lawyer_id', lawyerId)
      .in('dma_id', dmaIds)

    if (subError) {
      console.error('Error fetching subscriptions:', subError)
    }

    // Create a map of DMA subscriptions
    const subscriptionMap = new Map<string, string>()
    if (subscriptions) {
      subscriptions.forEach((sub: any) => {
        subscriptionMap.set(sub.dma_id, sub.subscription_type)
      })
    }

    // Combine DMA info with subscription
    const dmasWithSubscriptions = (dmas || []).map((dma: any) => ({
      dma_id: dma.id,
      dma_name: dma.name,
      dma_code: dma.code,
      subscription_type: subscriptionMap.get(dma.id) || 'free',
    }))

    return NextResponse.json({ dmas: dmasWithSubscriptions })
  } catch (error: any) {
    console.error('Error in lawyer DMAs API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

