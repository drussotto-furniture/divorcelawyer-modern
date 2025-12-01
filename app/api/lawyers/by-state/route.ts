import { NextRequest, NextResponse } from 'next/server'
import { getLawyersByStateWithSubscriptionLimits } from '@/lib/supabase/queries'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const state = searchParams.get('state')

    if (!state) {
      return NextResponse.json(
        { error: 'State name or abbreviation is required' },
        { status: 400 }
      )
    }

    console.log(`\n🔍 ========================================`)
    console.log(`🔍 API ROUTE: Searching for state "${state}"`)
    console.log(`🔍 ========================================`)
    
    try {
      const result = await getLawyersByStateWithSubscriptionLimits(state)
      
      console.log(`\n📊 API Response for state "${state}":`, {
        lawyersCount: result.lawyers?.length || 0,
        groupedCount: Object.keys(result.groupedBySubscription || {}).length,
        subscriptionTypesCount: result.subscriptionTypes?.length || 0,
        subscriptionTypes: result.subscriptionTypes?.map(st => st.name) || [],
        hasDMA: !!result.dma,
        dmaName: result.dma?.name
      })
      
      if (result.lawyers?.length === 0) {
        console.warn(`\n⚠️ WARNING: No lawyers found for state "${state}"`)
        console.warn(`   This could mean:`)
        console.warn(`   1. State not found in database`)
        console.warn(`   2. No cities/zip codes for this state`)
        console.warn(`   3. No DMAs mapped to those zip codes`)
        console.warn(`   4. No lawyers in those DMAs`)
        console.warn(`   5. Function returned early due to an error`)
      }
      
      return NextResponse.json(result)
    } catch (apiError: any) {
      console.error(`\n❌ API ROUTE ERROR for state "${state}":`, apiError)
      console.error(`   Error message:`, apiError?.message)
      console.error(`   Error stack:`, apiError?.stack)
      throw apiError // Re-throw to be caught by outer try-catch
    }
  } catch (error: any) {
    console.error('Error fetching lawyers by state:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lawyers' },
      { status: 500 }
    )
  }
}

