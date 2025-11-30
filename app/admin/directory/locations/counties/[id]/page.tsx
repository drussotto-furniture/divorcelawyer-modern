import { getAuthUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import CountyEditForm from '@/components/admin/CountyEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CountyEditPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  const { data: county, error } = await supabase
    .from('counties')
    .select('*, states(id, name, abbreviation)')
    .eq('id', id)
    .single()

  if (error || !county) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit County</h1>
        <p className="mt-2 text-gray-600">{county.name}</p>
      </div>

      <CountyEditForm county={county} />
    </div>
  )
}



