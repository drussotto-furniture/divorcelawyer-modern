import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import QuestionEditForm from '@/components/admin/QuestionEditForm'

export default async function NewQuestionPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Question</h1>
        <p className="mt-2 text-gray-600">Create a new FAQ question</p>
      </div>

      <QuestionEditForm question={null} />
    </div>
  )
}

