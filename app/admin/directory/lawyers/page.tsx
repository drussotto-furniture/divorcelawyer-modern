import { getAuthUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import LawyersGridClient from '@/components/admin/LawyersGridClient'

export default async function LawyersPage() {
  const auth = await getAuthUser()
  const supabase = await createClient()

  let lawyers: any[] = []
  let error = null

  if (auth.isSuperAdmin) {
    // Super admin sees all lawyers
    const result = await supabase
      .from('lawyers')
      .select(`
        id, 
        first_name, 
        last_name, 
        slug, 
        email, 
        subscription_type, 
        law_firm_id, 
        photo_url, 
        office_zip_code,
        law_firms(name),
        lawyer_service_areas(
          dma_id,
          dmas(id, name, code)
        )
      `)
      .order('last_name', { ascending: true })
    
    lawyers = result.data || []
    error = result.error
    
    // Debug: Log first lawyer's structure
    if (lawyers.length > 0 && process.env.NODE_ENV === 'development') {
      console.log('Sample lawyer from query:', JSON.stringify(lawyers[0], null, 2))
    }
  } else if (auth.isLawFirm && auth.lawFirmId) {
    // Law firm sees only their lawyers
    const result = await supabase
      .from('lawyers')
      .select(`
        id, 
        first_name, 
        last_name, 
        slug, 
        email, 
        subscription_type, 
        law_firm_id, 
        photo_url, 
        office_zip_code,
        law_firms(name),
        lawyer_service_areas(
          dma_id,
          dmas(id, name, code)
        )
      `)
      .eq('law_firm_id', auth.lawFirmId)
      .order('last_name', { ascending: true })
    
    lawyers = result.data || []
    error = result.error
    
    // Debug: Log first lawyer's structure
    if (lawyers.length > 0 && process.env.NODE_ENV === 'development') {
      console.log('Sample lawyer from query (law firm):', JSON.stringify(lawyers[0], null, 2))
    }
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
    <div className="pt-3 pr-3 pb-3 md:pt-4 md:pr-4 md:pb-4 lg:pt-5 lg:pr-5 lg:pb-5 space-y-4 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Lawyers</h1>
          <p className="mt-1 text-sm md:text-base text-gray-600">
            {auth.isSuperAdmin
              ? 'Manage all lawyers in the directory'
              : 'Manage lawyers in your firm'
            }
          </p>
        </div>
        {auth.isSuperAdmin && (
          <div className="flex gap-3">
            <Link
              href="/admin/tools/subscription-limits-checker"
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Check Limits
            </Link>
            <Link
              href="/admin/directory/lawyers/new"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              + Add Lawyer
            </Link>
          </div>
        )}
      </div>

      <LawyersGridClient initialLawyers={lawyers} isSuperAdmin={auth.isSuperAdmin} />
    </div>
  )
}

