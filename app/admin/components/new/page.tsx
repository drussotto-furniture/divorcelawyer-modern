import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import ContentBlockEditForm from '@/components/admin/ContentBlockEditForm'
import Link from 'next/link'

interface PageProps {
  searchParams: { type?: string }
}

export default async function NewContentBlockPage({ searchParams }: PageProps) {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const defaultType = searchParams.type || 'custom'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Content Block</h1>
          <p className="mt-2 text-gray-600">Create a new reusable content block</p>
        </div>
        <Link
          href="/admin/components"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back to Components
        </Link>
      </div>

      <ContentBlockEditForm block={null} defaultType={defaultType} />
    </div>
  )
}

