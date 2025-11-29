import { getAuthUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import CityEditForm from '@/components/admin/CityEditForm'

export default async function NewCityPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New City</h1>
        <p className="mt-2 text-gray-600">Create a new city</p>
      </div>

      <CityEditForm city={null} />
    </div>
  )
}

