/**
 * Quick script to check media count in database
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMediaCount() {
  console.log('📸 Checking media count in database...\n')

  const { count, error } = await supabase
    .from('media')
    .select('*', { count: 'exact', head: true })

  if (error) {
    if (error.message.includes('does not exist')) {
      console.error('❌ The "media" table does not exist.')
      console.error('   Please run migration 019_create_media_table.sql')
    } else {
      console.error('❌ Error:', error.message)
    }
    process.exit(1)
  }

  console.log(`✅ Media table exists`)
  console.log(`   Total media files: ${count || 0}`)

  if (count === 0) {
    console.log('\n💡 To import media, run: npm run import:media')
  }
}

checkMediaCount().catch(console.error)



