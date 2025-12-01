import { getAuthUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import SubscriptionLimitsClient from '@/components/admin/SubscriptionLimitsClient'

export default async function SubscriptionLimitsPage() {
  const auth = await getAuthUser()

  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription Limits</h1>
        <p className="mt-2 text-gray-600">Configure maximum number of lawyers per subscription type by location</p>
      </div>
      <SubscriptionLimitsClient />
    </div>
  )
}



