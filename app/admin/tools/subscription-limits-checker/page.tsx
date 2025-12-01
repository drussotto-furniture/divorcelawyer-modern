import { getAuthUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscriptionLimitsCheckerClient from '@/components/admin/SubscriptionLimitsCheckerClient'

export default async function SubscriptionLimitsCheckerPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()

  // Get all DMAs
  const { data: dmas, error: dmasError } = await (supabase as any)
    .from('dmas')
    .select('id, name, code')
    .order('name')

  // Get all subscription types
  const { data: subscriptionTypes, error: subscriptionTypesError } = await supabase
    .from('subscription_types')
    .select('name, display_name, sort_order')
    .order('sort_order')

  // Get all subscription limits
  const { data: subscriptionLimits, error: limitsError } = await supabase
    .from('subscription_limits')
    .select('*')
    .order('location_type, location_value')

  if (dmasError || subscriptionTypesError || limitsError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading data: {dmasError?.message || subscriptionTypesError?.message || limitsError?.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription Limits Checker</h1>
        <p className="mt-2 text-gray-600">
          Check for subscription limit violations across all DMAs
        </p>
      </div>

      <SubscriptionLimitsCheckerClient 
        dmas={dmas || []}
        subscriptionTypes={subscriptionTypes || []}
        subscriptionLimits={subscriptionLimits || []}
      />
    </div>
  )
}

