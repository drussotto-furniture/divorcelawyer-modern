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

  // Type assertion for lawyer with all possible fields
  const typedLawyer = lawyer as any

  // Debug: Log what we got from the database
  if (typedLawyer) {
    console.log('[SERVER] Lawyer fetched:', {
      id: typedLawyer.id,
      name: `${typedLawyer.first_name} ${typedLawyer.last_name}`,
      specializations: typedLawyer.specializations,
      specializationsType: typeof typedLawyer.specializations,
      specializationsIsArray: Array.isArray(typedLawyer.specializations),
      bar_admissions: typedLawyer.bar_admissions,
      education: typedLawyer.education,
      awards: typedLawyer.awards,
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
          {typedLawyer.first_name} {typedLawyer.last_name}
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
              <strong>Specializations:</strong> {JSON.stringify(typedLawyer.specializations)} 
              (Type: {typeof typedLawyer.specializations}, Is Array: {Array.isArray(typedLawyer.specializations) ? 'Yes' : 'No'})
            </div>
            <div>
              <strong>Education:</strong> {typedLawyer.education !== undefined ? JSON.stringify(typedLawyer.education) : 'COLUMN MISSING'}
            </div>
            <div>
              <strong>Awards:</strong> {typedLawyer.awards !== undefined ? JSON.stringify(typedLawyer.awards) : 'COLUMN MISSING'}
            </div>
            <div>
              <strong>Bar Admissions:</strong> {typedLawyer.bar_admissions !== undefined ? JSON.stringify(typedLawyer.bar_admissions) : 'COLUMN MISSING'}
            </div>
            <div className="mt-2 pt-2 border-t border-yellow-300">
              <strong>All Array Fields:</strong>
              <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-48">
                {JSON.stringify({
                  specializations: typedLawyer.specializations !== undefined ? typedLawyer.specializations : 'COLUMN MISSING',
                  education: typedLawyer.education !== undefined ? typedLawyer.education : 'COLUMN MISSING',
                  awards: typedLawyer.awards !== undefined ? typedLawyer.awards : 'COLUMN MISSING',
                  bar_admissions: typedLawyer.bar_admissions !== undefined ? typedLawyer.bar_admissions : 'COLUMN MISSING',
                  publications: typedLawyer.publications !== undefined ? typedLawyer.publications : 'COLUMN MISSING',
                  professional_memberships: typedLawyer.professional_memberships !== undefined ? typedLawyer.professional_memberships : 'COLUMN MISSING',
                  certifications: typedLawyer.certifications !== undefined ? typedLawyer.certifications : 'COLUMN MISSING',
                  languages: typedLawyer.languages !== undefined ? typedLawyer.languages : 'COLUMN MISSING',
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

      <LawyerEditForm lawyer={typedLawyer} auth={auth} />
    </div>
  )
}

