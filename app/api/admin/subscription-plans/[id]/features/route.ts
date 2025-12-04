import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

async function checkSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'super_admin'
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Server config error')
  }

  return createAdminClient(supabaseUrl, supabaseServiceKey)
}

// POST add feature to plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planId } = await params
    
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const adminClient = getAdminClient()

    // Get max sort_order for this plan
    const { data: existingFeatures } = await adminClient
      .from('subscription_plan_features')
      .select('sort_order')
      .eq('plan_id', planId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const maxSortOrder = existingFeatures?.[0]?.sort_order || 0

    const { data: feature, error } = await adminClient
      .from('subscription_plan_features')
      .insert({
        plan_id: planId,
        feature_name: body.feature_name,
        feature_value: body.feature_value || null,
        is_included: body.is_included !== false,
        is_highlighted: body.is_highlighted || false,
        sort_order: body.sort_order ?? maxSortOrder + 1,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding feature:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ feature })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT update all features for a plan (bulk update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planId } = await params
    
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { features } = body
    const adminClient = getAdminClient()

    // Delete existing features for this plan
    await adminClient
      .from('subscription_plan_features')
      .delete()
      .eq('plan_id', planId)

    // Insert new features
    if (features && features.length > 0) {
      const { error } = await adminClient
        .from('subscription_plan_features')
        .insert(
          features.map((f: any, index: number) => ({
            plan_id: planId,
            feature_name: f.feature_name,
            feature_value: f.feature_value || null,
            is_included: f.is_included !== false,
            is_highlighted: f.is_highlighted || false,
            sort_order: f.sort_order ?? index + 1,
          }))
        )

      if (error) {
        console.error('Error updating features:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Return updated features
    const { data: updatedFeatures } = await adminClient
      .from('subscription_plan_features')
      .select('*')
      .eq('plan_id', planId)
      .order('sort_order', { ascending: true })

    return NextResponse.json({ features: updatedFeatures })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

