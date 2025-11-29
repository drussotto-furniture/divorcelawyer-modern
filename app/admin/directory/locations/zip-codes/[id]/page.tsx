import { getAuthUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ZipCodeEditForm from '@/components/admin/ZipCodeEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ZipCodeEditPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  const { data: zipCode, error } = await supabase
    .from('zip_codes')
    .select('*, cities(id, name, state_id, states(abbreviation))')
    .eq('id', id)
    .single()

  if (error || !zipCode) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Zip Code</h1>
        <p className="mt-2 text-gray-600">{zipCode.zip_code}</p>
      </div>

      <ZipCodeEditForm zipCode={zipCode} />
    </div>
  )
}

