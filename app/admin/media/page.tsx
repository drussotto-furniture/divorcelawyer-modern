import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import MediaLibrary from '@/components/admin/MediaLibrary'

export default async function MediaPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  // Use service role client for admin queries to bypass RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  
  // Query media with count
  const { data: media, error, count } = await supabase
    .from('media' as any)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(500) // Increased limit to show more media

  console.log('[MediaPage] Media query result:', { 
    count: media?.length || 0, 
    error: error?.message || null 
  })

  if (error) {
    console.error('[MediaPage] Error loading media:', error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="mt-2 text-gray-600">Manage images and media files</p>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Error loading media:</p>
          <p className="font-mono text-sm">{error.message}</p>
          <p className="mt-2 text-sm">Error code: {error.code || 'N/A'}</p>
          {error.message.includes('does not exist') && (
            <p className="mt-2">
              Please run migration <code className="bg-red-100 px-2 py-1 rounded">019_create_media_table.sql</code> in Supabase SQL Editor.
            </p>
          )}
          {error.message.includes('row-level security') && (
            <p className="mt-2">
              RLS policy issue. Make sure you're logged in as a super admin and that migration <code className="bg-red-100 px-2 py-1 rounded">017_add_admin_policies_for_content.sql</code> has been run.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
        <p className="mt-2 text-gray-600">
          Manage images and media files {count !== null && `(${count.toLocaleString()} total${media && media.length < count ? `, showing ${media.length}` : ''})`}
        </p>
      </div>

      {media && media.length === 0 && count === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          <p className="font-semibold">No media files found</p>
          <p className="mt-2">
            To import media from WordPress, run: <code className="bg-yellow-100 px-2 py-1 rounded">npm run import:media</code>
          </p>
          <p className="mt-1 text-sm">
            This will import media metadata from the WordPress export JSON file.
          </p>
        </div>
      )}

      {media && media.length === 0 && count !== null && count > 0 && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded">
          <p className="font-semibold">Media files exist but query returned empty</p>
          <p className="mt-2 text-sm">
            There are {count} media files in the database, but the query returned 0 results.
            This might be an RLS policy issue. Check the server console for errors.
          </p>
        </div>
      )}

      <MediaLibrary media={(media || []) as any} />
    </div>
  )
}

