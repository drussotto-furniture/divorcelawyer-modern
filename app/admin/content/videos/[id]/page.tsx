import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import VideoEditForm from '@/components/admin/VideoEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VideoEditPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  const { data: video, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !video) {
    notFound()
  }

  // Ensure status is a string (not null)
  const typedVideo = {
    ...video,
    status: video.status || 'draft'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Video</h1>
        <p className="mt-2 text-gray-600">{typedVideo.title}</p>
      </div>

      <VideoEditForm video={typedVideo as any} />
    </div>
  )
}

