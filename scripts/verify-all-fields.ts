/**
 * Verify all fields are being extracted and updated correctly
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function verifyFields() {
  console.log('\n🔍 VERIFYING ALL FIELDS\n')
  console.log('='.repeat(80))

  // Check a sample lawyer
  const { data: lawyer } = await supabase
    .from('lawyers')
    .select('*')
    .eq('slug', 'marvin-solomiany')
    .single()

  if (!lawyer) {
    console.log('Lawyer not found')
    return
  }

  console.log(`\nLawyer: ${lawyer.first_name} ${lawyer.last_name}\n`)

  const fields = [
    { name: 'Title', key: 'title', type: 'string' },
    { name: 'Languages', key: 'languages', type: 'array' },
    { name: 'Office Address', key: 'office_address', type: 'string' },
    { name: 'Meta Title', key: 'meta_title', type: 'string' },
    { name: 'Meta Description', key: 'meta_description', type: 'string' },
    { name: 'Education', key: 'education', type: 'array' },
    { name: 'Certifications', key: 'certifications', type: 'array' },
  ]

  console.log('EXTRACTABLE FIELDS STATUS:')
  console.log('-'.repeat(80))
  for (const field of fields) {
    const value = lawyer[field.key]
    const hasData = field.type === 'array' 
      ? (value && Array.isArray(value) && value.length > 0)
      : (value && typeof value === 'string' && value.trim().length > 0)
    
    console.log(`${hasData ? '✅' : '❌'} ${field.name.padEnd(20)}: ${hasData ? 'HAS DATA' : 'MISSING'}`)
    if (hasData && field.type === 'array') {
      console.log(`   → ${value.length} items`)
    } else if (hasData && field.type === 'string') {
      console.log(`   → ${value.substring(0, 50)}...`)
    }
  }

  // Check law firm
  const { data: firm } = await supabase
    .from('law_firms')
    .select('*')
    .limit(1)
    .single()

  if (firm) {
    console.log(`\n\nLaw Firm: ${firm.name}\n`)
    const firmFields = [
      { name: 'Meta Title', key: 'meta_title', type: 'string' },
      { name: 'Meta Description', key: 'meta_description', type: 'string' },
      { name: 'Founded Year', key: 'founded_year', type: 'number' },
    ]

    console.log('LAW FIRM EXTRACTABLE FIELDS:')
    console.log('-'.repeat(80))
    for (const field of firmFields) {
      const value = firm[field.key]
      const hasData = field.type === 'number'
        ? (value && typeof value === 'number' && value > 0)
        : (value && typeof value === 'string' && value.trim().length > 0)
      
      console.log(`${hasData ? '✅' : '❌'} ${field.name.padEnd(20)}: ${hasData ? 'HAS DATA' : 'MISSING'}`)
      if (hasData) {
        console.log(`   → ${value}`)
      }
    }
  }

  console.log('\n' + '='.repeat(80))
}

verifyFields().catch(console.error)



