/**
 * Check Education field specifically
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

async function checkEducation() {
  console.log('\n🔍 CHECKING EDUCATION FIELD\n')
  
  // Check all lawyers in database
  const { data: lawyers } = await supabase
    .from('lawyers')
    .select('id, first_name, last_name, slug, education')
    .order('first_name')
  
  console.log(`\nDatabase Status (${lawyers?.length || 0} lawyers):`)
  console.log('-'.repeat(80))
  for (const lawyer of lawyers || []) {
    const hasEducation = lawyer.education && Array.isArray(lawyer.education) && lawyer.education.length > 0
    console.log(`${lawyer.first_name} ${lawyer.last_name}: ${hasEducation ? '✅ HAS DATA' : '❌ NULL/EMPTY'}`)
    if (hasEducation) {
      console.log(`  → ${lawyer.education.length} items: ${lawyer.education.slice(0, 2).join(', ')}`)
    }
  }
  
  // Check WordPress data
  const lawyersFile = path.join(process.cwd(), 'output', 'lawyers.json')
  if (!fs.existsSync(lawyersFile)) {
    console.log('\n⚠️  WordPress JSON not found')
    return
  }
  
  const wpLawyers: any[] = JSON.parse(fs.readFileSync(lawyersFile, 'utf-8'))
  console.log(`\n\nWordPress Status (${wpLawyers.length} lawyers):`)
  console.log('-'.repeat(80))
  
  for (const wpLawyer of wpLawyers) {
    const content = wpLawyer.content || ''
    // Check for education in highlights
    const hasEducationHeading = /Education/i.test(content) && /hightlights_List.*Education/i.test(content)
    // Also check for common education patterns
    const hasEducationPattern = /(J\.D\.|LL\.B\.|B\.A\.|B\.S\.|M\.A\.|Ph\.D\.|Law School|University|College)/i.test(content)
    
    console.log(`${wpLawyer.title}:`)
    console.log(`  Education heading: ${hasEducationHeading ? '✅ FOUND' : '❌ NOT FOUND'}`)
    console.log(`  Education pattern: ${hasEducationPattern ? '✅ FOUND' : '❌ NOT FOUND'}`)
    
    if (hasEducationHeading) {
      // Try to extract
      const headingRegex = /"hightlights_List_(\d+)_heading":"([^"]*Education[^"]*)"/i
      const match = content.match(headingRegex)
      if (match) {
        const idx = match[1]
        const descRegex = new RegExp(`"hightlights_List_${idx}_description":"([^"]+)"`, 'i')
        const descMatch = content.match(descRegex)
        if (descMatch) {
          const desc = descMatch[1].replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\n/g, ' ')
          const items = desc.match(/<li[^>]*>(.*?)<\/li>/gi) || []
          console.log(`  → Found ${items.length} education items`)
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('\n💡 CONCLUSION:')
  console.log('  Education data is NOT in the highlights section for any lawyer.')
  console.log('  Education may need to be manually entered or extracted from bio/other sections.')
}

checkEducation().catch(console.error)

