import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ContentBlockEditForm from '@/components/admin/ContentBlockEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

interface ContentBlock {
  id: string
  name: string
  slug: string
  component_type: string
  title: string | null
  subtitle: string | null
  description: string | null
  image_url: string | null
  link_url: string | null
  link_text: string | null
  order_index: number
  active: boolean
  created_at: string | null
  updated_at: string | null
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

  // Type assertion after error check - use unknown first for safety
  const typedBlock = block as unknown as ContentBlock

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Content Block</h1>
        <p className="mt-2 text-gray-600">{typedBlock.name}</p>
      </div>

      <ContentBlockEditForm block={typedBlock} />
    </div>
  )
}

