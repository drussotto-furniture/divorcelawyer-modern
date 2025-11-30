import { getAuthUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import CountyEditForm from '@/components/admin/CountyEditForm'

export default async function NewCountyPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New County</h1>
        <p className="mt-2 text-gray-600">Create a new county</p>
      </div>

      <CountyEditForm county={null} />
    </div>
  )
}



