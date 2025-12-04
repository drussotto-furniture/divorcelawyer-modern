import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET all groups with their DMAs and overrides
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: groups, error } = await (supabase as any)
      .from('subscription_plan_groups')
      .select(`
        *,
        subscription_plan_group_memberships (
          dma_id,
          dmas (id, name, code)
        ),
        subscription_plan_group_overrides (
          *,
          subscription_plans (id, name, display_name),
          subscription_plan_group_override_features (*)
        )
      `)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching groups:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the response
    const formattedGroups = (groups || []).map((group: any) => ({
      ...group,
      dmas: (group.subscription_plan_group_memberships || []).map((m: any) => m.dmas).filter(Boolean),
      dma_count: (group.subscription_plan_group_memberships || []).length,
      overrides: (group.subscription_plan_group_overrides || []).map((o: any) => ({
        ...o,
        plan: o.subscription_plans,
        features: (o.subscription_plan_group_override_features || []).sort(
          (a: any, b: any) => a.sort_order - b.sort_order
        ),
      })),
    }))

    return NextResponse.json({ groups: formattedGroups })
  } catch (error: any) {
    console.error('Error in groups API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create a new group
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
    const { name, description, dma_ids } = body

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Use service role for insert
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    // Create the group
    const { data: group, error } = await adminClient
      .from('subscription_plan_groups')
      .insert({
        name,
        description: description || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating group:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If dma_ids provided, add them to the group
    if (dma_ids && dma_ids.length > 0) {
      // First, remove these DMAs from any individual exceptions
      await adminClient
        .from('subscription_plan_dma_overrides')
        .delete()
        .in('dma_id', dma_ids)

      // Then, remove from any other groups
      await adminClient
        .from('subscription_plan_group_memberships')
        .delete()
        .in('dma_id', dma_ids)

      // Add to this group
      const memberships = dma_ids.map((dma_id: string) => ({
        group_id: group.id,
        dma_id,
      }))

      const { error: membershipError } = await adminClient
        .from('subscription_plan_group_memberships')
        .insert(memberships)

      if (membershipError) {
        console.error('Error adding DMAs to group:', membershipError)
      }
    }

    return NextResponse.json({ group })
  } catch (error: any) {
    console.error('Error creating group:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

