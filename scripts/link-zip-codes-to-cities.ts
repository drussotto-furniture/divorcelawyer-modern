/**
 * Link Zip Codes to Cities
 * This script updates existing zip codes to link them to cities using wordpress_id
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

interface ZipCodeItem {
  post_id: string
  title: string
  meta: Record<string, any>
}

async function linkZipCodesToCities() {
  console.log('🔗 Linking zip codes to cities...\n')

  // Get city mapping by WordPress ID
  const { data: cities } = await supabase
    .from('cities')
    .select('id, wordpress_id')
  
  const cityMap = new Map<number, string>()
  if (cities) {
    for (const city of cities) {
      if (city.wordpress_id) {
        cityMap.set(parseInt(city.wordpress_id.toString()), city.id)
      }
    }
  }

  console.log(`Mapped ${cityMap.size} cities by WordPress ID\n`)

  if (cityMap.size === 0) {
    console.log('⚠️  No cities with wordpress_id found. Run update-cities-wordpress-id.ts first.')
    return
  }

  // Load zip codes from JSON
  const zipCodesJSON = await fs.readFile(
    path.join(process.cwd(), 'output', 'zip_codes.json'),
    'utf-8'
  )
  const zipCodesData: ZipCodeItem[] = JSON.parse(zipCodesJSON)

  console.log(`Found ${zipCodesData.length} zip codes in JSON file\n`)

  // Get all zip codes from database
  const { data: zipCodes } = await supabase
    .from('zip_codes')
    .select('id, zip_code, wordpress_id, city_id')

  if (!zipCodes) {
    console.log('⚠️  No zip codes found in database')
    return
  }

  console.log(`Found ${zipCodes.length} zip codes in database\n`)

  // Create a map of wordpress_id to zip code record
  const zipCodeMap = new Map<number, typeof zipCodes[0]>()
  for (const zip of zipCodes) {
    if (zip.wordpress_id) {
      zipCodeMap.set(parseInt(zip.wordpress_id.toString()), zip)
    }
  }

  let updated = 0
  let alreadyLinked = 0
  let noCityMatch = 0
  let notFound = 0

  for (const zipItem of zipCodesData) {
    try {
      const zipWordPressId = parseInt(zipItem.post_id)
      const zipRecord = zipCodeMap.get(zipWordPressId)

      if (!zipRecord) {
        notFound++
        continue
      }

      // Skip if already linked
      if (zipRecord.city_id) {
        alreadyLinked++
        continue
      }

      // Get city WordPress ID from meta
      const cityWordPressId = zipItem.meta?.['_zip_code_city'] 
        ? parseInt(zipItem.meta['_zip_code_city'] as string)
        : null

      if (!cityWordPressId) {
        noCityMatch++
        continue
      }

      const cityId = cityMap.get(cityWordPressId)
      if (!cityId) {
        noCityMatch++
        continue
      }

      // Update zip code with city link
      const { error } = await supabase
        .from('zip_codes')
        .update({ city_id: cityId })
        .eq('id', zipRecord.id)

      if (error) {
        console.error(`  ❌ Error updating zip code ${zipItem.title}:`, error.message)
      } else {
        updated++
        if (updated % 1000 === 0) {
          console.log(`  Linked ${updated} zip codes...`)
        }
      }
    } catch (error) {
      console.error(`  ❌ Error processing zip code ${zipItem.title}:`, error)
    }
  }

  console.log(`\n✓ Zip code linking complete:`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Already linked: ${alreadyLinked}`)
  console.log(`   No city match: ${noCityMatch}`)
  console.log(`   Not found in DB: ${notFound}`)
}

linkZipCodesToCities().catch(console.error)

