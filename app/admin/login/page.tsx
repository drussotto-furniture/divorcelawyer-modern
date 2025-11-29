'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AdminLogin() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState('')

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if they have admin role
        const { data: profile } = await supabase
          .from('profiles' as any)
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile && (profile.role === 'super_admin' || profile.role === 'law_firm' || profile.role === 'lawyer')) {
          router.push('/admin')
          return
        }
      }
      setCheckingAuth(false)
    }
    checkAuth()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignup) {
        // Sign up flow
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split('@')[0],
            },
          },
        })

        if (signUpError) {
          setError(signUpError.message)
          setLoading(false)
          return
        }

        if (signUpData.user) {
          // Profile is automatically created by trigger, but with role 'user'
          // User will need admin to update their role
          setError('Account created! Please contact an administrator to grant you admin access, or update your role in the database.')
          setIsSignup(false)
          setLoading(false)
          return
        }
      } else {
        // Sign in flow
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          // Provide more helpful error messages
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials or try resetting your password.')
          } else if (signInError.message.includes('Email not confirmed')) {
            setError('Please check your email and confirm your account before signing in.')
          } else {
            setError(signInError.message)
          }
          setLoading(false)
          return
        }

        if (data.user) {
          // Check if user has admin role
          // Use the service role client to bypass RLS for this check
          // First try to get profile by user ID
          let { data: profile, error: profileError } = await supabase
            .from('profiles' as any)
            .select('role, email, id')
            .eq('id', data.user.id)
            .single()

          // Log for debugging
          console.log('Profile query result:', { 
            profile, 
            profileError: profileError ? {
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint,
              code: profileError.code
            } : null, 
            userId: data.user.id 
          })

          // If that fails, try by email
          if (profileError || !profile) {
            const { data: profileByEmail, error: emailError } = await supabase
              .from('profiles' as any)
              .select('role, email, id')
              .eq('email', data.user.email || email)
              .single()
            
            console.log('Profile by email result:', { 
              profileByEmail, 
              emailError: emailError ? {
                message: emailError.message,
                details: emailError.details,
                hint: emailError.hint,
                code: emailError.code
              } : null
            })
            
            if (profileByEmail && !emailError) {
              profile = profileByEmail
              profileError = null
            }
          }

          // If still no profile, wait a moment and try again (in case trigger is delayed)
          if (profileError || !profile) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            const retry = await supabase
              .from('profiles' as any)
              .select('role, email, id')
              .eq('id', data.user.id)
              .single()
            console.log('Retry profile query:', { 
              retry: retry.data, 
              error: retry.error ? {
                message: retry.error.message,
                details: retry.error.details,
                hint: retry.error.hint,
                code: retry.error.code
              } : null
            })
            if (retry.data) {
              profile = retry.data
              profileError = null
            }
          }

        if (profileError || !profile) {
          // Try to create profile via API route (server-side, bypasses RLS)
          try {
            const response = await fetch('/api/admin/create-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Failed to create profile')
            }

            // Wait a moment for the profile to be created
            await new Promise(resolve => setTimeout(resolve, 500))

            // Try to get profile again
            const { data: newProfile, error: newProfileError } = await supabase
              .from('profiles' as any)
              .select('role')
              .eq('id', data.user.id)
              .single()

            if (newProfileError || !newProfile) {
              setError('Profile was created but could not be retrieved. Please refresh and try again, or run this SQL: INSERT INTO profiles (id, email, role) SELECT id, email, \'super_admin\' FROM auth.users WHERE email = \'' + email + '\' ON CONFLICT (id) DO UPDATE SET role = \'super_admin\';')
              await supabase.auth.signOut()
              setLoading(false)
              return
            }

            // Check role of newly created profile
            const role = (newProfile as any).role
            if (
              role === 'super_admin' ||
              role === 'law_firm' ||
              role === 'lawyer'
            ) {
              router.push('/admin')
              router.refresh()
            } else {
              setError('Profile created but you do not have admin access. Please run this SQL to grant access: UPDATE profiles SET role = \'super_admin\' WHERE email = \'' + email + '\';')
              await supabase.auth.signOut()
            }
            setLoading(false)
            return
          } catch (apiError: any) {
            console.error('API profile creation error:', apiError)
            setError('Profile not found. Please run this SQL in Supabase SQL Editor: INSERT INTO profiles (id, email, role) SELECT id, email, \'super_admin\' FROM auth.users WHERE email = \'' + email + '\' ON CONFLICT (id) DO UPDATE SET role = \'super_admin\';')
            await supabase.auth.signOut()
            setLoading(false)
            return
          }
        }

          const role = (profile as any).role
          if (
            role === 'super_admin' ||
            role === 'law_firm' ||
            role === 'lawyer'
          ) {
            router.push('/admin')
            router.refresh()
          } else {
            setError('You do not have admin access. Please contact an administrator.')
            await supabase.auth.signOut()
          }
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            {isSignup ? 'Create Admin Account' : 'Admin Login'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignup 
              ? 'Create an account to access the admin panel'
              : 'Sign in to access the admin panel'
            }
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            {isSignup && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Your Name"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="••••••••"
                minLength={isSignup ? 6 : undefined}
              />
              {isSignup && (
                <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (isSignup ? 'Creating account...' : 'Signing in...') 
                : (isSignup ? 'Create Account' : 'Sign in')
              }
            </button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup)
                setError('')
              }}
              className="text-sm text-primary hover:text-primary/80"
            >
              {isSignup 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
            <div>
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to website
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

