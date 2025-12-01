import { NextRequest, NextResponse } from 'next/server'
import { getLawyersByLocation } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city') || undefined
    const stateCode = searchParams.get('stateCode') || undefined

    const lawyers = await getLawyersByLocation(city, stateCode)
    return NextResponse.json({ lawyers })
  } catch (error: any) {
    console.error('Error fetching lawyers by location:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lawyers' },
      { status: 500 }
    )
  }
}


