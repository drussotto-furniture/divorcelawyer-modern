import { getAuthUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import FallbackLawyersClient from '@/components/admin/FallbackLawyersClient'
import { createClient } from '@/lib/supabase/server'
import { getLawyers } from '@/lib/supabase'

export default async function FallbackLawyersPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  // Get all lawyers for selection
  const allLawyers = await getLawyers(500)
  
  // Get current fallback lawyers
  const supabase = await createClient()
  const { data: fallbackLawyers } = await (supabase as any)
    .from('fallback_lawyers')
    .select(`
      *,
      lawyers (
        id,
        first_name,
        last_name,
        slug
      )
    `)
    .order('display_order', { ascending: true })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fallback Lawyers</h1>
        <p className="mt-2 text-gray-600">
          Select which lawyers to show when location cannot be detected or when there are no lawyers in a detected location.
        </p>
      </div>

      <FallbackLawyersClient 
        allLawyers={allLawyers} 
        currentFallbackLawyers={(fallbackLawyers as any) || []} 
      />
    </div>
  )
}


