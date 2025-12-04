import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Utility function to convert price_display (e.g., "$1,490") to price_cents (149000)
function priceDisplayToCents(priceDisplay: string | null): number | null {
  if (!priceDisplay || priceDisplay.trim() === '') return null
  
  // Remove currency symbols, commas, and whitespace
  const cleaned = priceDisplay.replace(/[$,\s]/g, '')
  
  // Parse as float and convert to cents
  const dollars = parseFloat(cleaned)
  
  if (isNaN(dollars)) return null
  
  return Math.round(dollars * 100)
}

// GET all plan overrides for this group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const supabase = await createClient()

    const { data: overrides, error } = await (supabase as any)
      .from('subscription_plan_group_overrides')
      .select(`
        *,
        subscription_plans (id, name, display_name, price_cents, price_display, description),
        subscription_plan_group_override_features (*)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching group overrides:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const formattedOverrides = (overrides || []).map((o: any) => ({
      ...o,
      plan: o.subscription_plans,
      features: (o.subscription_plan_group_override_features || []).sort(
        (a: any, b: any) => a.sort_order - b.sort_order
      ),
    }))

    return NextResponse.json({ overrides: formattedOverrides })
  } catch (error: any) {
    console.error('Error fetching group overrides:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create/update a plan override for this group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
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
      price_display, 
      description, 
      has_custom_features,
      features
    } = body

    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 })
    }

    // Auto-calculate price_cents from price_display
    const price_cents = priceDisplayToCents(price_display)

    // Use service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    // Upsert the override
    const { data: override, error } = await adminClient
      .from('subscription_plan_group_overrides')
      .upsert({
        group_id: groupId,
        plan_id,
        price_cents: price_cents,
        price_display: price_display ?? null,
        description: description ?? null,
        has_custom_features: has_custom_features || false,
        is_active: true,
      }, {
        onConflict: 'group_id,plan_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating group override:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Handle features
    if (has_custom_features && features !== undefined) {
      // Delete existing features
      await adminClient
        .from('subscription_plan_group_override_features')
        .delete()
        .eq('override_id', override.id)

      // Insert new features
      if (features && features.length > 0) {
        const featureRecords = features.map((f: any, index: number) => ({
          override_id: override.id,
          feature_name: f.feature_name,
          feature_value: f.feature_value ?? null,
          is_included: f.is_included ?? true,
          is_highlighted: f.is_highlighted ?? false,
          sort_order: f.sort_order ?? index,
        }))

        const { error: featuresError } = await adminClient
          .from('subscription_plan_group_override_features')
          .insert(featureRecords)

        if (featuresError) {
          console.error('Error inserting group override features:', featuresError)
        }
      }
    } else if (has_custom_features === false) {
      // Clear features if custom features disabled
      await adminClient
        .from('subscription_plan_group_override_features')
        .delete()
        .eq('override_id', override.id)
    }

    // Fetch complete override
    const { data: completeOverride } = await adminClient
      .from('subscription_plan_group_overrides')
      .select(`
        *,
        subscription_plans (id, name, display_name),
        subscription_plan_group_override_features (*)
      `)
      .eq('id', override.id)
      .single()

    return NextResponse.json({ override: completeOverride })
  } catch (error: any) {
    console.error('Error creating/updating group override:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE remove a plan override from this group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
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

    const searchParams = request.nextUrl.searchParams
    const planId = searchParams.get('plan_id')
    
    if (!planId) {
      return NextResponse.json({ error: 'plan_id query param is required' }, { status: 400 })
    }

    // Use service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    // Delete the override (cascade will handle features)
    const { error } = await adminClient
      .from('subscription_plan_group_overrides')
      .delete()
      .eq('group_id', groupId)
      .eq('plan_id', planId)

    if (error) {
      console.error('Error deleting group override:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting group override:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

