import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Count zip codes
    const { count: totalZips } = await supabase
      .from('zip_codes')
      .select('*', { count: 'exact', head: true })

    // Sample zip codes
    const { data: sampleZips } = await supabase
      .from('zip_codes')
      .select('id, zip_code, city_id')
      .limit(10)

    // Check zip codes with city_id
    const { count: zipsWithCity } = await supabase
      .from('zip_codes')
      .select('*', { count: 'exact', head: true })
      .not('city_id', 'is', null)

    return NextResponse.json({
      totalZipCodes: totalZips || 0,
      zipCodesWithCityId: zipsWithCity || 0,
      zipCodesWithoutCityId: (totalZips || 0) - (zipsWithCity || 0),
      sample: sampleZips || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

