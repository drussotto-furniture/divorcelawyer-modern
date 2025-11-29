import { getAuthUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import MarketEditForm from '@/components/admin/MarketEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MarketEditPage({ params }: PageProps) {
  const { id } = await params
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  const { data: market, error } = await supabase
    .from('markets' as any)
    .select('*')
    .eq('id', id)
    .single()

  if (error || !market) {
    notFound()
  }

  // Type assertion for market
  const typedMarket = market as unknown as { id: string; name: string; [key: string]: any }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Market</h1>
        <p className="mt-2 text-gray-600">{typedMarket.name}</p>
      </div>

      <MarketEditForm market={typedMarket as any} />
    </div>
  )
}

