import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import VideoEditForm from '@/components/admin/VideoEditForm'

export default async function NewVideoPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Video</h1>
        <p className="mt-2 text-gray-600">Add a new video</p>
      </div>

      <VideoEditForm video={null} />
    </div>
  )
}

