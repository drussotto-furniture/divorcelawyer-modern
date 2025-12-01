/**
 * Quick script to check DMA zip code counts in database vs CSV
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDMACounts() {
  // Get Birmingham and Atlanta DMAs by code
  const { data: dmas, error } = await supabase
    .from('dmas')
    .select('id, code, name')
    .in('code', [524, 630]) // Atlanta and Birmingham codes

  if (error) {
    console.error('Error fetching DMAs:', error)
    return
  }

  console.log('\n📊 DMA Zip Code Counts:\n')

  for (const dma of dmas || []) {
    // Get count using count query
    const { count, error: mappingError } = await supabase
      .from('zip_code_dmas')
      .select('*', { count: 'exact', head: true })
      .eq('dma_id', dma.id)

    if (mappingError) {
      console.error(`Error for ${dma.name}:`, mappingError)
      continue
    }

    console.log(`${dma.name} (code ${dma.code}): ${count || 0} zip codes`)
  }

  // Also check total
  const { count: totalCount, error: allError } = await supabase
    .from('zip_code_dmas')
    .select('*', { count: 'exact', head: true })

  if (allError) {
    console.error('Error getting total:', allError)
  } else {
    console.log(`\nTotal mappings in database: ${totalCount || 0}`)
  }
}

checkDMACounts().catch(console.error)

