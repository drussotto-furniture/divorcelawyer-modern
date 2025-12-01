import { NextRequest, NextResponse } from 'next/server'
import { searchLawyers } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const searchTerm = searchParams.get('q') || ''

    if (!searchTerm) {
      return NextResponse.json({ lawyers: [] })
    }

    const lawyers = await searchLawyers(searchTerm)
    return NextResponse.json({ lawyers })
  } catch (error: any) {
    console.error('Error searching lawyers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search lawyers' },
      { status: 500 }
    )
  }
}



