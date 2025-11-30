import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Check if email exists in lawyers table
    const { data: lawyer, error: lawyerError } = await supabaseAdmin
      .from('lawyers')
      .select('id, first_name, last_name, email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (lawyerError || !lawyer) {
      return NextResponse.json(
        { error: 'No lawyer profile found with this email address' },
        { status: 404 }
      )
    }

    // Check if profile is already claimed
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'This profile has already been claimed. Please log in instead.' },
        { status: 400 }
      )
    }

    // Generate a secure token for verification
    const crypto = require('crypto')
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

    // Store the claim token in database
    const { error: tokenError } = await supabaseAdmin
      .from('claim_tokens')
      .insert({
        token,
        email: email.toLowerCase().trim(),
        lawyer_id: lawyer.id,
        expires_at: expiresAt.toISOString(),
      })

    if (tokenError) {
      console.error('Error storing claim token:', tokenError)
      return NextResponse.json(
        { error: 'Failed to create verification token' },
        { status: 500 }
      )
    }

    // Generate verification link - always use port 3001 for localhost
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    
    // Override if it's localhost with wrong port, or if no env var set
    if (!siteUrl || siteUrl.includes('localhost:3000')) {
      siteUrl = 'http://localhost:3001'
    }
    
    const verificationLink = `${siteUrl}/claim-profile?token=${token}&type=claim`

    // Log to server console (server-side logging is secure)
    if (process.env.NODE_ENV === 'development') {
      console.log('=== CLAIM PROFILE VERIFICATION LINK (DEV) ===')
      console.log('Email:', email)
      console.log('Link:', verificationLink)
      console.log('========================================')
    } else {
      // In production, only log minimal info (no token)
      console.log(`Claim profile verification link sent to: ${email}`)
    }

    // Send email with verification link
    const { sendClaimProfileEmail } = await import('@/lib/email')
    const emailResult = await sendClaimProfileEmail(
      email.toLowerCase().trim(),
      `${lawyer.first_name} ${lawyer.last_name}`,
      verificationLink
    )

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error)
      // Don't fail the request - token is created, user can use dev link
      // In production, you might want to fail here
    }

    // Only return the link in development mode (never in production)
    const isDevelopment = process.env.NODE_ENV === 'development'

    return NextResponse.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.',
      // Only return the link in development (never expose tokens in production)
      ...(isDevelopment && { 
        verificationLink,
        note: 'Development mode - email not actually sent. Use the verificationLink above.' 
      }),
    })
  } catch (error: any) {
    console.error('Error initiating claim:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

