import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET all DMAs with their current assignment status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get all DMAs
    const { data: dmas, error: dmasError } = await (supabase as any)
      .from('dmas')
      .select('id, name, code')
      .order('name', { ascending: true })

    if (dmasError) {
      console.error('Error fetching DMAs:', dmasError)
      return NextResponse.json({ error: dmasError.message }, { status: 500 })
    }

    // Get all group memberships
    const { data: memberships, error: membershipsError } = await (supabase as any)
      .from('subscription_plan_group_memberships')
      .select(`
        dma_id,
        group_id,
        subscription_plan_groups (id, name)
      `)

    if (membershipsError) {
      console.error('Error fetching memberships:', membershipsError)
    }

    // Create lookup maps
    const membershipByDma: Record<string, { group_id: string; group_name: string }> = {}
    for (const m of (memberships || [])) {
      membershipByDma[m.dma_id] = {
        group_id: m.group_id,
        group_name: m.subscription_plan_groups?.name || 'Unknown',
      }
    }

    // Build response with assignment info
    const dmasWithAssignment = (dmas || []).map((dma: any) => {
      const membership = membershipByDma[dma.id]

      if (membership) {
        return {
          ...dma,
          assignment_type: 'group',
          group_id: membership.group_id,
          group_name: membership.group_name,
        }
      } else {
        return {
          ...dma,
          assignment_type: 'global',
          group_id: null,
          group_name: null,
        }
      }
    })

    return NextResponse.json({ dmas: dmasWithAssignment })
  } catch (error: any) {
    console.error('Error in DMA assignments API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST bulk update DMA assignments
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
    const { dma_ids, target_type, target_id } = body
    // target_type: 'global' | 'group'
    // target_id: group_id if target_type is 'group', null otherwise

    if (!dma_ids || dma_ids.length === 0) {
      return NextResponse.json({ error: 'dma_ids array is required' }, { status: 400 })
    }

    if (!target_type || !['global', 'group'].includes(target_type)) {
      return NextResponse.json({ error: 'target_type must be global or group' }, { status: 400 })
    }

    if (target_type === 'group' && !target_id) {
      return NextResponse.json({ error: 'target_id (group_id) is required when target_type is group' }, { status: 400 })
    }

    // Use service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    // Always start by removing from groups and exceptions (cleanup any existing exceptions)
    await adminClient
      .from('subscription_plan_group_memberships')
      .delete()
      .in('dma_id', dma_ids)

    // Also remove any existing exceptions (cleanup)
    await adminClient
      .from('subscription_plan_dma_overrides')
      .delete()
      .in('dma_id', dma_ids)

    if (target_type === 'group') {
      // Add to the specified group
      const memberships = dma_ids.map((dma_id: string) => ({
        group_id: target_id,
        dma_id,
      }))

      const { error } = await adminClient
        .from('subscription_plan_group_memberships')
        .insert(memberships)

      if (error) {
        console.error('Error adding DMAs to group:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
    // If target_type is 'global', we just removed them from groups/exceptions, so they're now global

    return NextResponse.json({ 
      success: true, 
      updated: dma_ids.length,
      target_type,
    })
  } catch (error: any) {
    console.error('Error updating DMA assignments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

