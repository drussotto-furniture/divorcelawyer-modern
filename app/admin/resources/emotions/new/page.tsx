import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import EmotionEditForm from '@/components/admin/EmotionEditForm'

export default async function NewEmotionPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Emotion</h1>
        <p className="mt-2 text-gray-600">Create a new emotion</p>
      </div>

      <EmotionEditForm emotion={null} />
    </div>
  )
}

