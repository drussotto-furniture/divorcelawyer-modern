import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
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

    // Verify token and get claim info
    const { data: claimToken, error: tokenError } = await supabaseAdmin
      .from('claim_tokens')
      .select('email, lawyer_id, expires_at, used_at')
      .eq('token', token)
      .single()

    if (tokenError) {
      console.error('Token verification error:', tokenError)
      // Check if table doesn't exist
      if (tokenError.code === '42P01' || tokenError.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Database table not found. Please run the SQL migration to create the claim_tokens table.' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: tokenError.message || 'Invalid or expired verification link' },
        { status: 400 }
      )
    }

    if (!claimToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification link' },
        { status: 400 }
      )
    }

    // Check if token has already been used
    if (claimToken.used_at) {
      return NextResponse.json(
        { error: 'This verification link has already been used. Please request a new one.' },
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

    if (lawyerError) {
      console.error('Lawyer lookup error:', lawyerError)
      return NextResponse.json(
        { error: lawyerError.message || 'Lawyer profile not found' },
        { status: 404 }
      )
    }

    if (!lawyer) {
      return NextResponse.json(
        { error: 'Lawyer profile not found' },
        { status: 404 }
      )
    }

    // Check if user already exists by checking profiles table
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles' as any)
      .select('id, email')
      .eq('email', claimToken.email)
      .single()

    let userId: string

    if (existingProfile?.id) {
      // User exists, update password and link profile
      userId = existingProfile.id
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password,
        email_confirm: true,
      })

      if (updateError) {
        console.error('Password update error:', updateError)
        return NextResponse.json(
          { error: updateError.message || 'Failed to update password' },
          { status: 500 }
        )
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: claimToken.email,
        password: password,
        email_confirm: true,
      })

      if (createError) {
        console.error('User creation error:', createError)
        // If user already exists (duplicate email), try to get the user ID
        if (createError.message?.includes('already registered') || createError.message?.includes('already exists')) {
          // Try to find the user by querying profiles or auth.users
          const { data: profileData } = await supabaseAdmin
            .from('profiles' as any)
            .select('id')
            .eq('email', claimToken.email)
            .single()
          
          if (profileData?.id) {
            userId = profileData.id
            // Update password for existing user
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
              password: password,
              email_confirm: true,
            })
            
            if (updateError) {
              console.error('Password update error:', updateError)
              return NextResponse.json(
                { error: updateError.message || 'Failed to update password' },
                { status: 500 }
              )
            }
          } else {
            return NextResponse.json(
              { error: 'User already exists but profile not found. Please contact support.' },
              { status: 500 }
            )
          }
        } else {
          return NextResponse.json(
            { error: createError.message || 'Failed to create account' },
            { status: 500 }
          )
        }
      } else if (!newUser?.user) {
        console.error('User creation failed: no user returned')
        return NextResponse.json(
          { error: 'Failed to create account - no user returned' },
          { status: 500 }
        )
      } else {
        userId = newUser.user.id
      }
    }

    // Create or update profile with lawyer role and link
    const { error: profileError } = await supabaseAdmin
      .from('profiles' as any)
      .upsert({
        id: userId,
        email: claimToken.email,
        role: 'lawyer',
        name: `${lawyer.first_name} ${lawyer.last_name}`,
        lawyer_id: lawyer.id,
      } as any, {
        onConflict: 'id',
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json(
        { error: profileError.message || 'Failed to link profile to lawyer account' },
        { status: 500 }
      )
    }

    // Mark token as used (one-time use)
    await supabaseAdmin
      .from('claim_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)

    return NextResponse.json({
      success: true,
      lawyerId: lawyer.id,
      message: 'Profile claimed successfully',
    })
  } catch (error: any) {
    console.error('Error completing claim:', error)
    // Return more specific error message
    const errorMessage = error?.message || error?.error || 'An error occurred. Please try again.'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

