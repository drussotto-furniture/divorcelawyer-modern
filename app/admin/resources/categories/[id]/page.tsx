import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import CategoryEditForm from '@/components/admin/CategoryEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CategoryEditPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  const { data: category, error } = await supabase
    .from('article_categories')
    .select('*')
    .eq('id', id)
    .single()

  // Fetch all categories for parent selection
  const { data: allCategories } = await supabase
    .from('article_categories')
    .select('id, name, slug')
    .neq('id', id)
    .order('name', { ascending: true })

  if (error || !category) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
        <p className="mt-2 text-gray-600">{category.name}</p>
      </div>

      <CategoryEditForm category={category as any} allCategories={allCategories || []} />
    </div>
  )
}

