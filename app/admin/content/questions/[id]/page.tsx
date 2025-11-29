import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import QuestionEditForm from '@/components/admin/QuestionEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QuestionEditPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  const { data: question, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !question) {
    notFound()
  }

  // Type assertion first, then ensure all required fields are present
  const questionAny = question as any
  const typedQuestion = {
    ...questionAny,
    tags: questionAny.tags || null,
    not_helpful_count: questionAny.not_helpful_count || 0,
    status: questionAny.status || 'published'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Question</h1>
        <p className="mt-2 text-gray-600">{typedQuestion.question}</p>
      </div>

      <QuestionEditForm question={typedQuestion as any} />
    </div>
  )
}

