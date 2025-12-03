import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET DMAs in this group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: memberships, error } = await (supabase as any)
      .from('subscription_plan_group_memberships')
      .select(`
        dma_id,
        dmas (id, name, code)
      `)
      .eq('group_id', id)

    if (error) {
      console.error('Error fetching group DMAs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const dmas = (memberships || []).map((m: any) => m.dmas).filter(Boolean)

    return NextResponse.json({ dmas })
  } catch (error: any) {
    console.error('Error fetching group DMAs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST add DMAs to this group
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { dma_ids } = body

    if (!dma_ids || dma_ids.length === 0) {
      return NextResponse.json({ error: 'dma_ids array is required' }, { status: 400 })
    }

    // Use service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    // Remove these DMAs from any individual exceptions (exclusive assignment)
    await adminClient
      .from('subscription_plan_dma_overrides')
      .delete()
      .in('dma_id', dma_ids)

    // Remove from any other groups
    await adminClient
      .from('subscription_plan_group_memberships')
      .delete()
      .in('dma_id', dma_ids)

    // Add to this group
    const memberships = dma_ids.map((dma_id: string) => ({
      group_id: groupId,
      dma_id,
    }))

    const { data, error } = await adminClient
      .from('subscription_plan_group_memberships')
      .insert(memberships)
      .select()

    if (error) {
      console.error('Error adding DMAs to group:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, added: dma_ids.length })
  } catch (error: any) {
    console.error('Error adding DMAs to group:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE remove DMAs from this group (moves them back to global)
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const dmaIdsParam = searchParams.get('dma_ids')
    
    if (!dmaIdsParam) {
      return NextResponse.json({ error: 'dma_ids query param is required' }, { status: 400 })
    }

    const dma_ids = dmaIdsParam.split(',')

    // Use service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    // Remove from this group
    const { error } = await adminClient
      .from('subscription_plan_group_memberships')
      .delete()
      .eq('group_id', groupId)
      .in('dma_id', dma_ids)

    if (error) {
      console.error('Error removing DMAs from group:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, removed: dma_ids.length })
  } catch (error: any) {
    console.error('Error removing DMAs from group:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

