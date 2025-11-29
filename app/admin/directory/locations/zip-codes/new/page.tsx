import { getAuthUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import ZipCodeEditForm from '@/components/admin/ZipCodeEditForm'

export default async function NewZipCodePage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Zip Code</h1>
        <p className="mt-2 text-gray-600">Create a new zip code</p>
      </div>

      <ZipCodeEditForm zipCode={null} />
    </div>
  )
}

