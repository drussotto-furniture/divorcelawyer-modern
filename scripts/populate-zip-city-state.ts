/**
 * Populate zip codes with city and state information
 * 
 * This script:
 * 1. Uses a free zip code database to get city/state mappings
 * 2. Creates cities if they don't exist
 * 3. Links zip codes to cities
 * 
 * Usage:
 *   npm run populate:zip-city-state
 * 
 * Data source options:
 * - Simplemaps US Cities Database (free, CSV format)
 * - Or provide your own CSV file with columns: zip_code, city, state
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ZipCityStateRow {
  zip_code: string
  city: string
  state: string
  state_abbr?: string
}

/**
 * Normalize zip code to 5 digits
 */
function normalizeZipCode(zip: string): string {
  return zip.trim().replace(/[^0-9]/g, '').padStart(5, '0').substring(0, 5)
}

/**
 * Generate slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Read CSV file with zip code, city, state data
 */
function readZipCityStateCSV(filePath: string): ZipCityStateRow[] {
  console.log(`📄 Reading CSV file: ${filePath}`)
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())
  
  // Skip header
  const dataLines = lines.slice(1)
  
  const rows: ZipCityStateRow[] = []
  
  // Try to detect header
  const header = lines[0]?.toLowerCase() || ''
  const hasHeader = header.includes('zip') && (header.includes('city') || header.includes('place'))
  
  let startIndex = hasHeader ? 1 : 0
  const dataLinesToProcess = lines.slice(startIndex)
  
  // Detect delimiter (comma or tab)
  const delimiter = header.includes('\t') ? '\t' : ','
  
  for (const line of dataLinesToProcess) {
    const parts = line.split(delimiter).map(p => p.trim().replace(/^"|"$/g, ''))
    
    if (parts.length < 3) continue
    
    // Try to find zip, city, state columns by header or position
    let zipCode = ''
    let city = ''
    let state = ''
    
    if (hasHeader) {
      // Try to match by header names
      const headerParts = header.split(delimiter)
      const zipIdx = headerParts.findIndex(h => h.includes('zip'))
      const cityIdx = headerParts.findIndex(h => h.includes('city') || h.includes('place'))
      const stateIdx = headerParts.findIndex(h => h.includes('state') || h.includes('state_id') || h.includes('state_name'))
      
      if (zipIdx >= 0) zipCode = normalizeZipCode(parts[zipIdx] || '')
      if (cityIdx >= 0) city = parts[cityIdx] || ''
      if (stateIdx >= 0) state = parts[stateIdx] || ''
    } else {
      // Assume first 3 columns are zip, city, state
      zipCode = normalizeZipCode(parts[0] || '')
      city = parts[1] || parts[2] || ''
      state = parts[2] || parts[3] || ''
    }
    
    if (!zipCode || !city || !state) continue
    
    rows.push({
      zip_code: zipCode,
      city: city,
      state: state,
      state_abbr: state.length === 2 ? state.toUpperCase() : undefined,
    })
  }

  console.log(`✅ Parsed ${rows.length} rows from CSV`)
  return rows
}

/**
 * Get or create state
 */
async function getOrCreateState(stateName: string, stateAbbr?: string): Promise<string | null> {
  // First try by abbreviation
  if (stateAbbr) {
    const { data: existingByAbbr } = await supabase
      .from('states')
      .select('id')
      .eq('abbreviation', stateAbbr.toUpperCase())
      .single()

    if (existingByAbbr) {
      return existingByAbbr.id
    }
  }

  // Try by name
  const { data: existingByName } = await supabase
    .from('states')
    .select('id')
    .ilike('name', stateName)
    .single()

  if (existingByName) {
    return existingByName.id
  }

  // Create new state
  const slug = generateSlug(stateName)
  const { data: newState, error } = await supabase
    .from('states')
    .insert({
      name: stateName,
      slug: slug,
      abbreviation: stateAbbr || stateName.substring(0, 2).toUpperCase(),
    })
    .select()
    .single()

  if (error) {
    console.error(`Error creating state ${stateName}:`, error.message)
    return null
  }

  return newState.id
}

/**
 * Get or create city
 */
async function getOrCreateCity(cityName: string, stateId: string): Promise<string | null> {
  // Try to find existing city
  const slug = generateSlug(cityName)
  const { data: existing } = await supabase
    .from('cities')
    .select('id')
    .eq('state_id', stateId)
    .eq('slug', slug)
    .single()

  if (existing) {
    return existing.id
  }

  // Create new city
  const { data: newCity, error } = await supabase
    .from('cities')
    .insert({
      name: cityName,
      slug: slug,
      state_id: stateId,
    })
    .select()
    .single()

  if (error) {
    console.error(`Error creating city ${cityName}:`, error.message)
    return null
  }

  return newCity.id
}

/**
 * Main function to populate zip codes with city/state
 */
async function populateZipCityState() {
  console.log('\n📊 Starting zip code city/state population...\n')

  // Check for CSV file in public folder (try multiple possible names)
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'zip-codes-cities-states.csv'),
    path.join(process.cwd(), 'public', 'us-zip-code-latitude-and-longitude.csv'),
    path.join(process.cwd(), 'public', 'zip-codes.csv'),
    path.join(process.cwd(), 'public', 'zipcodes.csv'),
  ]

  let csvPath: string | null = null
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      csvPath = p
      break
    }
  }
  
  if (!csvPath) {
    console.log('⚠️  CSV file not found. Please download a zip code database and save it as one of:')
    possiblePaths.forEach(p => console.log(`   ${p}`))
    console.log('\nRecommended sources:')
    console.log('  1. Simplemaps (free): https://simplemaps.com/data/us-cities')
    console.log('     - Download "US Cities Database" (Basic, free version)')
    console.log('     - Should have columns: zip, city, state_id (or state_name)')
    console.log('\n  2. Or any CSV with columns: zip_code (or zip), city, state (or state_id)')
    console.log('\nExample format:')
    console.log('  zip,city,state_id')
    console.log('  30301,Atlanta,GA')
    console.log('  30302,Atlanta,GA')
    console.log('\nAfter downloading, place the CSV file in the public/ folder and run this script again.')
    return
  }

  // Read CSV
  console.log(`Using CSV file: ${csvPath}\n`)
  const rows = readZipCityStateCSV(csvPath)
  
  // Get all existing zip codes
  console.log('\n📮 Fetching existing zip codes...')
  const zipCodeIdMap = new Map<string, string>()
  let offset = 0
  const pageSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data: zipCodes, error } = await supabase
      .from('zip_codes')
      .select('id, zip_code')
      .range(offset, offset + pageSize - 1)
      .order('zip_code', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch zip codes: ${error.message}`)
    }

    if (!zipCodes || zipCodes.length === 0) {
      hasMore = false
    } else {
      for (const zc of zipCodes) {
        zipCodeIdMap.set(zc.zip_code, zc.id)
      }

      if (zipCodes.length < pageSize) {
        hasMore = false
      } else {
        offset += pageSize
      }
    }
  }

  console.log(`Found ${zipCodeIdMap.size} existing zip codes\n`)

  // Get all existing states
  console.log('🗺️  Fetching existing states...')
  const { data: states } = await supabase
    .from('states')
    .select('id, name, abbreviation')

  const stateMap = new Map<string, string>()
  if (states) {
    for (const state of states) {
      stateMap.set(state.name.toUpperCase(), state.id)
      if (state.abbreviation) {
        stateMap.set(state.abbreviation.toUpperCase(), state.id)
      }
    }
  }

  console.log(`Found ${stateMap.size} state mappings\n`)

  // Process rows
  console.log('🔗 Processing zip code to city/state mappings...\n')
  
  let updated = 0
  let created = 0
  let skipped = 0
  let errors = 0

  // Group by city+state to batch create cities
  const cityStateMap = new Map<string, { city: string; state: string; stateAbbr?: string }>()
  for (const row of rows) {
    const key = `${row.city}|${row.state}`
    if (!cityStateMap.has(key)) {
      cityStateMap.set(key, {
        city: row.city,
        state: row.state,
        stateAbbr: row.state_abbr,
      })
    }
  }

  // Create/get all cities first
  console.log(`Creating/getting ${cityStateMap.size} cities...`)
  const cityMap = new Map<string, string>() // "city|state" -> city_id

  for (const [key, data] of cityStateMap.entries()) {
    // Get or create state
    let stateId = stateMap.get(data.state.toUpperCase())
    if (!stateId && data.stateAbbr) {
      stateId = stateMap.get(data.stateAbbr.toUpperCase())
    }
    if (!stateId) {
      stateId = await getOrCreateState(data.state, data.stateAbbr)
      if (stateId) {
        stateMap.set(data.state.toUpperCase(), stateId)
        if (data.stateAbbr) {
          stateMap.set(data.stateAbbr.toUpperCase(), stateId)
        }
      }
    }

    if (!stateId) {
      console.error(`Could not get/create state: ${data.state}`)
      continue
    }

    // Get or create city
    const cityId = await getOrCreateCity(data.city, stateId)
    if (cityId) {
      cityMap.set(key, cityId)
    }

    if ((cityMap.size % 100 === 0)) {
      console.log(`   Processed ${cityMap.size}/${cityStateMap.size} cities...`)
    }
  }

  console.log(`✅ Created/found ${cityMap.size} cities\n`)

  // Now update zip codes
  console.log('📝 Updating zip codes with city links...\n')
  
  const batchSize = 100
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    
    for (const row of batch) {
      const zipCodeId = zipCodeIdMap.get(row.zip_code)
      if (!zipCodeId) {
        skipped++
        continue
      }

      const cityKey = `${row.city}|${row.state}`
      const cityId = cityMap.get(cityKey)
      
      if (!cityId) {
        skipped++
        continue
      }

      // Update zip code
      const { error } = await supabase
        .from('zip_codes')
        .update({ city_id: cityId })
        .eq('id', zipCodeId)

      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          // Already updated, skip
          skipped++
        } else {
          errors++
          if (errors <= 5) {
            console.error(`Error updating zip ${row.zip_code}:`, error.message)
          }
        }
      } else {
        updated++
      }
    }

    if ((i + batchSize) % 1000 === 0 || i + batchSize >= rows.length) {
      console.log(`   Processed ${Math.min(i + batchSize, rows.length)}/${rows.length} zip codes... (${updated} updated)`)
    }
  }

  console.log(`\n✅ Population complete!`)
  console.log(`   Zip codes updated: ${updated}`)
  console.log(`   Zip codes skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)
}

populateZipCityState().catch(console.error)

