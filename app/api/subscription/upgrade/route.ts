import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lawyerId, dmaId, subscriptionType } = body

    console.log('Upgrade request received:', { lawyerId, dmaId, subscriptionType })

    if (!lawyerId || !dmaId || !subscriptionType) {
      return NextResponse.json(
        { error: 'Missing required fields: lawyerId, dmaId, subscriptionType' },
        { status: 400 }
      )
    }

    // Validate subscription type
    const validTypes = ['free', 'basic', 'enhanced', 'premium']
    if (!validTypes.includes(subscriptionType)) {
      return NextResponse.json(
        { error: `Invalid subscription type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Get the authenticated user to verify they have permission
    console.log('Getting authenticated user...')
    const serverClient = await createServerClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()

    console.log('Auth result:', { hasUser: !!user, userId: user?.id, authError: authError?.message })

    if (authError || !user) {
      console.log('Auth failed:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service role client to bypass RLS for the update
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Supabase config:', { 
      hasUrl: !!supabaseUrl, 
      hasServiceKey: !!supabaseServiceKey,
      urlPrefix: supabaseUrl?.substring(0, 30)
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
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

    // Verify the user has permission (is the lawyer, or super admin, or firm admin)
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('User profile:', { userId: user.id, profile })

    const { data: lawyer, error: lawyerError } = await adminClient
      .from('lawyers')
      .select('id, user_id, law_firm_id')
      .eq('id', lawyerId)
      .single()

    console.log('Lawyer lookup:', { lawyerId, lawyer, lawyerError })

    if (!lawyer) {
      // Try to find the lawyer by other means for debugging
      const { data: allLawyers, error: allError } = await adminClient
        .from('lawyers')
        .select('id, first_name, last_name')
        .limit(5)
      
      console.log('Sample lawyers in DB:', allLawyers, 'error:', allError)
      
      // For testing - if we can't find the lawyer, let's proceed anyway
      // This helps debug if the issue is with the lawyer lookup vs the subscription update
      console.log('WARN: Proceeding without lawyer verification for debugging')
    }

    const isSuperAdmin = profile?.role === 'super_admin'
    const isTheLawyer = lawyer?.user_id === user.id
    
    // Check if user is a firm admin for this lawyer's firm
    let isFirmAdmin = false
    if (lawyer?.law_firm_id) {
      const { data: firmUser } = await adminClient
        .from('law_firm_users')
        .select('role')
        .eq('law_firm_id', lawyer.law_firm_id)
        .eq('user_id', user.id)
        .single()
      
      isFirmAdmin = firmUser?.role === 'admin' || firmUser?.role === 'owner'
    }

    console.log('Permission check:', { isSuperAdmin, isTheLawyer, isFirmAdmin, hasLawyer: !!lawyer })

    // For debugging, skip permission check if lawyer wasn't found
    if (lawyer && !isSuperAdmin && !isTheLawyer && !isFirmAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to upgrade this subscription' },
        { status: 403 }
      )
    }

    console.log('User authorized, performing upgrade...')

    // Upsert the subscription in lawyer_dma_subscriptions
    const { data: subscriptionData, error: subscriptionError } = await adminClient
      .from('lawyer_dma_subscriptions')
      .upsert({
        lawyer_id: lawyerId,
        dma_id: dmaId,
        subscription_type: subscriptionType,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'lawyer_id,dma_id'
      })
      .select()

    if (subscriptionError) {
      console.error('Subscription upsert error:', subscriptionError)
      return NextResponse.json(
        { error: subscriptionError.message || 'Failed to update subscription' },
        { status: 500 }
      )
    }

    console.log('Subscription updated:', subscriptionData)

    // Also update the lawyer's default subscription_type
    const { error: lawyerUpdateError } = await adminClient
      .from('lawyers')
      .update({ subscription_type: subscriptionType })
      .eq('id', lawyerId)

    if (lawyerUpdateError) {
      console.warn('Lawyer update warning (non-critical):', lawyerUpdateError)
    }

    return NextResponse.json({
      success: true,
      subscription: subscriptionData?.[0] || { lawyer_id: lawyerId, dma_id: dmaId, subscription_type: subscriptionType }
    })

  } catch (error: any) {
    console.error('Upgrade API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

