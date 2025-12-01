import { NextRequest, NextResponse } from 'next/server'
import { getLawyersByNameWithDistance } from '@/lib/supabase/queries'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const name = searchParams.get('name')
    const zipCode = searchParams.get('zipCode')

    if (!name) {
      return NextResponse.json(
        { error: 'Lawyer name is required' },
        { status: 400 }
      )
    }

    if (!zipCode) {
      return NextResponse.json(
        { error: 'Zip code is required' },
        { status: 400 }
      )
    }

    // Validate zip code format
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return NextResponse.json(
        { error: 'Invalid zip code format' },
        { status: 400 }
      )
    }

    const result = await getLawyersByNameWithDistance(zipCode, name, 200)
    
    console.log(`\n📊 API Response for lawyer name "${name}" near zip ${zipCode}:`, {
      lawyersCount: result.lawyers?.length || 0,
      hasDMA: !!result.dma,
      dmaName: result.dma?.name,
      dmaCode: result.dma?.code,
      groupedCount: Object.keys(result.groupedBySubscription || {}).length
    })
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching lawyers by name:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lawyers' },
      { status: 500 }
    )
  }
}


