import { getAuthUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import MarketEditForm from '@/components/admin/MarketEditForm'

export default async function NewMarketPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Market</h1>
        <p className="mt-2 text-gray-600">Create a new market area</p>
      </div>

      <MarketEditForm market={null} />
    </div>
  )
}



