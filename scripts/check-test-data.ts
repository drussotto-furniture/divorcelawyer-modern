/**
 * Quick script to check if test data exists and create it if it doesn't
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkAndCreate() {
  console.log('Checking for existing test data...\n')
  
  // Check for test firm
  const { data: existingFirm } = await supabase
    .from('law_firms')
    .select('id, name, slug')
    .eq('slug', 'test-law-firm')
    .single()
  
  // Check for test lawyer
  const { data: existingLawyer } = await supabase
    .from('lawyers')
    .select('id, first_name, last_name, slug')
    .eq('slug', 'test-lawyer')
    .single()
  
  if (existingFirm && existingLawyer) {
    console.log('✅ Test data already exists!')
    console.log(`\nLaw Firm: ${existingFirm.name}`)
    console.log(`  ID: ${existingFirm.id}`)
    console.log(`  URL: http://localhost:3001/admin/directory/law-firms/${existingFirm.id}`)
    console.log(`\nLawyer: ${existingLawyer.first_name} ${existingLawyer.last_name}`)
    console.log(`  ID: ${existingLawyer.id}`)
    console.log(`  URL: http://localhost:3001/admin/directory/lawyers/${existingLawyer.id}`)
    return
  }
  
  console.log('❌ Test data not found. Please run: npm run create:test-data')
  process.exit(1)
}

checkAndCreate().catch(console.error)

