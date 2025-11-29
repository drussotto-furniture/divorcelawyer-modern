import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ArticleEditForm from '@/components/admin/ArticleEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ArticleEditPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  // Fetch article with category
  const { data: article, error } = await supabase
    .from('articles')
    .select('*, article_categories(id, name, slug)')
    .eq('id', id)
    .single()

  // Fetch all categories for dropdown
  const { data: categories } = await supabase
    .from('article_categories')
    .select('id, name, slug')
    .order('name', { ascending: true })

  if (error || !article) {
    notFound()
  }

  // Ensure status is a string (not null)
  const typedArticle = {
    ...article,
    status: article.status || 'draft'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Article</h1>
        <p className="mt-2 text-gray-600">{typedArticle.title}</p>
      </div>

      <ArticleEditForm article={typedArticle as any} categories={categories || []} />
    </div>
  )
}

