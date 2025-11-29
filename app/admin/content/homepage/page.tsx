import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HomepageContentEditor from '@/components/admin/HomepageContentEditor'

export default async function HomepageContentPage() {
  const auth = await getAuthUser()
  
  // Only super admin can access
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  // Fetch all homepage content (using type assertion until types are regenerated)
  const { data: homepageContentData, error: contentError } = await supabase
    .from('homepage_content' as any)
    .select('*')
    .order('section', { ascending: true })
    .order('order_index', { ascending: true })

  // Fetch site settings for default location
  const { data: siteSettingsData } = await supabase
    .from('site_settings' as any)
    .select('*')
    .in('key', ['default_city', 'default_city_display', 'default_state_code'])

  // Fetch real voices stories
  const { data: storiesData } = await supabase
    .from('real_voices_stories' as any)
    .select('*')
    .eq('status', 'published')
    .order('order_index', { ascending: true })

  // Fetch content categories
  const { data: categoriesData } = await supabase
    .from('content_categories' as any)
    .select('*')
    .eq('active', true)
    .order('order_index', { ascending: true })

  const homepageContent = (homepageContentData || []) as any[]
  const siteSettings = (siteSettingsData || []) as any[]
  const stories = (storiesData || []) as any[]
  const categories = (categoriesData || []) as any[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Homepage Content</h1>
        <p className="mt-2 text-gray-600">
          Manage all homepage sections and content
        </p>
      </div>

      <HomepageContentEditor
        homepageContent={homepageContent}
        siteSettings={siteSettings}
        stories={stories}
        categories={categories}
      />
    </div>
  )
}

