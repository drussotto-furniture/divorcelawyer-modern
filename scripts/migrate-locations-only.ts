/**
 * Migration Script: Markets and Zip Codes Only
 * This script migrates only markets and zip codes to Supabase
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function loadJSON<T>(filename: string): Promise<T> {
  const filePath = path.join(process.cwd(), 'output', filename)
  const content = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(content) as T
}

async function migrateMarkets() {
  console.log('\n📊 Migrating markets...')
  
  try {
    const marketData = await loadJSON<any[]>('../wordpress-export/custom-post-types/market.json')
    console.log(`  Found ${marketData.length} markets in JSON file`)
    
    const markets = marketData.map(item => ({
      wordpress_id: item.id,
      name: item.title?.rendered || item.title || '',
      slug: item.slug || '',
      description: item.content?.rendered || item.content || null,
    }))

    let successful = 0
    let failed = 0

    for (const market of markets) {
      try {
        const slug = market.slug || market.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        
        const { error } = await supabase.from('markets').insert({
          wordpress_id: market.wordpress_id,
          name: market.name,
          slug: slug,
          description: market.description,
        })

        if (error) {
          if (error.message.includes('duplicate')) {
            successful++ // Count duplicates as successful
          } else {
            throw error
          }
        } else {
          successful++
        }
      } catch (error) {
        failed++
        console.error(`  ❌ Failed to import market "${market.name}":`, error instanceof Error ? error.message : error)
      }
    }

    console.log(`✓ Markets: ${successful}/${markets.length} (${failed} failed)\n`)
  } catch (error) {
    console.error('❌ Error loading markets:', error)
  }
}

async function migrateZipCodes() {
  console.log('📮 Migrating zip codes...')
  
  try {
    const data = await loadJSON<any[]>('zip_codes.json')
    console.log(`  Found ${data.length} zip codes in JSON file`)

    // Get city mapping by WordPress ID
    const cityMap = new Map<number, string>()
    const { data: cities } = await supabase
      .from('cities')
      .select('id, wordpress_id')
    
    if (cities) {
      for (const city of cities) {
        if (city.wordpress_id) {
          cityMap.set(city.wordpress_id, city.id)
        }
      }
      console.log(`  Mapped ${cityMap.size} cities`)
    }

    let successful = 0
    let failed = 0
    let processed = 0

    for (const item of data) {
      processed++
      if (processed % 1000 === 0) {
        console.log(`  Processed ${processed}/${data.length}...`)
      }

      try {
        const cityWordPressId = item.meta?.['_zip_code_city'] 
          ? parseInt(item.meta['_zip_code_city'] as string)
          : null
        
        const cityId = cityWordPressId ? cityMap.get(cityWordPressId) : null

        const { error } = await supabase.from('zip_codes').insert({
          wordpress_id: parseInt(item.post_id),
          city_id: cityId || null,
          zip_code: item.title.trim(),
        })

        if (error) {
          if (error.message.includes('duplicate')) {
            successful++ // Count duplicates as successful
          } else {
            throw error
          }
        } else {
          successful++
        }
      } catch (error) {
        failed++
        if (failed <= 5) { // Only show first 5 errors
          console.error(`  ❌ Failed to import zip code "${item.title}":`, error instanceof Error ? error.message : error)
        }
      }
    }

    console.log(`✓ Zip Codes: ${successful}/${data.length} (${failed} failed)\n`)
  } catch (error) {
    console.error('❌ Error loading zip codes:', error)
  }
}

async function main() {
  console.log('🚀 Starting location data migration (Markets & Zip Codes)...\n')
  
  await migrateMarkets()
  await migrateZipCodes()
  
  console.log('✅ Migration complete!')
}

main().catch(console.error)

