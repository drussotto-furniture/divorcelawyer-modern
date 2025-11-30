import { getAuthUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import StateEditForm from '@/components/admin/StateEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StateEditPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  const { data: state, error } = await supabase
    .from('states')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !state) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit State</h1>
        <p className="mt-2 text-gray-600">{state.name}</p>
      </div>

      <StateEditForm state={state} />
    </div>
  )
}



