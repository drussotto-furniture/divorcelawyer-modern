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
    <div className="p-3 md:p-4 lg:p-5">
      <div className="mb-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {auth.isSuperAdmin ? 'Edit Lawyer' : 'My Profile'}
        </h1>
        <p className="mt-1 text-sm md:text-base text-gray-600">
          {typedLawyer.first_name} {typedLawyer.last_name}
        </p>
      </div>
      <LawyerEditForm lawyer={typedLawyer} auth={auth} />
    </div>
  )
}

