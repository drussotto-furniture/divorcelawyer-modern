import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import TagAssignment from '@/components/admin/TagAssignment'

export default async function TagPagesPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const staticPages = [
    { name: 'Homepage', contentType: 'page', contentId: 'home' },
    { name: 'Connect with Lawyer', contentType: 'page', contentId: 'connect-with-lawyer' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Page Tags</h1>
        <p className="mt-2 text-gray-600">Assign tags to static pages</p>
      </div>

      <div className="space-y-6">
        {staticPages.map((page) => (
          <div key={page.contentId} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{page.name}</h2>
            <TagAssignment contentType={page.contentType} contentId={page.contentId} />
          </div>
        ))}
      </div>
    </div>
  )
}



