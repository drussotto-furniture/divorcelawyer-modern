import { createClient } from '@/lib/supabase/server'
import type { User, Profile } from '@/types/auth'

export interface AuthUser {
  user: User | null
  profile: Profile | null
  isSuperAdmin: boolean
  isLawFirm: boolean
  isLawyer: boolean
  lawFirmId: string | null
  lawyerId: string | null
}

// Type for profile data from database (before migration types are regenerated)
interface ProfileData {
  role: 'super_admin' | 'law_firm' | 'lawyer' | 'user'
  law_firm_id: string | null
  lawyer_id: string | null
}

/**
 * Get the current authenticated user and their profile
 */
export async function getAuthUser(): Promise<AuthUser> {
  const supabase = await createClient()
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      user: null,
      profile: null,
      isSuperAdmin: false,
      isLawFirm: false,
      isLawyer: false,
      lawFirmId: null,
      lawyerId: null,
    }
  }

  // Get user profile
  // Note: 'profiles' table will be created by migration 002_user_roles.sql
  // After migration, regenerate types with: npm run gen:types
  const { data: profile, error: profileError } = await supabase
    .from('profiles' as any)
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      user,
      profile: null,
      isSuperAdmin: false,
      isLawFirm: false,
      isLawyer: false,
      lawFirmId: null,
      lawyerId: null,
    }
  }

  // Type assertion for profile since it's not in database types yet
  const typedProfile = profile as unknown as ProfileData
  const role = typedProfile.role
  const lawFirmId = typedProfile.law_firm_id
  const lawyerId = typedProfile.lawyer_id

  return {
    user,
    profile: profile as unknown as Profile | null,
    isSuperAdmin: role === 'super_admin',
    isLawFirm: role === 'law_firm',
    isLawyer: role === 'lawyer',
    lawFirmId: lawFirmId || null,
    lawyerId: lawyerId || null,
  }
}

/**
 * Check if user has access to a specific law firm
 */
export async function canAccessLawFirm(firmId: string): Promise<boolean> {
  const auth = await getAuthUser()
  
  if (auth.isSuperAdmin) {
    return true
  }
  
  if (auth.isLawFirm && auth.lawFirmId === firmId) {
    return true
  }
  
  return false
}

/**
 * Check if user has access to a specific lawyer
 */
export async function canAccessLawyer(lawyerId: string): Promise<boolean> {
  const auth = await getAuthUser()
  
  if (auth.isSuperAdmin) {
    return true
  }
  
  if (auth.isLawyer && auth.lawyerId === lawyerId) {
    return true
  }
  
  // Law firm admins can access lawyers in their firm
  if (auth.isLawFirm && auth.lawFirmId) {
    const supabase = await createClient()
    const { data: lawyer } = await supabase
      .from('lawyers')
      .select('law_firm_id')
      .eq('id', lawyerId)
      .maybeSingle()
    
    return lawyer?.law_firm_id === auth.lawFirmId
  }
  
  return false
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const auth = await getAuthUser()
  
  if (!auth.user || !auth.profile) {
    throw new Error('Authentication required')
  }
  
  return auth
}

/**
 * Require super admin access - throws error if not super admin
 */
export async function requireSuperAdmin(): Promise<AuthUser> {
  const auth = await requireAuth()
  
  if (!auth.isSuperAdmin) {
    throw new Error('Super admin access required')
  }
  
  return auth
}

// Export types for use in components
export type { User, Profile } from '@/types/auth'
