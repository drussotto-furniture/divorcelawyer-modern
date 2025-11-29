import { getAuthUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DirectoryPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin && !auth.isLawFirm && !auth.isLawyer) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  // Get counts for each directory type
  const [lawFirmsResult, lawyersResult] = await Promise.all([
    supabase.from('law_firms').select('id', { count: 'exact', head: true }),
    supabase.from('lawyers').select('id', { count: 'exact', head: true }),
  ])

  const lawFirmsCount = lawFirmsResult.count || 0
  const lawyersCount = lawyersResult.count || 0

  const directoryItems = [
    {
      title: 'Law Firms',
      description: 'Manage law firms and their information',
      href: '/admin/directory/law-firms',
      count: lawFirmsCount,
      icon: '🏢',
      available: auth.isSuperAdmin || auth.isLawFirm,
    },
    {
      title: 'Lawyers',
      description: 'Manage lawyers and their profiles',
      href: '/admin/directory/lawyers',
      count: lawyersCount,
      icon: '👨‍⚖️',
      available: auth.isSuperAdmin || auth.isLawFirm || auth.isLawyer,
    },
  ].filter(item => item.available)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Directory</h1>
        <p className="mt-2 text-gray-600">Manage law firms and lawyers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {directoryItems.map((item) => (
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
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">{item.count}</span>
                  <span className="text-sm text-gray-500">items</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

