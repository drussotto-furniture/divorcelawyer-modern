/**
 * Query the zip_dma_city_state view to see all zip codes with DMA, city, and state information
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function queryZipDMAView() {
  console.log('📊 Querying zip_dma_city_state view...\n')

  // Get total count
  const { count, error: countError } = await supabase
    .from('zip_dma_city_state')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('Error getting count:', countError)
    return
  }

  console.log(`Total rows in view: ${count}\n`)

  // Get first 100 rows as sample
  const { data, error } = await supabase
    .from('zip_dma_city_state')
    .select('*')
    .order('zip_code', { ascending: true })
    .limit(100)

  if (error) {
    console.error('Error querying view:', error)
    return
  }

  console.log('Sample rows (first 100):\n')
  console.log('Zip Code | DMA Code | DMA Name | City Name | State Name | State Abbr')
  console.log('-'.repeat(80))

  for (const row of data || []) {
    const zip = row.zip_code || 'N/A'
    const dmaCode = row.dma_code || 'N/A'
    const dmaName = (row.dma_name || 'N/A').substring(0, 20)
    const cityName = (row.city_name || 'N/A').substring(0, 20)
    const stateName = (row.state_name || 'N/A').substring(0, 15)
    const stateAbbr = row.state_abbreviation || 'N/A'
    
    console.log(`${zip.padEnd(9)} | ${String(dmaCode).padEnd(9)} | ${dmaName.padEnd(20)} | ${cityName.padEnd(20)} | ${stateName.padEnd(15)} | ${stateAbbr}`)
  }

  // Get statistics
  console.log('\n📈 Statistics:\n')
  
  // Count with DMA
  const { count: withDMA } = await supabase
    .from('zip_dma_city_state')
    .select('*', { count: 'exact', head: true })
    .not('dma_id', 'is', null)

  // Count with city
  const { count: withCity } = await supabase
    .from('zip_dma_city_state')
    .select('*', { count: 'exact', head: true })
    .not('city_id', 'is', null)

  // Count with both
  const { count: withBoth } = await supabase
    .from('zip_dma_city_state')
    .select('*', { count: 'exact', head: true })
    .not('dma_id', 'is', null)
    .not('city_id', 'is', null)

  console.log(`Zip codes with DMA mapping: ${withDMA || 0}`)
  console.log(`Zip codes with city mapping: ${withCity || 0}`)
  console.log(`Zip codes with both DMA and city: ${withBoth || 0}`)
  console.log(`Zip codes without DMA: ${(count || 0) - (withDMA || 0)}`)
  console.log(`Zip codes without city: ${(count || 0) - (withCity || 0)}`)
}

queryZipDMAView().catch(console.error)


