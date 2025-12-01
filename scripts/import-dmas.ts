/**
 * Import DMAs and Zip Code to DMA mappings
 * 
 * This script can import DMA data from:
 * 1. A CSV file (if provided)
 * 2. Harvard Dataverse API (if API token provided)
 * 
 * Usage:
 *   npm run import:dmas
 * 
 * Environment variables:
 *   DATAVERSE_API_TOKEN - Optional: Harvard Dataverse API token
 *   DMA_CSV_PATH - Optional: Path to CSV file with columns: zip_code, dma_code, dma_name
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

interface DMARow {
  zip_code: string
  dma_code: number
  dma_name: string
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
 * Normalize zip code (pad with zeros if needed)
 */
function normalizeZipCode(zip: string): string {
  const cleaned = zip.trim().replace(/[^0-9]/g, '')
  return cleaned.padStart(5, '0')
}

/**
 * Import from CSV file
 */
async function importFromCSV(filePath: string): Promise<DMARow[]> {
  console.log(`📄 Reading CSV file: ${filePath}`)
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())
  
  // Skip header if present
  const header = lines[0].toLowerCase()
  const hasHeader = header.includes('zip') && (header.includes('dma') || header.includes('code'))
  const dataLines = hasHeader ? lines.slice(1) : lines

  const rows: DMARow[] = []
  
  for (const line of dataLines) {
    const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''))
    
    if (parts.length < 3) continue
    
    const zipCode = normalizeZipCode(parts[0])
    const dmaCode = parseInt(parts[1])
    const dmaName = parts[2] || parts.slice(2).join(' ')

    if (!zipCode || isNaN(dmaCode) || !dmaName) {
      console.warn(`⚠️  Skipping invalid row: ${line}`)
      continue
    }

    rows.push({
      zip_code: zipCode,
      dma_code: dmaCode,
      dma_name: dmaName,
    })
  }

  console.log(`✅ Parsed ${rows.length} rows from CSV`)
  return rows
}

/**
 * Try to fetch from Harvard Dataverse
 * Note: This is a placeholder - you'll need to implement based on actual Dataverse API
 */
async function fetchFromDataverse(): Promise<DMARow[]> {
  const apiToken = process.env.DATAVERSE_API_TOKEN
  
  if (!apiToken) {
    throw new Error('DATAVERSE_API_TOKEN not provided. Cannot fetch from Dataverse.')
  }

  console.log('🌐 Attempting to fetch from Harvard Dataverse...')
  console.log('⚠️  Note: Dataverse API integration needs to be implemented based on actual API structure')
  console.log('   For now, please provide a CSV file with the following format:')
  console.log('   zip_code,dma_code,dma_name')
  console.log('   32180,534,ORLANDO-DAYTONA BEACH-MELBOURNE')
  
  throw new Error('Dataverse API integration not yet implemented. Please use CSV import.')
}

/**
 * Import DMAs and mappings
 */
async function importDMAs(rows: DMARow[]) {
  console.log('\n📊 Starting DMA import...\n')

  // Group by DMA
  const dmaMap = new Map<number, { name: string; zipCodes: string[] }>()
  
  for (const row of rows) {
    if (!dmaMap.has(row.dma_code)) {
      dmaMap.set(row.dma_code, {
        name: row.dma_name,
        zipCodes: [],
      })
    }
    dmaMap.get(row.dma_code)!.zipCodes.push(row.zip_code)
  }

  console.log(`Found ${dmaMap.size} unique DMAs`)
  console.log(`Total zip code mappings: ${rows.length}\n`)

  // Create or update DMAs
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
      console.log(`✅ Updated DMA ${code}: ${data.name}`)
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
      console.log(`✅ Created DMA ${code}: ${data.name}`)
    }
  }

  console.log(`\n📦 DMAs: ${dmasCreated} created, ${dmasUpdated} updated\n`)

  // Create zip code mappings
  console.log('🔗 Creating zip code mappings...\n')
  
  let mappingsCreated = 0
  let mappingsUpdated = 0
  let mappingsSkipped = 0

  for (const row of rows) {
    const dmaId = dmaIdMap.get(row.dma_code)
    if (!dmaId) {
      mappingsSkipped++
      continue
    }

    // Find zip code ID
    const { data: zipCode } = await supabase
      .from('zip_codes')
      .select('id')
      .eq('zip_code', row.zip_code)
      .single()

    if (!zipCode) {
      console.warn(`⚠️  Zip code ${row.zip_code} not found in database, skipping`)
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
        console.error(`❌ Error updating mapping for zip ${row.zip_code}:`, error.message)
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
        console.error(`❌ Error creating mapping for zip ${row.zip_code}:`, error.message)
        mappingsSkipped++
        continue
      }

      mappingsCreated++
    }
  }

  console.log(`\n✅ Import complete!`)
  console.log(`   Mappings: ${mappingsCreated} created, ${mappingsUpdated} updated, ${mappingsSkipped} skipped\n`)
}

/**
 * Main function
 */
async function main() {
  try {
    let rows: DMARow[] = []

    // Try CSV file first
    const csvPath = process.env.DMA_CSV_PATH || path.join(process.cwd(), 'data', 'dma-mappings.csv')
    
    if (fs.existsSync(csvPath)) {
      rows = await importFromCSV(csvPath)
    } else {
      // Try Dataverse
      try {
        rows = await fetchFromDataverse()
      } catch (err: any) {
        console.error(`\n❌ ${err.message}\n`)
        console.log('💡 To import from CSV:')
        console.log('   1. Create a CSV file with columns: zip_code,dma_code,dma_name')
        console.log('   2. Place it at: data/dma-mappings.csv')
        console.log('   3. Or set DMA_CSV_PATH environment variable')
        console.log('   4. Run: npm run import:dmas\n')
        process.exit(1)
      }
    }

    if (rows.length === 0) {
      console.error('❌ No data to import')
      process.exit(1)
    }

    await importDMAs(rows)
  } catch (error: any) {
    console.error('❌ Import failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()



