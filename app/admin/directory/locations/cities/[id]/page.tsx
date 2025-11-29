import { getAuthUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import CityEditForm from '@/components/admin/CityEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CityEditPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  const { data: city, error } = await supabase
    .from('cities')
    .select('*, states(id, name, abbreviation), counties(id, name)')
    .eq('id', id)
    .single()

  if (error || !city) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit City</h1>
        <p className="mt-2 text-gray-600">{city.name}</p>
      </div>

      <CityEditForm city={city} />
    </div>
  )
}

