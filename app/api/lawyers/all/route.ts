import { NextRequest, NextResponse } from 'next/server'
import { getLawyers } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')

    const lawyers = await getLawyers(limit)
    return NextResponse.json({ lawyers })
  } catch (error: any) {
    console.error('Error fetching all lawyers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lawyers' },
      { status: 500 }
    )
  }
}


