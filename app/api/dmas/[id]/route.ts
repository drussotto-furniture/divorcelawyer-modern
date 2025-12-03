import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'DMA ID required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    const { data: dma, error } = await supabase
      .from('dmas')
      .select('id, name, code, slug')
      .eq('id', id)
      .single()

    if (error || !dma) {
      return NextResponse.json({ error: 'DMA not found' }, { status: 404 })
    }

    return NextResponse.json(dma)
  } catch (error: any) {
    console.error('Error fetching DMA:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

