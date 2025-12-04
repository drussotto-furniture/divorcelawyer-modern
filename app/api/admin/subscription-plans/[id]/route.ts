import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Utility function to convert price_display (e.g., "$1,490") to price_cents (149000)
function priceDisplayToCents(priceDisplay: string): number {
  if (!priceDisplay || priceDisplay.trim() === '') return 0
  
  // Remove currency symbols, commas, and whitespace
  const cleaned = priceDisplay.replace(/[$,\s]/g, '')
  
  // Parse as float and convert to cents
  const dollars = parseFloat(cleaned)
  
  if (isNaN(dollars)) return 0
  
  return Math.round(dollars * 100)
}

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

// GET single plan with features
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: plan, error } = await (supabase as any)
      .from('subscription_plans')
      .select(`
        *,
        subscription_plan_features (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Sort features
    plan.subscription_plan_features = (plan.subscription_plan_features || []).sort(
      (a: any, b: any) => a.sort_order - b.sort_order
    )

    return NextResponse.json({ plan })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT update plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const adminClient = getAdminClient()

    // Auto-calculate price_cents from price_display if price_display is provided
    const price_cents = body.price_display 
      ? priceDisplayToCents(body.price_display)
      : (body.price_cents ?? 0)

    const { data: plan, error } = await adminClient
      .from('subscription_plans')
      .update({
        display_name: body.display_name,
        price_cents: price_cents,
        price_display: body.price_display,
        billing_period: body.billing_period,
        description: body.description,
        is_recommended: body.is_recommended,
        is_active: body.is_active,
        sort_order: body.sort_order,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating plan:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ plan })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = getAdminClient()

    // Check if plan is one of the core plans (can't delete these)
    const { data: plan } = await adminClient
      .from('subscription_plans')
      .select('name')
      .eq('id', id)
      .single()

    if (plan && ['free', 'basic', 'enhanced', 'premium'].includes(plan.name)) {
      return NextResponse.json({ error: 'Cannot delete core subscription plans' }, { status: 400 })
    }

    const { error } = await adminClient
      .from('subscription_plans')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting plan:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

