import { NextRequest, NextResponse } from 'next/server'
import { getLawyersByZipCodeWithSubscriptionLimits } from '@/lib/supabase/queries'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const zipCode = searchParams.get('zipCode')

    if (!zipCode) {
      return NextResponse.json(
        { error: 'Zip code is required' },
        { status: 400 }
      )
    }

    // Validate zip code format (basic US zip code validation)
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return NextResponse.json(
        { error: 'Invalid zip code format' },
        { status: 400 }
      )
    }

    console.log(`⏱️ Starting zip code search for: ${zipCode}`)
    const startTime = Date.now()
    const result = await getLawyersByZipCodeWithSubscriptionLimits(zipCode)
    const duration = Date.now() - startTime
    console.log(`⏱️ Zip code search completed in ${duration}ms`)
    
    // Log for debugging
    console.log(`\n📊 API Response for zip code ${zipCode}:`, {
      lawyersCount: result.lawyers?.length || 0,
      hasDMA: !!result.dma,
      dmaName: result.dma?.name,
      dmaCode: result.dma?.code,
      groupedCount: Object.keys(result.groupedBySubscription || {}).length,
      subscriptionTypes: result.subscriptionTypes?.map((st: any) => st.name) || [],
      groupedDetails: Object.keys(result.groupedBySubscription || {}).map(key => ({
        subscriptionType: key,
        count: result.groupedBySubscription[key]?.length || 0
      }))
    })
    
    // Also log if no results
    if (!result.lawyers || result.lawyers.length === 0) {
      console.warn(`\n⚠️ ========================================`)
      console.warn(`⚠️ NO LAWYERS FOUND FOR ZIP CODE ${zipCode}`)
      console.warn(`⚠️ DMA: ${result.dma ? `${result.dma.name} (${result.dma.code})` : 'NOT FOUND'}`)
      console.warn(`⚠️ This means:`)
      if (!result.dma) {
        console.warn(`   - DMA was not resolved for this zip code`)
        console.warn(`   - Search fell back to zip-code-only (only lawyers with zip ${zipCode})`)
      } else {
        console.warn(`   - DMA was found: ${result.dma.name}`)
        console.warn(`   - But no lawyers were found in that DMA`)
        console.warn(`   - Check if lawyers have office_zip_code matching zip codes in the DMA`)
        console.warn(`   - Or if law_firms have zip_code matching zip codes in the DMA`)
      }
      console.warn(`⚠️ ========================================\n`)
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching lawyers by zip code:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lawyers' },
      { status: 500 }
    )
  }
}

