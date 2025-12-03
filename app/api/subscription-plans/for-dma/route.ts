import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET effective subscription plans for a specific DMA
// Returns global plans with any overrides applied
// Priority: Group Override > Global
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dmaId = searchParams.get('dmaId')

    if (!dmaId) {
      return NextResponse.json({ error: 'dmaId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all active global plans with their features
    const { data: globalPlans, error: plansError } = await (supabase as any)
      .from('subscription_plans')
      .select(`
        *,
        subscription_plan_features (*)
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (plansError) {
      console.error('Error fetching global plans:', plansError)
      return NextResponse.json({ error: plansError.message }, { status: 500 })
    }

    // Check if this DMA is in a group
    const { data: groupMembership, error: membershipError } = await (supabase as any)
      .from('subscription_plan_group_memberships')
      .select(`
        group_id,
        subscription_plan_groups (id, name)
      `)
      .eq('dma_id', dmaId)
      .single()

    let groupOverrides: any[] = []
    let groupInfo: { id: string; name: string } | null = null

    if (!membershipError && groupMembership) {
      groupInfo = {
        id: groupMembership.group_id,
        name: groupMembership.subscription_plan_groups?.name || 'Unknown',
      }

      // Get group overrides
      const { data: groupOverridesData, error: groupOverridesError } = await (supabase as any)
        .from('subscription_plan_group_overrides')
        .select(`
          *,
          subscription_plan_group_override_features (*)
        `)
        .eq('group_id', groupMembership.group_id)
        .eq('is_active', true)

      if (!groupOverridesError && groupOverridesData) {
        groupOverrides = groupOverridesData
      }
    }

    // Create lookup map by plan_id
    const groupOverridesByPlanId: Record<string, any> = {}
    for (const override of groupOverrides) {
      groupOverridesByPlanId[override.plan_id] = override
    }

    // Determine overall assignment type
    let assignmentType = 'global'
    if (groupInfo) {
      assignmentType = 'group'
    }

    // Apply overrides to global plans
    // Priority: Group Override > Global
    const effectivePlans = (globalPlans || []).map((plan: any) => {
      const groupOverride = groupOverridesByPlanId[plan.id]
      
      // Sort and deduplicate global features
      const seenGlobal = new Set<string>()
      const globalFeatures = (plan.subscription_plan_features || [])
        .filter((f: any) => {
          if (seenGlobal.has(f.feature_name)) return false
          seenGlobal.add(f.feature_name)
          return true
        })
        .sort((a: any, b: any) => a.sort_order - b.sort_order)

      // Check group override
      if (groupOverride) {
        let overrideFeatures = null
        if (groupOverride.has_custom_features && groupOverride.subscription_plan_group_override_features) {
          // Deduplicate features by feature_name
          const seen = new Set<string>()
          overrideFeatures = (groupOverride.subscription_plan_group_override_features || [])
            .filter((f: any) => {
              if (seen.has(f.feature_name)) return false
              seen.add(f.feature_name)
              return true
            })
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
        }

        return {
          ...plan,
          price_cents: groupOverride.price_cents !== null ? groupOverride.price_cents : plan.price_cents,
          price_display: groupOverride.price_display !== null ? groupOverride.price_display : plan.price_display,
          description: groupOverride.description !== null ? groupOverride.description : plan.description,
          subscription_plan_features: overrideFeatures || globalFeatures,
          has_dma_override: true,
          override_type: 'group',
          group_id: groupInfo?.id,
          group_name: groupInfo?.name,
          price_overridden: groupOverride.price_cents !== null,
          features_overridden: groupOverride.has_custom_features,
          override_id: groupOverride.id,
        }
      }

      // No override, use global
      return {
        ...plan,
        subscription_plan_features: globalFeatures,
        has_dma_override: false,
        override_type: 'global',
        price_overridden: false,
        features_overridden: false,
      }
    })

    return NextResponse.json({ 
      plans: effectivePlans,
      dma_id: dmaId,
      assignment_type: assignmentType,
      group_info: groupInfo,
      has_overrides: Object.keys(groupOverridesByPlanId).length > 0,
    })
  } catch (error: any) {
    console.error('Error fetching effective plans for DMA:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
