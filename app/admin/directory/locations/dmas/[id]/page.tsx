import { getAuthUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DMAEditForm from '@/components/admin/DMAEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DMAEditPage({ params }: PageProps) {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const resolvedParams = await params
  const isNew = resolvedParams.id === 'new'
  const supabase = await createClient()
  
  let dma = null
  if (!isNew) {
    const { data, error } = await (supabase as any)
      .from('dmas')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading DMA: {error.message}
        </div>
      )
    }

    dma = data
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isNew ? 'Create DMA' : 'Edit DMA'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isNew ? 'Create a new Designated Marketing Area' : 'Edit DMA details and zip code mappings'}
        </p>
      </div>

      <DMAEditForm dma={dma} />
    </div>
  )
}


