import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET all DMAs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    let query = (supabase as any)
      .from('dmas')
      .select('id, name, code')
      .order('name', { ascending: true })

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    }

    const { data: dmas, error } = await query

    if (error) {
      console.error('Error fetching DMAs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ dmas: dmas || [] })
  } catch (error: any) {
    console.error('Error fetching DMAs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

