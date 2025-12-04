import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET single group with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: group, error } = await (supabase as any)
      .from('subscription_plan_groups')
      .select(`
        *,
        subscription_plan_group_memberships (
          dma_id,
          dmas (id, name, code)
        ),
        subscription_plan_group_overrides (
          *,
          subscription_plans (id, name, display_name, price_cents, price_display, description),
          subscription_plan_group_override_features (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching group:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Format the response
    const formattedGroup = {
      ...group,
      dmas: (group.subscription_plan_group_memberships || []).map((m: any) => m.dmas).filter(Boolean),
      overrides: (group.subscription_plan_group_overrides || []).map((o: any) => ({
        ...o,
        plan: o.subscription_plans,
        features: (o.subscription_plan_group_override_features || []).sort(
          (a: any, b: any) => a.sort_order - b.sort_order
        ),
      })),
    }

    return NextResponse.json({ group: formattedGroup })
  } catch (error: any) {
    console.error('Error fetching group:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT update group
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

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, is_active, sort_order } = body

    // Use service role for update
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (is_active !== undefined) updateData.is_active = is_active
    if (sort_order !== undefined) updateData.sort_order = sort_order

    const { data: group, error } = await adminClient
      .from('subscription_plan_groups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating group:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ group })
  } catch (error: any) {
    console.error('Error updating group:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE group
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

    const { data: profile } = await (supabase as any)
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

    // Delete the group (cascade will handle memberships and overrides)
    const { error } = await adminClient
      .from('subscription_plan_groups')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting group:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting group:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

