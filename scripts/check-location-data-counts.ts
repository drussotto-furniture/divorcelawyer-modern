/**
 * Check Location Data Counts
 * Verifies that all location data has been imported correctly
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import fs from 'fs/promises'
import path from 'path'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Expected counts from documentation
const expectedCounts = {
  states: 52,
  counties: 3217,
  cities: 29585, // Full dataset (only 100 sample was imported)
  zip_codes: 40954,
  markets: 1, // From market.json
}

async function getJSONCount(filename: string): Promise<number> {
  try {
    const filePath = path.join(process.cwd(), 'output', filename)
    const content = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(content)
    return Array.isArray(data) ? data.length : 0
  } catch (error) {
    return 0
  }
}

async function checkLocationData() {
  console.log('🔍 Checking Location Data Counts\n')
  console.log('='.repeat(60))

  // Check States
  const { count: statesCount } = await supabase
    .from('states')
    .select('*', { count: 'exact', head: true })
  
  const statesJSONCount = await getJSONCount('states.json')
  console.log(`\n📊 States:`)
  console.log(`   Database: ${statesCount || 0}`)
  console.log(`   JSON File: ${statesJSONCount}`)
  console.log(`   Expected: ${expectedCounts.states}`)
  console.log(`   Status: ${(statesCount || 0) === expectedCounts.states ? '✅' : '⚠️'}`)

  // Check Counties
  const { count: countiesCount } = await supabase
    .from('counties')
    .select('*', { count: 'exact', head: true })
  
  const countiesJSONCount = await getJSONCount('counties.json')
  console.log(`\n📊 Counties:`)
  console.log(`   Database: ${countiesCount || 0}`)
  console.log(`   JSON File: ${countiesJSONCount}`)
  console.log(`   Expected: ${expectedCounts.counties}`)
  console.log(`   Status: ${(countiesCount || 0) === expectedCounts.counties ? '✅' : '⚠️'}`)

  // Check Cities
  const { count: citiesCount } = await supabase
    .from('cities')
    .select('*', { count: 'exact', head: true })
  
  const citiesJSONCount = await getJSONCount('cities.json')
  console.log(`\n📊 Cities:`)
  console.log(`   Database: ${citiesCount || 0}`)
  console.log(`   JSON File: ${citiesJSONCount} (sample only)`)
  console.log(`   Expected: ${expectedCounts.cities} (full dataset)`)
  console.log(`   Status: ${(citiesCount || 0) >= 100 ? '✅ (sample imported)' : '⚠️'}`)

  // Check Zip Codes
  const { count: zipCodesCount } = await supabase
    .from('zip_codes')
    .select('*', { count: 'exact', head: true })
  
  const zipCodesJSONCount = await getJSONCount('zip_codes.json')
  console.log(`\n📊 Zip Codes:`)
  console.log(`   Database: ${zipCodesCount || 0}`)
  console.log(`   JSON File: ${zipCodesJSONCount}`)
  console.log(`   Expected: ${expectedCounts.zip_codes}`)
  console.log(`   Status: ${(zipCodesCount || 0) === expectedCounts.zip_codes ? '✅' : '⚠️'}`)
  if ((zipCodesCount || 0) < expectedCounts.zip_codes) {
    console.log(`   ⚠️  Missing: ${expectedCounts.zip_codes - (zipCodesCount || 0)} zip codes`)
  }

  // Check Markets
  const { count: marketsCount } = await supabase
    .from('markets')
    .select('*', { count: 'exact', head: true })
  
  let marketsJSONCount = 0
  try {
    const marketData = await fs.readFile(
      path.join(process.cwd(), 'wordpress-export/custom-post-types/market.json'),
      'utf-8'
    )
    const markets = JSON.parse(marketData)
    marketsJSONCount = Array.isArray(markets) ? markets.length : 0
  } catch (error) {
    // File might not exist
  }

  console.log(`\n📊 Markets:`)
  console.log(`   Database: ${marketsCount || 0}`)
  console.log(`   JSON File: ${marketsJSONCount}`)
  console.log(`   Expected: ${expectedCounts.markets}`)
  console.log(`   Status: ${(marketsCount || 0) >= expectedCounts.markets ? '✅' : '⚠️'}`)

  // Check zip codes with city links
  const { count: zipCodesWithCities } = await supabase
    .from('zip_codes')
    .select('*', { count: 'exact', head: true })
    .not('city_id', 'is', null)
  
  console.log(`\n📊 Zip Codes with City Links:`)
  console.log(`   Linked: ${zipCodesWithCities || 0}`)
  console.log(`   Unlinked: ${(zipCodesCount || 0) - (zipCodesWithCities || 0)}`)
  console.log(`   Status: ${(zipCodesWithCities || 0) > 0 ? '✅ (some linked)' : '⚠️ (none linked - cities missing wordpress_id)'}`)

  console.log('\n' + '='.repeat(60))
  console.log('\n📋 Summary:')
  console.log(`   States: ${statesCount || 0}/${expectedCounts.states} ${(statesCount || 0) === expectedCounts.states ? '✅' : '⚠️'}`)
  console.log(`   Counties: ${countiesCount || 0}/${expectedCounts.counties} ${(countiesCount || 0) === expectedCounts.counties ? '✅' : '⚠️'}`)
  console.log(`   Cities: ${citiesCount || 0}/${expectedCounts.cities} ${(citiesCount || 0) >= 100 ? '✅ (sample)' : '⚠️'}`)
  console.log(`   Zip Codes: ${zipCodesCount || 0}/${expectedCounts.zip_codes} ${(zipCodesCount || 0) === expectedCounts.zip_codes ? '✅' : '⚠️'}`)
  console.log(`   Markets: ${marketsCount || 0}/${expectedCounts.markets} ${(marketsCount || 0) >= expectedCounts.markets ? '✅' : '⚠️'}`)
}

checkLocationData().catch(console.error)



