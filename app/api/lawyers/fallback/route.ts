import { NextResponse } from 'next/server'
import { getFallbackLawyers } from '@/lib/supabase'

export async function GET() {
  try {
    const lawyers = await getFallbackLawyers()
    return NextResponse.json({ lawyers })
  } catch (error: any) {
    console.error('Error fetching fallback lawyers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch fallback lawyers' },
      { status: 500 }
    )
  }
}



