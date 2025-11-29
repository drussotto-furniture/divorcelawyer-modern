export interface User {
  id: string
  email?: string
  created_at?: string
}

export interface Profile {
  id: string
  email: string
  role: 'super_admin' | 'law_firm' | 'lawyer' | 'user'
  law_firm_id: string | null
  lawyer_id: string | null
  name: string | null
  created_at: string
  updated_at: string
}

export type UserRole = 'super_admin' | 'law_firm' | 'lawyer' | 'user'

