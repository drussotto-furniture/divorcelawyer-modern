'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface AdminProtectionProps {
  children: React.ReactNode
  requireSuperAdmin?: boolean
  requireLawFirm?: boolean
  requireLawyer?: boolean
}

export default function AdminProtection({
  children,
  requireSuperAdmin = false,
  requireLawFirm = false,
  requireLawyer = false,
}: AdminProtectionProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkAccess() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/admin/login')
          return
        }

        // Get user profile
        const { data: profile, error } = await supabase
          .from('profiles' as any)
          .select('*')
          .eq('id', user.id)
          .single()

        if (error || !profile) {
          router.push('/admin/login')
          return
        }

        const role = (profile as any).role

        // Check role requirements
        if (requireSuperAdmin && role !== 'super_admin') {
          router.push('/admin/unauthorized')
          return
        }

        if (requireLawFirm && role !== 'law_firm') {
          router.push('/admin/unauthorized')
          return
        }

        if (requireLawyer && role !== 'lawyer') {
          router.push('/admin/unauthorized')
          return
        }

        // User must have at least one admin role
        if (
          role !== 'super_admin' &&
          role !== 'law_firm' &&
          role !== 'lawyer'
        ) {
          router.push('/admin/unauthorized')
          return
        }

        setHasAccess(true)
      } catch (error) {
        console.error('Error checking access:', error)
        router.push('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [router, requireSuperAdmin, requireLawFirm, requireLawyer, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return <>{children}</>
}

