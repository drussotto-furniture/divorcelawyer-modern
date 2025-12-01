import { getAuthUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import MarketsGridClient from '@/components/admin/MarketsGridClient'

export default async function MarketsPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  const { data: markets, error } = await (supabase as any)
    .from('markets')
    .select('id, name, slug, description')
    .order('name', { ascending: true })

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading markets: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Markets</h1>
          <p className="mt-2 text-gray-600">Manage geographic market areas</p>
        </div>
        <Link
          href="/admin/directory/locations/markets/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          + Add Market
        </Link>
      </div>

      <MarketsGridClient initialMarkets={(markets as any) || []} />
    </div>
  )
}

