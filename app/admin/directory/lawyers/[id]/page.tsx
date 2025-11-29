import { getAuthUser, canAccessLawyer } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import LawyerEditForm from '@/components/admin/LawyerEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LawyerEditPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  // Check if user has access to this lawyer
  const hasAccess = await canAccessLawyer(id)
  
  if (!hasAccess) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  const { data: lawyer, error } = await supabase
    .from('lawyers')
    .select(`
      *,
      law_firms(id, name, slug)
    `)
    .eq('id', id)
    .single()

  // Debug: Log what we got from the database
  if (lawyer) {
    console.log('[SERVER] Lawyer fetched:', {
      id: lawyer.id,
      name: `${lawyer.first_name} ${lawyer.last_name}`,
      specializations: lawyer.specializations,
      specializationsType: typeof lawyer.specializations,
      specializationsIsArray: Array.isArray(lawyer.specializations),
      bar_admissions: lawyer.bar_admissions,
      education: lawyer.education,
      awards: lawyer.awards,
    })
  }

  if (error || !lawyer) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {auth.isSuperAdmin ? 'Edit Lawyer' : 'My Profile'}
        </h1>
        <p className="mt-2 text-gray-600">
          {lawyer.first_name} {lawyer.last_name}
        </p>
      </div>

      {/* Debug Info - Remove after fixing data issues */}
      {auth.isSuperAdmin && (
        <details className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <summary className="cursor-pointer font-semibold text-yellow-800 mb-2">
            🔍 Debug: Raw Database Data (Click to expand)
          </summary>
          <div className="space-y-2 text-yellow-700 text-xs">
            <div>
              <strong>Specializations:</strong> {JSON.stringify(lawyer.specializations)} 
              (Type: {typeof lawyer.specializations}, Is Array: {Array.isArray(lawyer.specializations) ? 'Yes' : 'No'})
            </div>
            <div>
              <strong>Education:</strong> {lawyer.education !== undefined ? JSON.stringify(lawyer.education) : 'COLUMN MISSING'}
            </div>
            <div>
              <strong>Awards:</strong> {lawyer.awards !== undefined ? JSON.stringify(lawyer.awards) : 'COLUMN MISSING'}
            </div>
            <div>
              <strong>Bar Admissions:</strong> {lawyer.bar_admissions !== undefined ? JSON.stringify(lawyer.bar_admissions) : 'COLUMN MISSING'}
            </div>
            <div className="mt-2 pt-2 border-t border-yellow-300">
              <strong>All Array Fields:</strong>
              <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-48">
                {JSON.stringify({
                  specializations: lawyer.specializations !== undefined ? lawyer.specializations : 'COLUMN MISSING',
                  education: lawyer.education !== undefined ? lawyer.education : 'COLUMN MISSING',
                  awards: lawyer.awards !== undefined ? lawyer.awards : 'COLUMN MISSING',
                  bar_admissions: lawyer.bar_admissions !== undefined ? lawyer.bar_admissions : 'COLUMN MISSING',
                  publications: lawyer.publications !== undefined ? lawyer.publications : 'COLUMN MISSING',
                  professional_memberships: lawyer.professional_memberships !== undefined ? lawyer.professional_memberships : 'COLUMN MISSING',
                  certifications: lawyer.certifications !== undefined ? lawyer.certifications : 'COLUMN MISSING',
                  languages: lawyer.languages !== undefined ? lawyer.languages : 'COLUMN MISSING',
                }, null, 2)}
              </pre>
            </div>
            <div className="mt-2 text-xs">
              <strong>SQL to check schema:</strong>
              <code className="block mt-1 p-2 bg-white rounded">
                SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'lawyers' ORDER BY ordinal_position;
              </code>
            </div>
          </div>
        </details>
      )}

      <LawyerEditForm lawyer={lawyer} auth={auth} />
    </div>
  )
}

