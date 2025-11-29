'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { AuthUser } from '@/lib/auth/server'

interface AdminHeaderProps {
  auth: AuthUser
}

export default function AdminHeader({ auth }: AdminHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const getRoleDisplay = () => {
    if (auth.isSuperAdmin) return 'Super Admin'
    if (auth.isLawFirm) return 'Law Firm Admin'
    if (auth.isLawyer) return 'Lawyer'
    return 'User'
  }

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-20 h-16">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-2xl font-bold text-primary">
            Admin Panel
          </Link>
          <span className="text-sm text-gray-500">|</span>
          <span className="text-sm text-gray-600">{getRoleDisplay()}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{auth.profile?.email}</span>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}

