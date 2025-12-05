import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[save-lawyer] ===== ROUTE HIT =====')
    const { id: lawyerId } = await params
    const body = await request.json()
    const { formData, serviceAreas } = body

    console.log('[save-lawyer] Request received for lawyer:', lawyerId)
    console.log('[save-lawyer] Request body keys:', Object.keys(body))

    if (!lawyerId) {
      return NextResponse.json(
        { error: 'Lawyer ID is required' },
        { status: 400 }
      )
    }

    // Get the authenticated user to verify they have permission
    const serverClient = await createServerClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service role client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify the user has permission
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role, lawyer_id, law_firm_id')
      .eq('id', user.id)
      .single()

    const { data: lawyer, error: lawyerError } = await adminClient
      .from('lawyers')
      .select('id, law_firm_id')
      .eq('id', lawyerId)
      .single()

    console.log('[save-lawyer] Permission check:', {
      userId: user.id,
      userRole: profile?.role,
      profileLawyerId: profile?.lawyer_id,
      profileExists: !!profile,
      lawyerId,
      lawyerFirmId: lawyer?.law_firm_id,
      lawyerExists: !!lawyer,
      lawyerError: lawyerError ? {
        message: lawyerError.message,
        code: lawyerError.code,
        details: lawyerError.details,
        hint: lawyerError.hint
      } : null
    })

    // Check if profile exists
    if (!profile) {
      console.error('[save-lawyer] No profile found for user:', user.id)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 403 }
      )
    }

    // Check if lawyer exists
    if (lawyerError) {
      console.error('[save-lawyer] Error fetching lawyer:', {
        lawyerId,
        error: lawyerError.message,
        code: lawyerError.code,
        details: lawyerError.details
      })
      return NextResponse.json(
        { error: `Error fetching lawyer: ${lawyerError.message}` },
        { status: 500 }
      )
    }

    if (!lawyer) {
      console.error('[save-lawyer] Lawyer not found:', lawyerId)
      // Try to verify the lawyer ID format and check if it exists at all
      const { data: anyLawyer } = await adminClient
        .from('lawyers')
        .select('id')
        .limit(1)
      
      console.error('[save-lawyer] Sample lawyer IDs in DB:', anyLawyer?.map(l => l.id))
      return NextResponse.json(
        { error: `Lawyer not found with ID: ${lawyerId}` },
        { status: 404 }
      )
    }

    const isSuperAdmin = profile.role === 'super_admin'
    // Check if user is the lawyer themselves (profiles.lawyer_id links to lawyers.id)
    const isTheLawyer = profile.lawyer_id === lawyer.id
    
    // Check if user is a firm admin for this lawyer's firm
    let isFirmAdmin = false
    if (lawyer.law_firm_id) {
      const { data: firmUser } = await adminClient
        .from('law_firm_users')
        .select('role')
        .eq('law_firm_id', lawyer.law_firm_id)
        .eq('user_id', user.id)
        .single()
      
      isFirmAdmin = firmUser?.role === 'admin' || firmUser?.role === 'owner'
      
      console.log('[save-lawyer] Firm admin check:', {
        lawFirmId: lawyer.law_firm_id,
        firmUser,
        isFirmAdmin
      })
    }

    // Also check if user is a law_firm role and this is their firm's lawyer
    let isLawFirmAdmin = false
    if (profile.role === 'law_firm' && lawyer.law_firm_id) {
      const { data: userFirmProfile } = await adminClient
        .from('profiles')
        .select('law_firm_id')
        .eq('id', user.id)
        .single()
      
      isLawFirmAdmin = userFirmProfile?.law_firm_id === lawyer.law_firm_id
      
      console.log('[save-lawyer] Law firm admin check:', {
        userFirmId: userFirmProfile?.law_firm_id,
        lawyerFirmId: lawyer.law_firm_id,
        isLawFirmAdmin
      })
    }

    console.log('[save-lawyer] Final permission check:', {
      isSuperAdmin,
      isTheLawyer,
      isFirmAdmin,
      isLawFirmAdmin,
      allowed: isSuperAdmin || isTheLawyer || isFirmAdmin || isLawFirmAdmin
    })

    // Allow super_admin, the lawyer themselves, firm admins, or law_firm admins
    if (!isSuperAdmin && !isTheLawyer && !isFirmAdmin && !isLawFirmAdmin) {
      console.error('[save-lawyer] Permission denied:', {
        userId: user.id,
        userRole: profile.role,
        lawyerId,
        isSuperAdmin,
        isTheLawyer,
        isFirmAdmin,
        isLawFirmAdmin
      })
      return NextResponse.json(
        { error: 'You do not have permission to save this lawyer data' },
        { status: 403 }
      )
    }

    // Save lawyer data (only if formData is provided and not null)
    if (formData && Object.keys(formData).length > 0) {
      const dataToSave: any = {
        ...formData,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await adminClient
        .from('lawyers')
        .update(dataToSave)
        .eq('id', lawyerId)

      if (updateError) {
        console.error('[save-lawyer] Error updating lawyer:', updateError)
        return NextResponse.json(
          { error: updateError.message || 'Failed to update lawyer data' },
          { status: 500 }
        )
      }
    }

    // Save service areas and DMA subscriptions
    if (serviceAreas && Array.isArray(serviceAreas)) {
      // Delete existing service areas
      await adminClient
        .from('lawyer_service_areas')
        .delete()
        .eq('lawyer_id', lawyerId)

      // Delete existing DMA subscriptions
      await adminClient
        .from('lawyer_dma_subscriptions')
        .delete()
        .eq('lawyer_id', lawyerId)

      // Filter and deduplicate service areas
      const validServiceAreas = serviceAreas.filter((sa: any) => sa.dma_id)
      const uniqueServiceAreas = Array.from(
        new Map(validServiceAreas.map((sa: any) => [sa.dma_id, sa])).values()
      )

      if (uniqueServiceAreas.length > 0) {
        // Save service areas
        const serviceAreasToInsert = uniqueServiceAreas.map((sa: any) => ({
          lawyer_id: lawyerId,
          dma_id: sa.dma_id
        }))

        const { error: serviceAreaError } = await adminClient
          .from('lawyer_service_areas')
          .insert(serviceAreasToInsert)

        if (serviceAreaError) {
          console.error('[save-lawyer] Error saving service areas:', serviceAreaError)
          return NextResponse.json(
            { error: `Error saving service areas: ${serviceAreaError.message}` },
            { status: 500 }
          )
        }

        // Save DMA subscriptions
        const subscriptionsToSave = uniqueServiceAreas.map((sa: any) => ({
          lawyer_id: lawyerId,
          dma_id: sa.dma_id,
          subscription_type: sa.subscription_type || 'free',
          updated_at: new Date().toISOString(),
        }))

        const { error: subsError } = await adminClient
          .from('lawyer_dma_subscriptions')
          .upsert(subscriptionsToSave, {
            onConflict: 'lawyer_id,dma_id'
          })

        if (subsError) {
          console.error('[save-lawyer] Error saving DMA subscriptions:', subsError)
          return NextResponse.json(
            { error: `Error saving DMA subscriptions: ${subsError.message}` },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      lawyerId
    })

  } catch (error: any) {
    console.error('[save-lawyer] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

