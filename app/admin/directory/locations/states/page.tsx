import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import StatesGridClient from '@/components/admin/StatesGridClient'

export default async function StatesPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  const { data: states, error } = await supabase
    .from('states')
    .select('id, name, slug, abbreviation')
    .order('name', { ascending: true })

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading states: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">States</h1>
          <p className="mt-2 text-gray-600">Manage US states</p>
        </div>
        <Link
          href="/admin/directory/locations/states/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          + Add State
        </Link>
      </div>

      <StatesGridClient initialStates={states || []} />
    </div>
  )
}



