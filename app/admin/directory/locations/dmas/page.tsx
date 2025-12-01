import { getAuthUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DMAsGridClient from '@/components/admin/DMAsGridClient'

export default async function DMAsPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  // Fetch DMAs
  const { data: dmas, error } = await (supabase as any)
    .from('dmas')
    .select(`
      id,
      code,
      name,
      slug,
      description
    `)
    .order('code', { ascending: true })

  // Fetch zip code counts using database function for efficiency and accuracy
  // This avoids the 1000 row limit and is more performant
  let countsByDma: Record<string, number> = {}
  let totalMappedZipCodes = 0
  
  const { data: zipCodeCounts, error: countError } = await supabase
    .rpc('get_dma_zip_code_counts')
  
  if (countError) {
    // Fallback to fetching all records if function doesn't exist yet
    console.warn('RPC function not available, using fallback method:', countError.message)
    const { data: allZipCodeMappings, error: fallbackError } = await supabase
      .from('zip_code_dmas')
      .select('dma_id')
      .limit(100000) // High limit as fallback
    
    if (fallbackError) {
      console.error('Error fetching zip code counts:', fallbackError)
    } else if (allZipCodeMappings) {
      // Calculate counts from all records
      for (const item of allZipCodeMappings) {
        countsByDma[item.dma_id] = (countsByDma[item.dma_id] || 0) + 1
        totalMappedZipCodes++
      }
    }
  } else if (zipCodeCounts) {
    // Calculate accurate counts from function results
    for (const item of zipCodeCounts) {
      countsByDma[item.dma_id] = Number(item.zip_code_count)
      totalMappedZipCodes += Number(item.zip_code_count)
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading DMAs: {error.message}
      </div>
    )
  }

  // Transform data to include zip_code_count
  const dmasWithCounts = (dmas || []).map((dma: any) => ({
    ...dma,
    zip_code_count: countsByDma[dma.id] || 0,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DMAs</h1>
          <p className="mt-2 text-gray-600">Manage Designated Marketing Areas</p>
        </div>
        <Link
          href="/admin/directory/locations/dmas/new"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          + Add DMA
        </Link>
      </div>

      <DMAsGridClient initialDMAs={dmasWithCounts} totalMappedZipCodes={totalMappedZipCodes} />
    </div>
  )
}

