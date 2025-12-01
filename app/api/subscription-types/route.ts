import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: subscriptionTypes, error } = await supabase
      .from('subscription_types')
      .select('name, display_name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('Error fetching subscription types:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch subscription types' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ subscriptionTypes: subscriptionTypes || [] })
  } catch (error: any) {
    console.error('Error fetching subscription types:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription types' },
      { status: 500 }
    )
  }
}

