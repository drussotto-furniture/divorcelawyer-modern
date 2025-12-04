import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET all DMA overrides with their features
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const planId = searchParams.get('planId')
    const dmaId = searchParams.get('dmaId')

    let query = (supabase as any)
      .from('subscription_plan_dma_overrides')
      .select(`
        *,
        subscription_plans (id, name, display_name),
        dmas (id, name, code),
        subscription_plan_dma_override_features (*)
      `)
      .order('created_at', { ascending: false })

    if (planId) {
      query = query.eq('plan_id', planId)
    }
    if (dmaId) {
      query = query.eq('dma_id', dmaId)
    }

    const { data: overrides, error } = await query

    if (error) {
      console.error('Error fetching DMA overrides:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sort features within each override
    const overridesWithSortedFeatures = (overrides || []).map((override: any) => ({
      ...override,
      subscription_plan_dma_override_features: (override.subscription_plan_dma_override_features || []).sort(
        (a: any, b: any) => a.sort_order - b.sort_order
      ),
    }))

    return NextResponse.json({ overrides: overridesWithSortedFeatures })
  } catch (error: any) {
    console.error('Error in DMA overrides API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create a new DMA override
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is super admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      plan_id, 
      dma_id, 
      price_cents, 
      price_display, 
      description, 
      has_custom_features,
      features // Array of features if has_custom_features is true
    } = body

    if (!plan_id || !dma_id) {
      return NextResponse.json({ error: 'plan_id and dma_id are required' }, { status: 400 })
    }

    // Use service role for insert
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    // Create the override
    const { data: override, error } = await adminClient
      .from('subscription_plan_dma_overrides')
      .insert({
        plan_id,
        dma_id,
        price_cents: price_cents ?? null,
        price_display: price_display ?? null,
        description: description ?? null,
        has_custom_features: has_custom_features || false,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating DMA override:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If has_custom_features and features provided, create them
    if (has_custom_features && features && features.length > 0) {
      const featureRecords = features.map((f: any, index: number) => ({
        override_id: override.id,
        feature_name: f.feature_name,
        feature_value: f.feature_value ?? null,
        is_included: f.is_included ?? true,
        is_highlighted: f.is_highlighted ?? false,
        sort_order: f.sort_order ?? index,
      }))

      const { error: featuresError } = await adminClient
        .from('subscription_plan_dma_override_features')
        .insert(featureRecords)

      if (featuresError) {
        console.error('Error creating override features:', featuresError)
        // Don't fail the whole request, but log it
      }
    }

    // Fetch the complete override with features
    const { data: completeOverride } = await adminClient
      .from('subscription_plan_dma_overrides')
      .select(`
        *,
        subscription_plans (id, name, display_name),
        dmas (id, name, code),
        subscription_plan_dma_override_features (*)
      `)
      .eq('id', override.id)
      .single()

    return NextResponse.json({ override: completeOverride })
  } catch (error: any) {
    console.error('Error creating DMA override:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

