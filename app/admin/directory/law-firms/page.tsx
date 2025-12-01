import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import LawFirmsGridClient from '@/components/admin/LawFirmsGridClient'

export default async function LawFirmsPage() {
  const auth = await getAuthUser()
  const supabase = await createClient()
  
  let firms: any[] = []
  let error = null

  if (auth.isSuperAdmin) {
    // Super admin sees all firms
    const result = await supabase
      .from('law_firms')
      .select('id, name, slug, verified, city_id, cities(name, states(abbreviation))')
      .order('name', { ascending: true })
    firms = result.data || []
    error = result.error
  } else if (auth.isLawFirm && auth.lawFirmId) {
    // Law firm sees only their own firm - redirect to their firm page
    redirect(`/admin/directory/law-firms/${auth.lawFirmId}`)
  } else {
    redirect('/admin/unauthorized')
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading law firms: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Law Firms</h1>
          <p className="mt-2 text-gray-600">Manage all law firms in the directory</p>
        </div>
        <Link
          href="/admin/directory/law-firms/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          + Add Law Firm
        </Link>
      </div>

      <LawFirmsGridClient initialFirms={firms} />
    </div>
  )
}

