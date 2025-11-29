import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import TeamMemberEditForm from '@/components/admin/TeamMemberEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TeamMemberEditPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  const { data: member, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !member) {
    notFound()
  }

  // Ensure active is boolean (not null)
  const typedMember = {
    ...member,
    active: member.active ?? true
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Team Member</h1>
        <p className="mt-2 text-gray-600">{typedMember.name}</p>
      </div>

      <TeamMemberEditForm member={typedMember as any} />
    </div>
  )
}

