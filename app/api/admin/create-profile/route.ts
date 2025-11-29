import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

export async function POST(request: Request) {
  try {
    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      )
    }

    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    // Get the authenticated user from the request
    // We need to get the user from the session cookie
    const { createClient: createServerClient } = await import('@/lib/supabase/server')
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if this is the first profile (no profiles exist)
    const { count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // If no profiles exist, make this user super_admin
    // Otherwise default to 'user' (they can run SQL to upgrade)
    const defaultRole = (count === 0) ? 'super_admin' : 'user'

    // Create profile using admin client (bypasses RLS)
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email || '',
        role: defaultRole,
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (error) {
      console.error('Profile creation error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, profile })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

