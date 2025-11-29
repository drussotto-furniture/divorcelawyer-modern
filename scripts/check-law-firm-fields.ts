/**
 * Check Law Firm fields systematically
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const outputDir = path.join(process.cwd(), 'output')

async function checkLawFirmFields() {
  console.log('\n🏢 CHECKING LAW FIRM FIELDS\n')
  console.log('='.repeat(80))

  // Get a sample law firm from database
  const { data: sampleFirm } = await supabase
    .from('law_firms')
    .select('*')
    .limit(1)
    .single()

  if (!sampleFirm) {
    console.log('No law firms found in database')
    return
  }

  const firmFields = [
    // Basic Info
    { name: 'Name', key: 'name', extractable: true },
    { name: 'Slug', key: 'slug', extractable: true },
    { name: 'Description', key: 'description', extractable: true, location: 'intro block' },
    { name: 'Content', key: 'content', extractable: true, location: 'full content' },
    { name: 'Logo URL', key: 'logo_url', extractable: true, location: 'featured image' },
    
    // Contact Info
    { name: 'Email', key: 'email', extractable: false },
    { name: 'Phone', key: 'phone', extractable: true, location: 'hero block' },
    { name: 'Website', key: 'website', extractable: false },
    
    // Social Media
    { name: 'LinkedIn URL', key: 'linkedin_url', extractable: false },
    { name: 'Facebook URL', key: 'facebook_url', extractable: false },
    { name: 'Twitter URL', key: 'twitter_url', extractable: false },
    
    // Firm Info
    { name: 'Practice Areas', key: 'practice_areas', extractable: true, location: 'practice areas block' },
    { name: 'Founded Year', key: 'founded_year', extractable: true, location: 'hero block' },
    { name: 'Firm Size', key: 'firm_size', extractable: false },
    
    // Ratings & Status
    { name: 'Rating', key: 'rating', extractable: false },
    { name: 'Review Count', key: 'review_count', extractable: false },
    { name: 'Featured', key: 'featured', extractable: false },
    
    // SEO
    { name: 'Meta Title', key: 'meta_title', extractable: true, location: 'title' },
    { name: 'Meta Description', key: 'meta_description', extractable: true, location: 'excerpt' },
  ]

  console.log(`\nChecking ${firmFields.length} fields for: ${sampleFirm.name}\n`)

  const results: Array<{field: string, hasData: boolean, canExtract: boolean, needsManual: boolean}> = []

  for (const field of firmFields) {
    const value = sampleFirm[field.key]
    const hasData = value !== null && value !== undefined && 
                   (Array.isArray(value) ? value.length > 0 : 
                    typeof value === 'string' ? value.trim().length > 0 :
                    typeof value === 'number' ? value > 0 : 
                    typeof value === 'boolean' ? true : false)

    results.push({
      field: field.name,
      hasData,
      canExtract: field.extractable && !hasData,
      needsManual: !field.extractable && !hasData
    })
  }

  const hasData = results.filter(r => r.hasData)
  const missingExtractable = results.filter(r => !r.hasData && r.canExtract)
  const missingManual = results.filter(r => !r.hasData && r.needsManual)

  console.log('FIELD STATUS:')
  console.log('-'.repeat(80))
  console.log(`\n✅ HAS DATA (${hasData.length} fields):`)
  hasData.forEach(r => console.log(`  ${r.field}`))

  console.log(`\n❌ MISSING - CAN EXTRACT (${missingExtractable.length} fields):`)
  missingExtractable.forEach(r => {
    const fieldInfo = firmFields.find(f => f.name === r.field)
    console.log(`  ${r.field.padEnd(30)} → ${fieldInfo?.location || 'WordPress'}`)
  })

  console.log(`\n⚠️  MISSING - MANUAL ENTRY (${missingManual.length} fields):`)
  missingManual.forEach(r => console.log(`  ${r.field}`))

  console.log('\n' + '='.repeat(80))
  console.log(`\n📊 SUMMARY: ${hasData.length}/${firmFields.length} fields have data (${((hasData.length / firmFields.length) * 100).toFixed(1)}%)`)
}

checkLawFirmFields().catch(console.error)

