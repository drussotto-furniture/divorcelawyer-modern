import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import TeamMemberEditForm from '@/components/admin/TeamMemberEditForm'

export default async function NewTeamMemberPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Team Member</h1>
        <p className="mt-2 text-gray-600">Add a new team member</p>
      </div>

      <TeamMemberEditForm member={null} />
    </div>
  )
}

