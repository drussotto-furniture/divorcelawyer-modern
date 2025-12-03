import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const zipCode = searchParams.get('zip') || '30309'
  
  try {
    const supabase = await createClient()
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      searchZipCode: zipCode,
      steps: []
    }

    // Step 1: Look up the zip code in the view
    const { data: viewData, error: viewError } = await (supabase as any)
      .from('zip_dma_city_state')
      .select('zip_code, dma_id, dma_name, city_name, state_name')
      .eq('zip_code', zipCode)
      .limit(5)

    debugInfo.steps.push({
      step: 1,
      name: 'zip_dma_city_state lookup',
      success: !viewError,
      error: viewError?.message,
      count: viewData?.length || 0,
      data: viewData
    })

    if (!viewData || viewData.length === 0) {
      debugInfo.summary = 'FAILED: Zip code not found in zip_dma_city_state view'
      return NextResponse.json(debugInfo)
    }

    const dmaId = viewData[0].dma_id
    const dmaName = viewData[0].dma_name

    // Step 2: Get all zip codes in this DMA
    const { data: dmaZipCodes, error: dmaZipError } = await (supabase as any)
      .from('zip_code_dmas')
      .select(`
        zip_code_id,
        zip_codes (
          zip_code
        )
      `)
      .eq('dma_id', dmaId)
      .limit(10)

    debugInfo.steps.push({
      step: 2,
      name: 'Get zip codes in DMA',
      dmaId,
      dmaName,
      success: !dmaZipError,
      error: dmaZipError?.message,
      count: dmaZipCodes?.length || 0,
      sample: dmaZipCodes?.slice(0, 5).map((z: any) => z.zip_codes?.zip_code)
    })

    if (!dmaZipCodes || dmaZipCodes.length === 0) {
      debugInfo.summary = 'FAILED: No zip codes found in DMA'
      return NextResponse.json(debugInfo)
    }

    const zipCodeList = dmaZipCodes
      .map((zcd: any) => zcd.zip_codes?.zip_code)
      .filter((zip: string | undefined): zip is string => !!zip)

    // Step 3: Find lawyers by office_zip_code
    const { data: lawyersByOfficeZip, error: lawyersByOfficeZipError } = await supabase
      .from('lawyers')
      .select('id, first_name, last_name, office_zip_code, subscription_type')
      .in('office_zip_code', zipCodeList)
      .limit(10)

    debugInfo.steps.push({
      step: 3,
      name: 'Find lawyers by office_zip_code',
      success: !lawyersByOfficeZipError,
      error: lawyersByOfficeZipError?.message,
      count: lawyersByOfficeZip?.length || 0,
      data: lawyersByOfficeZip?.map((l: any) => ({
        name: `${l.first_name} ${l.last_name}`,
        zip: l.office_zip_code,
        subscription: l.subscription_type
      }))
    })

    // Step 3b: Try searching for 30309 directly
    const { data: lawyersDirect, error: lawyersDirectError } = await supabase
      .from('lawyers')
      .select('id, first_name, last_name, office_zip_code, subscription_type')
      .eq('office_zip_code', '30309')
      .limit(10)

    debugInfo.steps.push({
      step: '3b',
      name: 'Find lawyers with office_zip_code=30309 (direct)',
      success: !lawyersDirectError,
      error: lawyersDirectError?.message,
      count: lawyersDirect?.length || 0,
      data: lawyersDirect?.map((l: any) => ({
        name: `${l.first_name} ${l.last_name}`,
        zip: l.office_zip_code,
        subscription: l.subscription_type
      }))
    })

    // Step 3c: Check all lawyers table
    const { data: allLawyers, error: allLawyersError } = await supabase
      .from('lawyers')
      .select('id, first_name, last_name, office_zip_code, subscription_type')
      .limit(20)

    debugInfo.steps.push({
      step: '3c',
      name: 'All lawyers (first 20)',
      success: !allLawyersError,
      error: allLawyersError?.message,
      count: allLawyers?.length || 0,
      data: allLawyers?.map((l: any) => ({
        name: `${l.first_name} ${l.last_name}`,
        zip: l.office_zip_code
      }))
    })

    // Step 4: Find lawyers by firm zip code
    const { data: lawyersByFirmZip, error: lawyersByFirmZipError } = await supabase
      .from('lawyers')
      .select(`
        id, first_name, last_name, office_zip_code, subscription_type,
        law_firms!inner (
          zip_code
        )
      `)
      .in('law_firms.zip_code', zipCodeList)
      .limit(10)

    debugInfo.steps.push({
      step: 4,
      name: 'Find lawyers by firm zip_code',
      success: !lawyersByFirmZipError,
      error: lawyersByFirmZipError?.message,
      count: lawyersByFirmZip?.length || 0,
      data: lawyersByFirmZip?.map((l: any) => ({
        name: `${l.first_name} ${l.last_name}`,
        firmZip: (l.law_firms as any)?.zip_code,
        subscription: l.subscription_type
      }))
    })

    // Step 5: Find lawyers by service area DMA
    const { data: lawyersByServiceArea, error: lawyersByServiceAreaError } = await (supabase as any)
      .from('lawyer_service_areas')
      .select(`
        lawyer_id,
        dma_id,
        lawyers (
          id, first_name, last_name, subscription_type
        )
      `)
      .eq('dma_id', dmaId)
      .limit(10)

    debugInfo.steps.push({
      step: 5,
      name: 'Find lawyers by service area DMA',
      success: !lawyersByServiceAreaError,
      error: lawyersByServiceAreaError?.message,
      count: lawyersByServiceArea?.length || 0,
      data: lawyersByServiceArea?.map((lsa: any) => ({
        name: `${lsa.lawyers?.first_name} ${lsa.lawyers?.last_name}`,
        subscription: lsa.lawyers?.subscription_type
      }))
    })

    // Step 6: Get subscription types
    const { data: subscriptionTypes, error: subTypesError } = await (supabase as any)
      .from('subscription_types')
      .select('name, display_name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    debugInfo.steps.push({
      step: 6,
      name: 'Get subscription types',
      success: !subTypesError,
      error: subTypesError?.message,
      count: subscriptionTypes?.length || 0,
      data: subscriptionTypes
    })

    // Summary
    const totalLawyers = new Set([
      ...(lawyersByOfficeZip || []).map((l: any) => l.id),
      ...(lawyersByFirmZip || []).map((l: any) => l.id),
      ...(lawyersByServiceArea || []).map((lsa: any) => lsa.lawyer_id)
    ]).size

    debugInfo.summary = {
      success: true,
      dmaFound: dmaName,
      zipCodesInDma: zipCodeList.length,
      uniqueLawyersFound: totalLawyers,
      lawyersByOfficeZip: lawyersByOfficeZip?.length || 0,
      lawyersByFirmZip: lawyersByFirmZip?.length || 0,
      lawyersByServiceArea: lawyersByServiceArea?.length || 0,
      subscriptionTypesCount: subscriptionTypes?.length || 0
    }

    return NextResponse.json(debugInfo)
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message, 
      stack: error.stack 
    }, { status: 500 })
  }
}

