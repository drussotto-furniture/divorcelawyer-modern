import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress } from '@/lib/geocoding'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      )
    }

    const coordinates = await geocodeAddress(address)

    if (!coordinates) {
      return NextResponse.json(
        { error: 'Could not geocode address' },
        { status: 404 }
      )
    }

    return NextResponse.json({ coordinates })
  } catch (error: any) {
    console.error('Error geocoding address:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to geocode address' },
      { status: 500 }
    )
  }
}


