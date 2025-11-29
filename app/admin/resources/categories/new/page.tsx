import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CategoryEditForm from '@/components/admin/CategoryEditForm'

export default async function NewCategoryPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  // Fetch all categories for parent selection
  const { data: allCategories } = await supabase
    .from('article_categories')
    .select('id, name, slug')
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Category</h1>
        <p className="mt-2 text-gray-600">Create a new article category</p>
      </div>

      <CategoryEditForm category={null} allCategories={allCategories || []} />
    </div>
  )
}

