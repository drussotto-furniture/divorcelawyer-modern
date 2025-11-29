import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ArticleEditForm from '@/components/admin/ArticleEditForm'

export default async function NewArticlePage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  // Fetch all categories for dropdown
  const { data: categories } = await supabase
    .from('article_categories')
    .select('id, name, slug')
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Article</h1>
        <p className="mt-2 text-gray-600">Create a new educational article</p>
      </div>

      <ArticleEditForm article={null} categories={categories || []} />
    </div>
  )
}

