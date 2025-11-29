import { getAuthUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function LawyersPage() {
  const auth = await getAuthUser()
  const supabase = await createClient()

  let lawyers: any[] = []
  let error = null

  if (auth.isSuperAdmin) {
    // Super admin sees all lawyers
    const result = await supabase
      .from('lawyers')
      .select('id, first_name, last_name, slug, law_firm_id, law_firms(name)')
      .order('last_name', { ascending: true })
    
    lawyers = result.data || []
    error = result.error
  } else if (auth.isLawFirm && auth.lawFirmId) {
    // Law firm sees only their lawyers
    const result = await supabase
      .from('lawyers')
      .select('id, first_name, last_name, slug, law_firm_id, law_firms(name)')
      .eq('law_firm_id', auth.lawFirmId)
      .order('last_name', { ascending: true })
    
    lawyers = result.data || []
    error = result.error
  } else if (auth.isLawyer && auth.lawyerId) {
    // Lawyer sees only themselves - redirect to their profile
    redirect(`/admin/directory/lawyers/${auth.lawyerId}`)
  } else {
    redirect('/admin/unauthorized')
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading lawyers: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lawyers</h1>
          <p className="mt-2 text-gray-600">
            {auth.isSuperAdmin 
              ? 'Manage all lawyers in the directory'
              : 'Manage lawyers in your firm'
            }
          </p>
        </div>
        {auth.isSuperAdmin && (
          <Link
            href="/admin/directory/lawyers/new"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            + Add Lawyer
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Law Firm
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
            {lawyers && lawyers.length > 0 ? (
              lawyers.map((lawyer: any) => (
                <tr key={lawyer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {lawyer.first_name} {lawyer.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{lawyer.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lawyer.law_firms?.name || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/directory/lawyers/${lawyer.id}`}
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
                  No lawyers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

