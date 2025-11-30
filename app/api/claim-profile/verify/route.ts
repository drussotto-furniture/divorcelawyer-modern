import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
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

    // Verify the token using Supabase's verifyOtp or similar
    // For now, we'll use a simpler approach with a claim_tokens table
    // Check if token exists and is valid
    const { data: claimToken, error: tokenError } = await supabaseAdmin
      .from('claim_tokens')
      .select('email, lawyer_id, expires_at')
      .eq('token', token)
      .single()

    if (tokenError) {
      console.error('Token lookup error:', tokenError)
      // Check if table doesn't exist
      if (tokenError.code === '42P01' || tokenError.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Database table not found. Please run migration 028_create_claim_tokens_table.sql in Supabase.' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: 'Invalid or expired verification link' },
        { status: 400 }
      )
    }

    if (!claimToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification link' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (new Date(claimToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Verification link has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Get lawyer info
    const { data: lawyer, error: lawyerError } = await supabaseAdmin
      .from('lawyers')
      .select('id, first_name, last_name, email')
      .eq('id', claimToken.lawyer_id)
      .single()

    if (lawyerError || !lawyer) {
      return NextResponse.json(
        { error: 'Lawyer profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      email: claimToken.email,
      lawyerId: lawyer.id,
      lawyerName: `${lawyer.first_name} ${lawyer.last_name}`,
    })
  } catch (error: any) {
    console.error('Error verifying claim token:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

