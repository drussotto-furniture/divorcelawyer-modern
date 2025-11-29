import { getAuthUser, canAccessLawFirm } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import LawFirmEditForm from '@/components/admin/LawFirmEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LawFirmEditPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  // Check if user has access to this firm
  const hasAccess = await canAccessLawFirm(id)
  
  if (!hasAccess) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  const { data: firm, error } = await supabase
    .from('law_firms')
    .select('*, cities(id, name, states(abbreviation))')
    .eq('id', id)
    .single()

  if (error || !firm) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {auth.isSuperAdmin ? 'Edit Law Firm' : 'My Firm'}
        </h1>
        <p className="mt-2 text-gray-600">{firm.name}</p>
      </div>

      <LawFirmEditForm firm={firm} auth={auth} />
    </div>
  )
}

