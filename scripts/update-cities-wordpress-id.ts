/**
 * Update Cities with WordPress ID
 * This script updates existing cities with their wordpress_id from the JSON file
 * so that zip codes can be properly linked to cities
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

interface CityItem {
  post_id: string
  title: string
  post_name: string
  meta: Record<string, any>
}

async function updateCitiesWithWordPressId() {
  console.log('🔄 Updating cities with WordPress ID...\n')

  // Load cities from JSON
  const citiesJSON = await fs.readFile(
    path.join(process.cwd(), 'output', 'cities.json'),
    'utf-8'
  )
  const citiesData: CityItem[] = JSON.parse(citiesJSON)

  console.log(`Found ${citiesData.length} cities in JSON file\n`)

  let updated = 0
  let notFound = 0
  let alreadyHasId = 0

  for (const city of citiesData) {
    try {
      // Find city by slug (most reliable match)
      const { data: existingCity } = await supabase
        .from('cities')
        .select('id, wordpress_id, name, slug')
        .eq('slug', city.post_name)
        .single()

      if (!existingCity) {
        notFound++
        continue
      }

      // Skip if already has wordpress_id
      if (existingCity.wordpress_id) {
        alreadyHasId++
        continue
      }

      // Update with wordpress_id
      const { error } = await supabase
        .from('cities')
        .update({ wordpress_id: parseInt(city.post_id) })
        .eq('id', existingCity.id)

      if (error) {
        console.error(`  ❌ Error updating ${city.title}:`, error.message)
      } else {
        updated++
        if (updated % 10 === 0) {
          console.log(`  Updated ${updated} cities...`)
        }
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${city.title}:`, error)
    }
  }

  console.log(`\n✓ Cities update complete:`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Already had ID: ${alreadyHasId}`)
  console.log(`   Not found: ${notFound}`)
}

updateCitiesWithWordPressId().catch(console.error)



