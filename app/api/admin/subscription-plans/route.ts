import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET all subscription plans with features
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: plans, error } = await (supabase as any)
      .from('subscription_plans')
      .select(`
        *,
        subscription_plan_features (*)
      `)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching plans:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sort and deduplicate features within each plan
    const plansWithSortedFeatures = (plans || []).map((plan: any) => {
      // Deduplicate features by feature_name
      const seenFeatures = new Set<string>()
      const uniqueFeatures = (plan.subscription_plan_features || [])
        .filter((f: any) => {
          if (seenFeatures.has(f.feature_name)) {
            return false
          }
          seenFeatures.add(f.feature_name)
          return true
        })
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
      
      return {
        ...plan,
        subscription_plan_features: uniqueFeatures,
      }
    })

    return NextResponse.json({ plans: plansWithSortedFeatures })
  } catch (error: any) {
    console.error('Error in subscription plans API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create a new plan
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
    const { name, display_name, price_cents, price_display, billing_period, description, is_recommended, sort_order } = body

    // Use service role for insert
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    const { data: plan, error } = await adminClient
      .from('subscription_plans')
      .insert({
        name,
        display_name,
        price_cents: price_cents || 0,
        price_display: price_display || '$0',
        billing_period: billing_period || 'month',
        description,
        is_recommended: is_recommended || false,
        sort_order: sort_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating plan:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ plan })
  } catch (error: any) {
    console.error('Error creating subscription plan:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

