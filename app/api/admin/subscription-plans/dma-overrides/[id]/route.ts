import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET single DMA override
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: override, error } = await (supabase as any)
      .from('subscription_plan_dma_overrides')
      .select(`
        *,
        subscription_plans (id, name, display_name, price_cents, price_display, description),
        dmas (id, name, code),
        subscription_plan_dma_override_features (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching DMA override:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!override) {
      return NextResponse.json({ error: 'Override not found' }, { status: 404 })
    }

    // Sort features
    override.subscription_plan_dma_override_features = (override.subscription_plan_dma_override_features || []).sort(
      (a: any, b: any) => a.sort_order - b.sort_order
    )

    return NextResponse.json({ override })
  } catch (error: any) {
    console.error('Error fetching DMA override:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT update DMA override
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check if user is super admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      price_cents, 
      price_display, 
      description, 
      has_custom_features,
      is_active,
      features // Array of features if has_custom_features is true
    } = body

    // Use service role for update
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    // Update the override
    const updateData: any = {}
    if (price_cents !== undefined) updateData.price_cents = price_cents
    if (price_display !== undefined) updateData.price_display = price_display
    if (description !== undefined) updateData.description = description
    if (has_custom_features !== undefined) updateData.has_custom_features = has_custom_features
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: override, error } = await adminClient
      .from('subscription_plan_dma_overrides')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating DMA override:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If features provided and has_custom_features, update them
    if (has_custom_features && features !== undefined) {
      // Delete existing features
      await adminClient
        .from('subscription_plan_dma_override_features')
        .delete()
        .eq('override_id', id)

      // Insert new features
      if (features && features.length > 0) {
        const featureRecords = features.map((f: any, index: number) => ({
          override_id: id,
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
          console.error('Error updating override features:', featuresError)
        }
      }
    } else if (has_custom_features === false) {
      // If turning off custom features, delete them
      await adminClient
        .from('subscription_plan_dma_override_features')
        .delete()
        .eq('override_id', id)
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
      .eq('id', id)
      .single()

    return NextResponse.json({ override: completeOverride })
  } catch (error: any) {
    console.error('Error updating DMA override:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE DMA override
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check if user is super admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use service role for delete
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    // Delete the override (features will cascade delete)
    const { error } = await adminClient
      .from('subscription_plan_dma_overrides')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting DMA override:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting DMA override:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

