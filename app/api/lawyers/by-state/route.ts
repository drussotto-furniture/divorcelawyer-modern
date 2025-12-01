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

    const result = await getLawyersByStateWithSubscriptionLimits(state)
    
    console.log(`\n📊 API Response for state "${state}":`, {
      lawyersCount: result.lawyers?.length || 0,
      groupedCount: Object.keys(result.groupedBySubscription || {}).length,
      subscriptionTypes: result.subscriptionTypes?.map(st => st.name) || []
    })
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching lawyers by state:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lawyers' },
      { status: 500 }
    )
  }
}

