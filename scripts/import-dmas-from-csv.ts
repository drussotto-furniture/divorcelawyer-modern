/**
 * Import DMA data from CSV file
 * 
 * This script:
 * 1. Reads the CSV file from public folder
 * 2. Creates/updates DMAs from dma_code and dma_description
 * 3. Maps zip codes to DMAs using existing zip_codes table
 * 4. Creates zip_code_dmas relationships
 * 5. Logs duplicates, new zip codes, and DMA name conflicts
 * 
 * Usage:
 *   npm run import:dmas:csv
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

interface CSVRow {
  zip_code: string
  dma_code: number
  dma_description: string
}

interface ImportIssues {
  duplicateZipCodes: Map<string, Array<{ dma_code: number; dma_description: string; row: number }>>
  inconsistentDMANames: Map<number, Array<{ description: string; row: number }>>
  newZipCodesCreated: string[]
  errors: Array<{ type: string; message: string; row?: number }>
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
 * Read and parse CSV file
 */
function readCSV(filePath: string): CSVRow[] {
  console.log(`📄 Reading CSV file: ${filePath}`)
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())
  
  // Skip header
  const dataLines = lines.slice(1)
  
  const rows: CSVRow[] = []
  
  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i]
    // Handle tab-delimited format
    const parts = line.split('\t').map(p => p.trim())
    
    if (parts.length < 3) continue
    
    const zipCode = normalizeZipCode(parts[0])
    const dmaCode = parseInt(parts[1])
    const dmaDescription = parts[2] || parts.slice(2).join(' ')

    if (!zipCode || isNaN(dmaCode) || !dmaDescription) {
      continue
    }

    rows.push({
      zip_code: zipCode,
      dma_code: dmaCode,
      dma_description: dmaDescription,
    })
  }

  console.log(`✅ Parsed ${rows.length} rows from CSV`)
  return rows
}

/**
 * Write issues report to file
 */
function writeIssuesReport(issues: ImportIssues, outputPath: string) {
  const report: any = {
    timestamp: new Date().toISOString(),
    summary: {
      duplicateZipCodes: issues.duplicateZipCodes.size,
      inconsistentDMANames: issues.inconsistentDMANames.size,
      newZipCodesCreated: issues.newZipCodesCreated.length,
      errors: issues.errors.length,
    },
    duplicateZipCodes: Array.from(issues.duplicateZipCodes.entries()).map(([zip, entries]) => ({
      zip_code: zip,
      occurrences: entries.length,
      entries: entries,
    })),
    inconsistentDMANames: Array.from(issues.inconsistentDMANames.entries()).map(([code, entries]) => ({
      dma_code: code,
      occurrences: entries.length,
      entries: entries,
    })),
    newZipCodesCreated: issues.newZipCodesCreated,
    errors: issues.errors,
  }

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
  console.log(`\n📋 Issues report saved to: ${outputPath}`)
}

/**
 * Import DMAs and mappings
 */
async function importDMAs(rows: CSVRow[]) {
  console.log('\n📊 Starting DMA import...\n')

  const issues: ImportIssues = {
    duplicateZipCodes: new Map(),
    inconsistentDMANames: new Map(),
    newZipCodesCreated: [],
    errors: [],
  }

  // Track zip code occurrences (for duplicate detection)
  const zipCodeOccurrences = new Map<string, Array<{ dma_code: number; dma_description: string; row: number }>>()
  
  // Track DMA name consistency (first one wins, log others)
  const dmaNames = new Map<number, { name: string; firstSeenRow: number }>()

  // First pass: identify duplicates and DMA name conflicts
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    
    // Track zip code occurrences
    if (!zipCodeOccurrences.has(row.zip_code)) {
      zipCodeOccurrences.set(row.zip_code, [])
    }
    zipCodeOccurrences.get(row.zip_code)!.push({
      dma_code: row.dma_code,
      dma_description: row.dma_description,
      row: i + 2, // +2 because we skip header and 0-indexed
    })

    // Track DMA name consistency
    if (!dmaNames.has(row.dma_code)) {
      dmaNames.set(row.dma_code, {
        name: row.dma_description,
        firstSeenRow: i + 2,
      })
    } else {
      const existing = dmaNames.get(row.dma_code)!
      if (existing.name !== row.dma_description) {
        // Different name for same DMA code - log it
        if (!issues.inconsistentDMANames.has(row.dma_code)) {
          issues.inconsistentDMANames.set(row.dma_code, [
            { description: existing.name, row: existing.firstSeenRow },
          ])
        }
        issues.inconsistentDMANames.get(row.dma_code)!.push({
          description: row.dma_description,
          row: i + 2,
        })
      }
    }
  }

  // Identify duplicate zip codes (appearing with different DMAs)
  for (const [zip, occurrences] of zipCodeOccurrences.entries()) {
    // Check if zip code appears with different DMA codes
    const uniqueDMAs = new Set(occurrences.map(o => o.dma_code))
    if (uniqueDMAs.size > 1) {
      issues.duplicateZipCodes.set(zip, occurrences)
    }
  }

  // Group by DMA (using first name seen)
  const dmaMap = new Map<number, { name: string; zipCodes: string[] }>()
  
  // Process rows in reverse to use last occurrence of duplicate zip codes
  const processedZips = new Set<string>()
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i]
    
    // For duplicate zip codes, use the last one (process in reverse)
    if (processedZips.has(row.zip_code)) {
      continue
    }
    processedZips.add(row.zip_code)

    // Use first DMA name seen (already tracked in dmaNames)
    const dmaName = dmaNames.get(row.dma_code)!.name
    
    if (!dmaMap.has(row.dma_code)) {
      dmaMap.set(row.dma_code, {
        name: dmaName,
        zipCodes: [],
      })
    }
    dmaMap.get(row.dma_code)!.zipCodes.push(row.zip_code)
  }

  console.log(`Found ${dmaMap.size} unique DMAs`)
  console.log(`Total zip code mappings: ${processedZips.size}`)
  if (issues.duplicateZipCodes.size > 0) {
    console.log(`⚠️  Found ${issues.duplicateZipCodes.size} zip codes with duplicate DMA assignments`)
  }
  if (issues.inconsistentDMANames.size > 0) {
    console.log(`⚠️  Found ${issues.inconsistentDMANames.size} DMAs with inconsistent names`)
  }
  console.log()

  // Create or update DMAs (batch processing for performance)
  let dmasCreated = 0
  let dmasUpdated = 0
  const dmaIdMap = new Map<number, string>()

  const dmaEntries = Array.from(dmaMap.entries())
  const batchSize = 50

  for (let i = 0; i < dmaEntries.length; i += batchSize) {
    const batch = dmaEntries.slice(i, i + batchSize)
    
    for (const [code, data] of batch) {
      const slug = generateSlug(data.name)
      
      // Check if DMA exists
      const { data: existing, error: checkError } = await supabase
        .from('dmas')
        .select('id')
        .eq('code', code)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        issues.errors.push({
          type: 'DMA_CHECK_ERROR',
          message: `Error checking DMA ${code}: ${checkError.message}`,
        })
        continue
      }

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
          issues.errors.push({
            type: 'DMA_UPDATE_ERROR',
            message: `Error updating DMA ${code}: ${error.message}`,
          })
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
          issues.errors.push({
            type: 'DMA_CREATE_ERROR',
            message: `Error creating DMA ${code}: ${error.message}`,
          })
          continue
        }

        dmaIdMap.set(code, newDma.id)
        dmasCreated++
      }
    }

    if ((i + batchSize) % 100 === 0 || i + batchSize >= dmaEntries.length) {
      console.log(`   Processed ${Math.min(i + batchSize, dmaEntries.length)}/${dmaEntries.length} DMAs...`)
    }
  }

  console.log(`✅ DMAs: ${dmasCreated} created, ${dmasUpdated} updated\n`)

  // Get all existing zip codes in a map for quick lookup using pagination
  console.log('📮 Fetching existing zip codes...')
  const zipCodeIdMap = new Map<string, string>()
  const pageSize = 1000
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data: existingZipCodes, error: zipFetchError } = await supabase
      .from('zip_codes')
      .select('id, zip_code')
      .range(offset, offset + pageSize - 1)
      .order('zip_code', { ascending: true })

    if (zipFetchError) {
      throw new Error(`Failed to fetch zip codes: ${zipFetchError.message}`)
    }

    if (!existingZipCodes || existingZipCodes.length === 0) {
      hasMore = false
    } else {
      for (const zc of existingZipCodes) {
        zipCodeIdMap.set(zc.zip_code, zc.id)
      }
      
      if (existingZipCodes.length < pageSize) {
        hasMore = false
      } else {
        offset += pageSize
        if (zipCodeIdMap.size % 5000 === 0) {
          console.log(`   Fetched ${zipCodeIdMap.size} zip codes so far...`)
        }
      }
    }
  }

  console.log(`Found ${zipCodeIdMap.size} existing zip codes in database\n`)

  // Create zip code mappings (batch processing)
  console.log('🔗 Creating zip code mappings...')
  
  let mappingsCreated = 0
  let mappingsUpdated = 0
  let mappingsSkipped = 0

  // Process in reverse to use last occurrence of duplicates
  const zipCodeToDMA = new Map<string, { dma_code: number; dma_id: string }>()
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i]
    // Use last occurrence (process in reverse)
    if (!zipCodeToDMA.has(row.zip_code)) {
      const dmaId = dmaIdMap.get(row.dma_code)
      if (dmaId) {
        zipCodeToDMA.set(row.zip_code, {
          dma_code: row.dma_code,
          dma_id: dmaId,
        })
      }
    }
  }

  // First, create any missing zip codes in batch
  console.log('📦 Creating missing zip codes...')
  const missingZipCodes = Array.from(zipCodeToDMA.keys()).filter(zip => !zipCodeIdMap.has(zip))
  
  if (missingZipCodes.length > 0) {
    const zipCodeBatchSize = 500
    for (let i = 0; i < missingZipCodes.length; i += zipCodeBatchSize) {
      const batch = missingZipCodes.slice(i, i + zipCodeBatchSize)
      const zipCodesToInsert = batch.map(zip => ({ zip_code: zip }))
      
      const { data: newZipCodes, error } = await supabase
        .from('zip_codes')
        .insert(zipCodesToInsert)
        .select('id, zip_code')

      if (error) {
        // Some may already exist, fetch them individually
        for (const zip of batch) {
          const { data: existingZipCode } = await supabase
            .from('zip_codes')
            .select('id')
            .eq('zip_code', zip)
            .single()

          if (existingZipCode) {
            zipCodeIdMap.set(zip, existingZipCode.id)
          } else {
            issues.errors.push({
              type: 'ZIP_CREATE_ERROR',
              message: `Failed to create or find zip code ${zip}`,
            })
          }
        }
      } else if (newZipCodes) {
        for (const zc of newZipCodes) {
          zipCodeIdMap.set(zc.zip_code, zc.id)
          issues.newZipCodesCreated.push(zc.zip_code)
        }
      }
    }
    console.log(`   Created/found ${missingZipCodes.length} zip codes\n`)
  }

  // Fetch all existing mappings in batch
  console.log('🔍 Fetching existing mappings...')
  const existingMappingsMap = new Map<string, string>() // zip_code_id -> mapping_id
  let mappingOffset = 0
  const mappingPageSize = 1000
  let hasMoreMappings = true

  while (hasMoreMappings) {
    const { data: existingMappings, error: mappingFetchError } = await supabase
      .from('zip_code_dmas')
      .select('id, zip_code_id')
      .range(mappingOffset, mappingOffset + mappingPageSize - 1)

    if (mappingFetchError) {
      console.warn(`Warning fetching mappings: ${mappingFetchError.message}`)
      break
    }

    if (!existingMappings || existingMappings.length === 0) {
      hasMoreMappings = false
    } else {
      for (const mapping of existingMappings) {
        existingMappingsMap.set(mapping.zip_code_id, mapping.id)
      }

      if (existingMappings.length < mappingPageSize) {
        hasMoreMappings = false
      } else {
        mappingOffset += mappingPageSize
      }
    }
  }

  console.log(`   Found ${existingMappingsMap.size} existing mappings\n`)

  // Process mappings in batches
  const zipCodeEntries = Array.from(zipCodeToDMA.entries())
  const mappingBatchSize = 500

  for (let i = 0; i < zipCodeEntries.length; i += mappingBatchSize) {
    const batch = zipCodeEntries.slice(i, i + mappingBatchSize)
    
    const toInsert: Array<{ zip_code_id: string; dma_id: string }> = []
    const toUpdate: Array<{ id: string; dma_id: string }> = []
    const zipCodeIdsToCheck: string[] = []

    for (const [zipCode, dmaInfo] of batch) {
      const zipCodeId = zipCodeIdMap.get(zipCode)
      if (!zipCodeId) {
        mappingsSkipped++
        continue
      }

      const existingMappingId = existingMappingsMap.get(zipCodeId)
      if (existingMappingId) {
        toUpdate.push({ id: existingMappingId, dma_id: dmaInfo.dma_id })
      } else {
        toInsert.push({ zip_code_id: zipCodeId, dma_id: dmaInfo.dma_id })
      }
    }

    // Batch insert new mappings
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('zip_code_dmas')
        .insert(toInsert)

      if (insertError) {
        // Fallback to individual inserts if batch fails
        for (const item of toInsert) {
          const { error } = await supabase
            .from('zip_code_dmas')
            .insert(item)

          if (error) {
            issues.errors.push({
              type: 'MAPPING_CREATE_ERROR',
              message: `Error creating mapping: ${error.message}`,
            })
            mappingsSkipped++
          } else {
            mappingsCreated++
          }
        }
      } else {
        mappingsCreated += toInsert.length
      }
    }

    // Batch update existing mappings
    if (toUpdate.length > 0) {
      // Supabase doesn't support batch updates, so we'll do them individually but in parallel
      const updatePromises = toUpdate.map(async (item) => {
        const { error } = await supabase
          .from('zip_code_dmas')
          .update({ dma_id: item.dma_id })
          .eq('id', item.id)

        if (error) {
          issues.errors.push({
            type: 'MAPPING_UPDATE_ERROR',
            message: `Error updating mapping ${item.id}: ${error.message}`,
          })
          return false
        }
        return true
      })

      const results = await Promise.all(updatePromises)
      mappingsUpdated += results.filter(r => r).length
      mappingsSkipped += results.filter(r => !r).length
    }

    if ((i + mappingBatchSize) % 5000 === 0 || i + mappingBatchSize >= zipCodeEntries.length) {
      console.log(`   Processed ${Math.min(i + mappingBatchSize, zipCodeEntries.length)}/${zipCodeEntries.length} mappings... (${mappingsCreated} created, ${mappingsUpdated} updated)`)
    }
  }

  console.log(`\n✅ Import complete!`)
  console.log(`   Zip codes created: ${issues.newZipCodesCreated.length}`)
  console.log(`   Mappings: ${mappingsCreated} created, ${mappingsUpdated} updated, ${mappingsSkipped} skipped`)

  // Write issues report
  const reportDir = path.join(process.cwd(), 'data', 'reports')
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportPath = path.join(reportDir, `dma-import-issues-${timestamp}.json`)
  writeIssuesReport(issues, reportPath)

  // Print summary
  if (issues.duplicateZipCodes.size > 0 || issues.inconsistentDMANames.size > 0 || issues.newZipCodesCreated.length > 0) {
    console.log(`\n📋 Review the issues report for details:`)
    console.log(`   ${reportPath}`)
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const csvPath = path.join(process.cwd(), 'public', 'Zip Codes to DMAs')
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ File not found: ${csvPath}`)
      process.exit(1)
    }

    const rows = readCSV(csvPath)
    
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

