/**
 * Script to extract practice areas from lawyers.json and update the database
 * 
 * This extracts practice areas from the WordPress Gutenberg block content
 * and populates the specializations field in the lawyers table.
 * 
 * Usage: npx tsx scripts/extract-practice-areas.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface LawyerData {
  title: string
  post_name: string
  content: string
  meta?: any
}

function extractPracticeAreas(content: string): string[] {
  const practiceAreas: string[] = []
  
  // Look for practice_areas_tags in the Gutenberg block JSON
  const practiceAreaRegex = /"practice_areas_tags_\d+_tag_name":"([^"]+)"/g
  let match
  
  while ((match = practiceAreaRegex.exec(content)) !== null) {
    const practiceArea = match[1].trim()
    if (practiceArea && !practiceAreas.includes(practiceArea)) {
      practiceAreas.push(practiceArea)
    }
  }
  
  return practiceAreas
}

async function updateLawyerSpecializations() {
  console.log('📖 Reading lawyers.json...')
  const lawyersFile = path.join(process.cwd(), 'output', 'lawyers.json')
  
  if (!fs.existsSync(lawyersFile)) {
    console.error(`❌ File not found: ${lawyersFile}`)
    console.error('   Run the XML parser first: python3 scripts/parse-wordpress-xml.py')
    process.exit(1)
  }
  
  const lawyers: LawyerData[] = JSON.parse(fs.readFileSync(lawyersFile, 'utf-8'))
  console.log(`✓ Found ${lawyers.length} lawyers in JSON\n`)
  
  let updated = 0
  let notFound = 0
  let errors = 0
  
  for (const lawyer of lawyers) {
    const practiceAreas = extractPracticeAreas(lawyer.content)
    
    if (practiceAreas.length === 0) {
      console.log(`⚠️  ${lawyer.title}: No practice areas found`)
      continue
    }
    
    console.log(`\n👤 ${lawyer.title} (${lawyer.post_name})`)
    console.log(`   Practice Areas: ${practiceAreas.join(', ')}`)
    
    // Find lawyer by slug
    const { data: existingLawyer, error: fetchError } = await supabase
      .from('lawyers')
      .select('id, first_name, last_name, slug')
      .eq('slug', lawyer.post_name)
      .single()
    
    if (fetchError || !existingLawyer) {
      console.log(`   ❌ Not found in database (slug: ${lawyer.post_name})`)
      notFound++
      continue
    }
    
    // Update specializations
    const { error: updateError } = await supabase
      .from('lawyers')
      .update({ specializations: practiceAreas })
      .eq('id', existingLawyer.id)
    
    if (updateError) {
      console.log(`   ❌ Error updating: ${updateError.message}`)
      errors++
    } else {
      console.log(`   ✅ Updated successfully`)
      updated++
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Updated: ${updated}`)
  console.log(`⚠️  Not found: ${notFound}`)
  console.log(`❌ Errors: ${errors}`)
  console.log('='.repeat(50))
}

// Run the script
updateLawyerSpecializations().catch(console.error)

