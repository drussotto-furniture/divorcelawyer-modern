import { getAuthUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ResourcesPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  // Get counts for each resource type
  const [categoriesResult, stagesResult, emotionsResult] = await Promise.all([
    supabase.from('article_categories').select('id', { count: 'exact', head: true }),
    supabase.from('stages').select('id', { count: 'exact', head: true }),
    supabase.from('emotions').select('id', { count: 'exact', head: true }),
  ])

  const categoriesCount = categoriesResult.count || 0
  const stagesCount = stagesResult.count || 0
  const emotionsCount = emotionsResult.count || 0

  const resources = [
    {
      title: 'Article Categories',
      description: 'Manage article categories and organization',
      href: '/admin/resources/categories',
      count: categoriesCount,
      icon: '📁',
    },
    {
      title: 'Stages of Divorce',
      description: 'Manage divorce process stages',
      href: '/admin/resources/stages',
      count: stagesCount,
      icon: '📋',
    },
    {
      title: 'Emotions',
      description: 'Manage emotional support content',
      href: '/admin/resources/emotions',
      count: emotionsCount,
      icon: '💭',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
        <p className="mt-2 text-gray-600">Manage educational resources and content organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <Link
            key={resource.href}
            href={resource.href}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{resource.icon}</span>
                  <h2 className="text-xl font-semibold text-gray-900">{resource.title}</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">{resource.count}</span>
                  <span className="text-sm text-gray-500">items</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

