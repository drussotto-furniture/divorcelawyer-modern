import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import StageEditForm from '@/components/admin/StageEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StageEditPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  const { data: stage, error } = await supabase
    .from('stages')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !stage) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Stage</h1>
        <p className="mt-2 text-gray-600">{stage.name}</p>
      </div>

      <StageEditForm stage={stage as any} />
    </div>
  )
}

