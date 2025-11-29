import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import StageEditForm from '@/components/admin/StageEditForm'

export default async function NewStagePage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Stage</h1>
        <p className="mt-2 text-gray-600">Create a new divorce stage</p>
      </div>

      <StageEditForm stage={null} />
    </div>
  )
}

