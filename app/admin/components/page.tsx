import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ComponentsPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  const { data: blocks, error } = await supabase
    .from('content_blocks' as any)
    .select('*')
    .order('component_type', { ascending: true })
    .order('order_index', { ascending: true })

  // Group by component type
  const groupedBlocks = (blocks || []).reduce((acc: any, block: any) => {
    if (!acc[block.component_type]) {
      acc[block.component_type] = []
    }
    acc[block.component_type].push(block)
    return acc
  }, {})

  const componentTypes = [
    { key: 'three_pack', name: 'Three Pack Component' },
    { key: 'vetting_process', name: 'Vetting Process Card' },
    { key: 'need_assistance', name: 'Need Assistance Card' },
    { key: 'coming_soon', name: 'Coming Soon Card' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Blocks</h1>
          <p className="mt-2 text-gray-600">Manage reusable content blocks used across multiple pages</p>
        </div>
        <Link
          href="/admin/components/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          + Add Content Block
        </Link>
      </div>

      {componentTypes.map((type) => {
        const typeBlocks = groupedBlocks[type.key] || []

        return (
          <div key={type.key} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{type.name}</h2>
              <span className="text-sm text-gray-500">
                {typeBlocks.length} {typeBlocks.length === 1 ? 'block' : 'blocks'}
              </span>
            </div>
            {typeBlocks.length > 0 ? (
              <div className="space-y-4">
                {typeBlocks.map((block: any) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{block.name}</h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                            block.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {block.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Slug: <code className="bg-gray-100 px-1 rounded">{block.slug}</code></p>
                      {block.title && (
                        <p className="text-sm text-gray-700 mt-1">Title: {block.title}</p>
                      )}
                      {block.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {block.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <Link
                        href={`/admin/components/${block.id}`}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No {type.name.toLowerCase()} blocks yet.</p>
                <Link
                  href={`/admin/components/new?type=${type.key}`}
                  className="text-primary hover:text-primary/80 text-sm font-medium mt-2 inline-block"
                >
                  Create one →
                </Link>
              </div>
            )}
          </div>
        )
      })}

      {(!blocks || blocks.length === 0) && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No content blocks found. Create your first block above.</p>
        </div>
      )}
    </div>
  )
}

