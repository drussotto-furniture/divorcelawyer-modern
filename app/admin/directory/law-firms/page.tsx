import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {firms && firms.length > 0 ? (
              firms.map((firm: any) => (
                <tr key={firm.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{firm.name}</div>
                    <div className="text-sm text-gray-500">{firm.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {firm.cities?.name && firm.cities.states?.abbreviation
                      ? `${firm.cities.name}, ${firm.cities.states.abbreviation}`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {firm.verified ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                        Not Verified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/directory/law-firms/${firm.id}`}
                      className="text-primary hover:text-primary/80"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No law firms found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

