/**
 * Quick status check of all fields
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function quickStatus() {
  const { data: lawyer } = await supabase
    .from('lawyers')
    .select('first_name, last_name, title, languages, office_address, meta_title, meta_description, certifications')
    .eq('slug', 'marvin-solomiany')
    .single()

  console.log('\n📊 QUICK FIELD STATUS FOR MARVIN SOLOMIANY\n')
  console.log('Title:', lawyer?.title || '❌ MISSING')
  console.log('Languages:', lawyer?.languages || '❌ MISSING')
  console.log('Office Address:', lawyer?.office_address || '❌ MISSING')
  console.log('Meta Title:', lawyer?.meta_title || '❌ MISSING')
  console.log('Meta Description:', lawyer?.meta_description ? lawyer.meta_description.substring(0, 50) + '...' : '❌ MISSING')
  console.log('Certifications:', lawyer?.certifications || '❌ MISSING')
}

quickStatus().catch(console.error)

