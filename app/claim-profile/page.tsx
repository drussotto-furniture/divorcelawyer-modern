'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function ClaimProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [lawyerName, setLawyerName] = useState('')
  const [verificationLink, setVerificationLink] = useState('')

  // Check if we're on the password step (after email verification)
  useEffect(() => {
    if (token && type === 'claim') {
      setStep('password')
      setLoading(true)
      // Verify token and get lawyer info
      verifyToken()
    }
  }, [token, type])

  const verifyToken = async () => {
    try {
      setError('')
      setSuccess('')
      const response = await fetch(`/api/claim-profile/verify?token=${token}`)
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Invalid or expired verification link')
        setStep('email')
        setLoading(false)
        return
      }
      
      setEmail(data.email)
      setLawyerName(data.lawyerName)
      setSuccess('Email verified! Please create a password to claim your profile.')
      setLoading(false)
    } catch (err) {
      console.error('Verify token error:', err)
      setError('Failed to verify email. Please try again.')
      setStep('email')
      setLoading(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/claim-profile/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send verification email')
        setLoading(false)
        return
      }

      // In development only, show the verification link
      if (data.verificationLink && process.env.NODE_ENV === 'development') {
        // Only log in development
        console.log('=== CLAIM PROFILE VERIFICATION LINK (DEV ONLY) ===')
        console.log('Email:', email)
        console.log('Link:', data.verificationLink)
        console.log('========================================')
        
        setSuccess(`Verification email sent! Click the link below to continue.`)
        // Store the link for display (only in dev)
        setVerificationLink(data.verificationLink)
      } else {
        setSuccess('Verification email sent! Please check your inbox and click the link to continue.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/claim-profile/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to claim profile')
        setLoading(false)
        return
      }

      // Success! Now sign in the user automatically
      setSuccess('Profile claimed successfully! Signing you in...')
      
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (signInError) {
        // If auto-signin fails, redirect to login with success message
        console.error('Auto-signin error:', signInError)
        setSuccess('Profile claimed successfully! Please log in with your new password.')
        setTimeout(() => {
          router.push(`/admin/login?email=${encodeURIComponent(email)}&message=Profile claimed successfully! Please sign in.`)
        }, 2000)
        setLoading(false)
        return
      }

      // Successfully signed in! Redirect to their profile
      setSuccess('Profile claimed and signed in! Redirecting...')
      setTimeout(() => {
        router.push(`/admin/directory/lawyers/${data.lawyerId}`)
      }, 1000)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            {step === 'email' ? 'Claim Your Profile' : 'Create Password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 'email' 
              ? 'Enter your email address to claim your lawyer profile'
              : `Welcome, ${lawyerName}! Create a password to complete your profile claim.`
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            <div>{success}</div>
            {verificationLink && process.env.NODE_ENV === 'development' && (
              <div className="mt-3 pt-3 border-t border-green-300">
                <p className="text-sm font-semibold mb-2">⚠️ Development Mode Only - Verification Link:</p>
                <a 
                  href={verificationLink}
                  className="block text-blue-600 underline hover:text-blue-800 break-all text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {verificationLink}
                </a>
                <p className="text-xs text-gray-600 mt-2">This link is only shown in development. In production, check your email.</p>
              </div>
            )}
          </div>
        )}

        {step === 'email' ? (
          <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
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
              <p className="mt-2 text-xs text-gray-500">
                We'll send a verification email to confirm this is your profile.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Verification Email'}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to website
              </Link>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="••••••••"
                minLength={6}
              />
              <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Claiming Profile...' : 'Claim Profile'}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/claim-profile"
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Start over
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ClaimProfile() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <ClaimProfileContent />
    </Suspense>
  )
}

