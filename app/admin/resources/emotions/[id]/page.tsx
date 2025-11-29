import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EmotionEditForm from '@/components/admin/EmotionEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EmotionEditPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  const { data: emotion, error } = await supabase
    .from('emotions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !emotion) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Emotion</h1>
        <p className="mt-2 text-gray-600">{emotion.name}</p>
      </div>

      <EmotionEditForm emotion={emotion as any} />
    </div>
  )
}

