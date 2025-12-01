import { getAuthUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import SubscriptionTypesClient from '@/components/admin/SubscriptionTypesClient'

export default async function SubscriptionTypesPage() {
  const auth = await getAuthUser()

  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  return (
    <div className="p-3 md:p-4 lg:p-5">
      <div className="mb-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Subscription Types</h1>
        <p className="mt-1 text-sm md:text-base text-gray-600">Manage subscription types: Free, Basic, Enhanced, and Premium</p>
      </div>
      <SubscriptionTypesClient />
    </div>
  )
}


