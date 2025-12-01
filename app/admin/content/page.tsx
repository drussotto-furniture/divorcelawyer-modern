import { getAuthUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ContentPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  // Get counts for each content type
  const [articlesResult, videosResult, questionsResult] = await Promise.all([
    supabase.from('articles').select('id', { count: 'exact', head: true }),
    supabase.from('videos').select('id', { count: 'exact', head: true }),
    supabase.from('questions').select('id', { count: 'exact', head: true }),
  ])

  const articlesCount = articlesResult.count || 0
  const videosCount = videosResult.count || 0
  const questionsCount = questionsResult.count || 0

  const contentItems = [
    {
      title: 'Homepage Content',
      description: 'Manage homepage sections and content blocks',
      href: '/admin/content/homepage',
      count: null,
      icon: '🏠',
    },
    {
      title: 'Articles',
      description: 'Manage articles and blog posts',
      href: '/admin/content/articles',
      count: articlesCount,
      icon: '📝',
    },
    {
      title: 'Videos',
      description: 'Manage video content',
      href: '/admin/content/videos',
      count: videosCount,
      icon: '🎥',
    },
    {
      title: 'Questions/FAQ',
      description: 'Manage frequently asked questions',
      href: '/admin/content/questions',
      count: questionsCount,
      icon: '❓',
    },
  ]

  return (
    <div className="p-3 md:p-4 lg:p-5 space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Content</h1>
        <p className="mt-1 text-sm md:text-base text-gray-600">Manage all site content and articles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {contentItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{item.icon}</span>
                  <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                {item.count !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">{item.count}</span>
                    <span className="text-sm text-gray-500">items</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

