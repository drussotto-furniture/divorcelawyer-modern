import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function QuestionsPage() {
  const auth = await getAuthUser()
  
  // Only super admin can access
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, question, answer, slug, status, category, helpful_count')
    .order('helpful_count', { ascending: false })
    .limit(50)

  // Log error for debugging
  if (error) {
    console.error('Error fetching questions:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Questions/FAQ</h1>
          <p className="mt-2 text-gray-600">Manage frequently asked questions</p>
        </div>
        <Link
          href="/admin/content/questions/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          + Add Question
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Question
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Helpful
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {questions && questions.length > 0 ? (
              questions.map((q: any) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{q.question}</div>
                    <div className="text-sm text-gray-500 line-clamp-2 mt-1">{q.answer}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {q.category || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      q.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {q.helpful_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/content/questions/${q.id}`}
                      className="text-primary hover:text-primary/80"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  {error ? (
                    <div className="space-y-2">
                      <p className="text-red-600 font-medium">Error loading questions</p>
                      <p className="text-sm text-gray-400">{error.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {error.message.includes('status') 
                          ? 'Please run migration 018_add_missing_questions_columns.sql to add the status column.'
                          : 'Please run migrations 017_add_admin_policies_for_content.sql and 018_add_missing_questions_columns.sql'
                        }
                      </p>
                    </div>
                  ) : (
                    'No questions found'
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

