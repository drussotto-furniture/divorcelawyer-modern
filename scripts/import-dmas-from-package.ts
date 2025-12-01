/**
 * Import DMAs using zip_to_dma npm package
 * 
 * This script:
 * 1. Gets all zip codes from the database
 * 2. Uses zip_to_dma package to get DMA codes
 * 3. Creates/updates DMAs (with placeholder names if needed)
 * 4. Creates zip_code_dmas mappings
 * 5. Provides backup functionality before clearing
 * 
 * Usage:
 *   npm run import:dmas:package
 * 
 * To backup before clearing:
 *   npm run backup:dmas
 * 
 * To clear and reimport:
 *   npm run clear:dmas
 *   npm run import:dmas:package
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

// Import zip_to_dma package
let zipToDma: (zip: string) => number
try {
  // The package exports from dist/zip_to_dma.js
  const zipToDmaModule = require(path.join(process.cwd(), 'node_modules', 'zip_to_dma', 'dist', 'zip_to_dma.js'))
  
  // The module exports a function directly
  if (typeof zipToDmaModule === 'function') {
    zipToDma = zipToDmaModule
  } else if (zipToDmaModule.default && typeof zipToDmaModule.default === 'function') {
    zipToDma = zipToDmaModule.default
  } else {
    throw new Error('Could not find zip_to_dma function')
  }
  
  // Test it works
  const testResult = zipToDma('10001')
  if (typeof testResult !== 'number') {
    throw new Error('zip_to_dma function did not return a number')
  }
} catch (error: any) {
  console.error('❌ Error loading zip_to_dma package:', error.message)
  console.error('   Make sure you ran: npm install zip_to_dma')
  process.exit(1)
}

/**
 * Generate slug from DMA name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Get DMA name from code (placeholder if not found)
 * In the future, we can add a lookup table for proper names
 */
function getDMAName(code: number): string {
  // For now, use placeholder. You can add a lookup table here later
  return `DMA ${code}`
}

/**
 * Backup current DMA data
 */
async function backupDMAs(): Promise<string> {
  console.log('📦 Backing up current DMA data...\n')

  // Get all DMAs
  const { data: dmas, error: dmasError } = await supabase
    .from('dmas')
    .select('*')

  if (dmasError) {
    throw new Error(`Failed to fetch DMAs: ${dmasError.message}`)
  }

  // Get all zip code mappings
  const { data: mappings, error: mappingsError } = await supabase
    .from('zip_code_dmas')
    .select('*, zip_codes(zip_code), dmas(code, name)')

  if (mappingsError) {
    throw new Error(`Failed to fetch mappings: ${mappingsError.message}`)
  }

  const backup = {
    timestamp: new Date().toISOString(),
    dmas: dmas || [],
    mappings: mappings || [],
  }

  const backupDir = path.join(process.cwd(), 'data', 'backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(backupDir, `dma-backup-${timestamp}.json`)

  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2))

  console.log(`✅ Backup saved to: ${backupFile}`)
  console.log(`   DMAs: ${dmas?.length || 0}`)
  console.log(`   Mappings: ${mappings?.length || 0}\n`)

  return backupFile
}

/**
 * Clear current DMA data
 */
async function clearDMAs(): Promise<void> {
  console.log('🗑️  Clearing current DMA data...\n')

  // Delete mappings first (foreign key constraint)
  const { error: mappingsError } = await supabase
    .from('zip_code_dmas')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (mappingsError) {
    throw new Error(`Failed to delete mappings: ${mappingsError.message}`)
  }

  console.log('✅ Deleted zip code mappings')

  // Delete DMAs
  const { error: dmasError } = await supabase
    .from('dmas')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (dmasError) {
    throw new Error(`Failed to delete DMAs: ${dmasError.message}`)
  }

  console.log('✅ Deleted DMAs\n')
}

/**
 * Import DMAs from zip codes
 */
async function importDMAsFromPackage() {
  console.log('📊 Starting DMA import from zip_to_dma package...\n')

  // Get all zip codes
  console.log('📮 Fetching zip codes from database...')
  const { data: zipCodes, error: zipError } = await supabase
    .from('zip_codes')
    .select('id, zip_code')
    .order('zip_code', { ascending: true })

  if (zipError) {
    throw new Error(`Failed to fetch zip codes: ${zipError.message}`)
  }

  if (!zipCodes || zipCodes.length === 0) {
    throw new Error('No zip codes found in database')
  }

  console.log(`✅ Found ${zipCodes.length} zip codes\n`)

  // Process zip codes and get DMA codes
  console.log('🔍 Processing zip codes to get DMA codes...')
  const dmaMap = new Map<number, { name: string; zipCodes: string[] }>()
  let processed = 0
  let errors = 0

  for (const zipCode of zipCodes) {
    processed++
    if (processed % 1000 === 0) {
      console.log(`   Processed ${processed}/${zipCodes.length}...`)
    }

    try {
      const dmaCode = zipToDma(zipCode.zip_code)
      
      if (!dmaMap.has(dmaCode)) {
        dmaMap.set(dmaCode, {
          name: getDMAName(dmaCode),
          zipCodes: [],
        })
      }
      dmaMap.get(dmaCode)!.zipCodes.push(zipCode.zip_code)
    } catch (error: any) {
      errors++
      if (errors <= 10) {
        console.warn(`   ⚠️  Skipping zip ${zipCode.zip_code}: ${error.message}`)
      }
    }
  }

  console.log(`✅ Processed ${processed} zip codes (${errors} errors)`)
  console.log(`   Found ${dmaMap.size} unique DMAs\n`)

  // Create or update DMAs
  console.log('📦 Creating/updating DMAs...')
  let dmasCreated = 0
  let dmasUpdated = 0
  const dmaIdMap = new Map<number, string>()

  for (const [code, data] of dmaMap.entries()) {
    const slug = generateSlug(data.name)
    
    // Check if DMA exists
    const { data: existing } = await supabase
      .from('dmas')
      .select('id')
      .eq('code', code)
      .single()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('dmas')
        .update({
          name: data.name,
          slug,
        })
        .eq('id', existing.id)

      if (error) {
        console.error(`❌ Error updating DMA ${code}:`, error.message)
        continue
      }

      dmaIdMap.set(code, existing.id)
      dmasUpdated++
    } else {
      // Create new
      const { data: newDma, error } = await supabase
        .from('dmas')
        .insert({
          code,
          name: data.name,
          slug,
        })
        .select()
        .single()

      if (error) {
        console.error(`❌ Error creating DMA ${code}:`, error.message)
        continue
      }

      dmaIdMap.set(code, newDma.id)
      dmasCreated++
    }
  }

  console.log(`✅ DMAs: ${dmasCreated} created, ${dmasUpdated} updated\n`)

  // Create zip code mappings
  console.log('🔗 Creating zip code mappings...')
  
  let mappingsCreated = 0
  let mappingsUpdated = 0
  let mappingsSkipped = 0

  for (const zipCode of zipCodes) {
    try {
      const dmaCode = zipToDma(zipCode.zip_code)
      const dmaId = dmaIdMap.get(dmaCode)
      
      if (!dmaId) {
        mappingsSkipped++
        continue
      }

      // Check if mapping exists
      const { data: existingMapping } = await supabase
        .from('zip_code_dmas')
        .select('id')
        .eq('zip_code_id', zipCode.id)
        .single()

      if (existingMapping) {
        // Update existing mapping
        const { error } = await supabase
          .from('zip_code_dmas')
          .update({ dma_id: dmaId })
          .eq('id', existingMapping.id)

        if (error) {
          console.error(`❌ Error updating mapping for zip ${zipCode.zip_code}:`, error.message)
          mappingsSkipped++
          continue
        }

        mappingsUpdated++
      } else {
        // Create new mapping
        const { error } = await supabase
          .from('zip_code_dmas')
          .insert({
            zip_code_id: zipCode.id,
            dma_id: dmaId,
          })

        if (error) {
          console.error(`❌ Error creating mapping for zip ${zipCode.zip_code}:`, error.message)
          mappingsSkipped++
          continue
        }

        mappingsCreated++
      }
    } catch (error: any) {
      mappingsSkipped++
    }
  }

  console.log(`\n✅ Import complete!`)
  console.log(`   Mappings: ${mappingsCreated} created, ${mappingsUpdated} updated, ${mappingsSkipped} skipped\n`)
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2]

  try {
    if (command === 'backup') {
      await backupDMAs()
    } else if (command === 'clear') {
      // Backup first
      await backupDMAs()
      await clearDMAs()
    } else {
      // Default: import
      await importDMAsFromPackage()
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()

