/**
 * Fetch DMA data directly from Harvard Dataverse API
 * 
 * This script fetches the zip code to DMA mapping data from Harvard Dataverse
 * without requiring R or the zip2dma package.
 * 
 * Usage:
 *   npm run fetch:dmas
 * 
 * Environment variables:
 *   DATAVERSE_API_TOKEN - Required: Harvard Dataverse API token
 *   DATAVERSE_DOI - Optional: DOI of the dataset (will try to find it automatically)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const DATAVERSE_BASE_URL = 'https://dataverse.harvard.edu/api'
const DATAVERSE_API_TOKEN = process.env.DATAVERSE_API_TOKEN

interface DMARow {
  zip_code: string
  dma_code: number
  dma_name: string
}

/**
 * Search for the zip2dma dataset in Dataverse
 */
async function findDataset(): Promise<string | null> {
  console.log('🔍 Searching for zip2dma dataset in Dataverse...')
  
  try {
    // Search for datasets related to zip codes and DMA
    const searchUrl = `${DATAVERSE_BASE_URL}/search?q=zip2dma&type=dataset&key=${DATAVERSE_API_TOKEN}`
    const response = await fetch(searchUrl)
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (data.data && data.data.items && data.data.items.length > 0) {
      const dataset = data.data.items[0]
      console.log(`✅ Found dataset: ${dataset.name}`)
      console.log(`   DOI: ${dataset.global_id}`)
      return dataset.global_id
    }
    
    console.log('⚠️  Could not find dataset via search. Trying known DOI...')
    return null
  } catch (error: any) {
    console.error('Error searching for dataset:', error.message)
    return null
  }
}

/**
 * Fetch dataset files from Dataverse
 */
async function fetchDatasetFiles(datasetId: string): Promise<any[]> {
  console.log(`📥 Fetching dataset files for: ${datasetId}`)
  
  try {
    const url = `${DATAVERSE_BASE_URL}/datasets/:persistentId?persistentId=${datasetId}&key=${DATAVERSE_API_TOKEN}`
    const response = await fetch(url.replace(':persistentId', encodeURIComponent(datasetId)))
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.data.latestVersion.files || []
  } catch (error: any) {
    console.error('Error fetching dataset files:', error.message)
    throw error
  }
}

/**
 * Download and parse a file from Dataverse
 */
async function downloadFile(fileId: number, fileName: string): Promise<DMARow[]> {
  console.log(`📥 Downloading file: ${fileName} (ID: ${fileId})`)
  
  try {
    // Get file metadata
    const metadataUrl = `${DATAVERSE_BASE_URL}/access/datafile/${fileId}?key=${DATAVERSE_API_TOKEN}`
    
    // Try to download as CSV/TSV
    const response = await fetch(metadataUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }
    
    const text = await response.text()
    return parseDataFile(text, fileName)
  } catch (error: any) {
    console.error(`Error downloading file ${fileName}:`, error.message)
    throw error
  }
}

/**
 * Parse CSV/TSV data
 */
function parseDataFile(content: string, fileName: string): DMARow[] {
  console.log(`📊 Parsing file: ${fileName}`)
  
  const lines = content.split('\n').filter(line => line.trim())
  const rows: DMARow[] = []
  
  // Detect delimiter
  const delimiter = fileName.endsWith('.tsv') ? '\t' : ','
  
  // Skip header
  const header = lines[0].toLowerCase()
  const hasHeader = header.includes('zip') && (header.includes('dma') || header.includes('code'))
  const dataLines = hasHeader ? lines.slice(1) : lines
  
  for (const line of dataLines) {
    if (!line.trim()) continue
    
    const parts = line.split(delimiter).map(p => p.trim().replace(/^"|"$/g, ''))
    
    if (parts.length < 3) continue
    
    // Try to identify columns
    let zipCode = ''
    let dmaCode = 0
    let dmaName = ''
    
    // Common patterns: ZIP_CODE, DMA.CODE, DMA.NAME or zip_code, dma_code, dma_name
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].toUpperCase()
      if ((part.match(/^\d{5}$/) || part.match(/^\d{3,5}$/)) && !zipCode) {
        zipCode = parts[i].padStart(5, '0')
      } else if (part.match(/^\d{3,4}$/) && dmaCode === 0) {
        dmaCode = parseInt(parts[i])
      } else if (part.includes('-') || part.length > 5) {
        dmaName = parts[i]
      }
    }
    
    // Fallback: assume order is zip, code, name
    if (!zipCode && parts[0]) {
      zipCode = parts[0].replace(/[^0-9]/g, '').padStart(5, '0')
    }
    if (dmaCode === 0 && parts[1]) {
      dmaCode = parseInt(parts[1].replace(/[^0-9]/g, '')) || 0
    }
    if (!dmaName && parts[2]) {
      dmaName = parts.slice(2).join(' ').trim()
    }
    
    if (zipCode && dmaCode > 0 && dmaName) {
      rows.push({
        zip_code: zipCode,
        dma_code: dmaCode,
        dma_name: dmaName,
      })
    }
  }
  
  console.log(`✅ Parsed ${rows.length} rows`)
  return rows
}

/**
 * Alternative: Try to fetch from a known public dataset
 */
async function fetchFromKnownSource(): Promise<DMARow[]> {
  console.log('🌐 Attempting to fetch from known Dataverse sources...')
  
  // Common Dataverse dataset DOIs for zip code to DMA mappings
  // You may need to find the actual DOI from the zip2dma package or Dataverse
  const knownDOIs: string[] = [
    // Add known DOIs here if you find them
  ]
  
  for (const doi of knownDOIs) {
    try {
      console.log(`Trying DOI: ${doi}`)
      const files = await fetchDatasetFiles(doi)
      
      for (const file of files) {
        if (file.dataFile && (file.dataFile.filename.endsWith('.csv') || file.dataFile.filename.endsWith('.tsv'))) {
          const rows = await downloadFile(file.dataFile.id, file.dataFile.filename)
          if (rows.length > 0) {
            return rows
          }
        }
      }
    } catch (error) {
      console.log(`Failed to fetch from ${doi}, trying next...`)
      continue
    }
  }
  
  throw new Error('Could not fetch from any known source')
}

/**
 * Main function
 */
async function main() {
  if (!DATAVERSE_API_TOKEN) {
    console.error('❌ DATAVERSE_API_TOKEN not set in .env.local')
    console.error('\nTo get an API token:')
    console.error('  1. Go to https://dataverse.harvard.edu/')
    console.error('  2. Sign up or log in')
    console.error('  3. Go to your profile settings')
    console.error('  4. Create an API token')
    console.error('  5. Add to .env.local: DATAVERSE_API_TOKEN=your_token_here\n')
    process.exit(1)
  }
  
  try {
    let rows: DMARow[] = []
    
    // Try to find the dataset
    const datasetId = process.env.DATAVERSE_DOI || await findDataset()
    
    if (datasetId) {
      const files = await fetchDatasetFiles(datasetId)
      
      // Find CSV/TSV files
      const dataFiles = files.filter((f: any) => 
        f.dataFile && (f.dataFile.filename.endsWith('.csv') || f.dataFile.filename.endsWith('.tsv'))
      )
      
      if (dataFiles.length > 0) {
        console.log(`Found ${dataFiles.length} data file(s)`)
        for (const file of dataFiles) {
          const fileRows = await downloadFile(file.dataFile.id, file.dataFile.filename)
          rows.push(...fileRows)
        }
      } else {
        console.log('No CSV/TSV files found in dataset')
      }
    } else {
      // Try known sources
      rows = await fetchFromKnownSource()
    }
    
    if (rows.length === 0) {
      console.error('\n❌ No data fetched. You may need to:')
      console.error('  1. Find the correct Dataverse dataset DOI')
      console.error('  2. Set DATAVERSE_DOI in .env.local')
      console.error('  3. Or use the R package method instead\n')
      process.exit(1)
    }
    
    // Remove duplicates
    const uniqueRows = Array.from(
      new Map(rows.map(r => [`${r.zip_code}-${r.dma_code}`, r])).values()
    )
    
    console.log(`\n✅ Fetched ${uniqueRows.length} unique zip code to DMA mappings`)
    
    // Save to CSV
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    const csvPath = path.join(dataDir, 'dma-mappings.csv')
    const csvContent = [
      'zip_code,dma_code,dma_name',
      ...uniqueRows.map(r => `${r.zip_code},${r.dma_code},"${r.dma_name}"`)
    ].join('\n')
    
    fs.writeFileSync(csvPath, csvContent)
    console.log(`💾 Saved to: ${csvPath}`)
    console.log('\n✅ Now run: npm run import:dmas\n')
    
  } catch (error: any) {
    console.error('\n❌ Error fetching from Dataverse:', error.message)
    console.error('\n💡 Alternative: Use the R package method:')
    console.error('  1. Install R: https://www.r-project.org/')
    console.error('  2. Run: Rscript scripts/export-dmas-from-r.R')
    console.error('  3. Then: npm run import:dmas\n')
    process.exit(1)
  }
}

main()



