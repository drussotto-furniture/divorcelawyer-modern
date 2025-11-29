import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ContentBlockEditForm from '@/components/admin/ContentBlockEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ContentBlockEditPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  const { data: block, error } = await supabase
    .from('content_blocks' as any)
    .select('*')
    .eq('id', id)
    .single()

  if (error || !block) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Content Block</h1>
        <p className="mt-2 text-gray-600">{block.name}</p>
      </div>

      <ContentBlockEditForm block={block} />
    </div>
  )
}

