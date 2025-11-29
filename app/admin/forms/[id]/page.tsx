import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ContactSubmissionView from '@/components/admin/ContactSubmissionView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ContactSubmissionPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  const { data: submission, error } = await supabase
    .from('contact_submissions' as any)
    .select('*, cities(name, states(abbreviation)), lawyers(first_name, last_name, slug)')
    .eq('id', id)
    .single()

  if (error || !submission) {
    notFound()
  }

  // Type assertion after error check
  const typedSubmission = submission as unknown as {
    id: string
    name: string
    email: string
    phone: string | null
    message: string
    city_id: string | null
    lawyer_id: string | null
    source: string | null
    status: string
    created_at: string
    cities?: {
      name: string
      states?: {
        abbreviation: string
      } | null
    } | null
    lawyers?: {
      first_name: string
      last_name: string
      slug: string
    } | null
  }

  // Transform to match expected type (convert null to undefined)
  const transformedSubmission = {
    ...typedSubmission,
    cities: typedSubmission.cities
      ? {
          ...typedSubmission.cities,
          states: typedSubmission.cities.states || undefined,
        }
      : undefined,
    lawyers: typedSubmission.lawyers || undefined,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contact Submission</h1>
        <p className="mt-2 text-gray-600">View submission details</p>
      </div>

      <ContactSubmissionView submission={transformedSubmission as any} />
    </div>
  )
}

