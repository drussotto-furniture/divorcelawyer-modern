import { getAuthUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import StateEditForm from '@/components/admin/StateEditForm'

export default async function NewStatePage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New State</h1>
        <p className="mt-2 text-gray-600">Create a new US state</p>
      </div>

      <StateEditForm state={null} />
    </div>
  )
}

