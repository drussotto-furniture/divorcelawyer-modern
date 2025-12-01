import { NextRequest, NextResponse } from 'next/server'
import { getLawyersByCityWithSubscriptionLimits } from '@/lib/supabase/queries'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city')
    const state = searchParams.get('state') // Optional state abbreviation

    if (!city) {
      return NextResponse.json(
        { error: 'City name is required' },
        { status: 400 }
      )
    }

    console.log(`\n🔍 ========================================`)
    console.log(`🔍 API: Searching for city "${city}"${state ? `, ${state}` : ''}`)
    console.log(`🔍 ========================================`)
    
    const result = await getLawyersByCityWithSubscriptionLimits(city, state || undefined)
    
    console.log(`\n📊 API Response for city "${city}"${state ? `, ${state}` : ''}:`, {
      lawyersCount: result.lawyers?.length || 0,
      hasDMA: !!result.dma,
      dmaName: result.dma?.name,
      dmaCode: result.dma?.code,
      groupedCount: Object.keys(result.groupedBySubscription || {}).length,
      subscriptionTypesCount: result.subscriptionTypes?.length || 0
    })
    
    if (result.lawyers?.length === 0) {
      console.warn(`⚠️ API: No lawyers found for city "${city}"${state ? `, ${state}` : ''}`)
      console.warn(`   This could mean:`)
      console.warn(`   1. City not found in database`)
      console.warn(`   2. No zip codes found for the city`)
      console.warn(`   3. No DMA mapping for those zip codes`)
      console.warn(`   4. No lawyers in that DMA`)
    }
    
    // Add debug info to response for client-side inspection
    const responseWithDebug = {
      ...result,
      _debug: {
        citySearched: city,
        stateSearched: state,
        lawyersFound: result.lawyers?.length || 0,
        hasDMA: !!result.dma,
        dmaName: result.dma?.name
      }
    }
    
    return NextResponse.json(responseWithDebug)
  } catch (error: any) {
    console.error('Error fetching lawyers by city:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lawyers' },
      { status: 500 }
    )
  }
}

