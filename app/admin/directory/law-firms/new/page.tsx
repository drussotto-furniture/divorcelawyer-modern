import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import LawFirmEditForm from '@/components/admin/LawFirmEditForm'
import Link from 'next/link'

export default async function NewLawFirmPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  // Create empty firm object for new form
  const newFirm = {
    id: '',
    name: '',
    slug: '',
    description: '',
    content: '',
    address: '',
    city_id: '',
    phone: '',
    email: '',
    website: '',
    logo_url: '',
    rating: '',
    review_count: 0,
    verified: false,
    featured: false,
    meta_title: '',
    meta_description: '',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Law Firm</h1>
          <p className="mt-2 text-gray-600">Create a new law firm in the directory</p>
        </div>
        <Link
          href="/admin/directory/law-firms"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back to Law Firms
        </Link>
      </div>

      <LawFirmEditForm firm={newFirm} auth={auth} isNew={true} />
    </div>
  )
}

