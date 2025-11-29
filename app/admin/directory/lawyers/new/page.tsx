import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import LawyerEditForm from '@/components/admin/LawyerEditForm'
import Link from 'next/link'

export default async function NewLawyerPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  // Create empty lawyer object for new form
  const newLawyer = {
    id: '',
    first_name: '',
    last_name: '',
    slug: '',
    title: '',
    bio: '',
    email: '',
    phone: '',
    photo_url: '',
    bar_number: '',
    years_experience: '',
    law_firm_id: '',
    specializations: [],
    education: [],
    awards: [],
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
          <h1 className="text-3xl font-bold text-gray-900">New Lawyer</h1>
          <p className="mt-2 text-gray-600">Create a new lawyer profile in the directory</p>
        </div>
        <Link
          href="/admin/directory/lawyers"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back to Lawyers
        </Link>
      </div>

      <LawyerEditForm lawyer={newLawyer} auth={auth} isNew={true} />
    </div>
  )
}

