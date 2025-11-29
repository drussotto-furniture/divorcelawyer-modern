/**
 * Diagnostic script to check what data exists in database vs WordPress JSON
 * 
 * Usage: npx tsx scripts/diagnose-lawyer-data.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const outputDir = path.join(process.cwd(), 'output')

async function diagnoseLawyer(slug: string = 'marvin-solomiany') {
  console.log(`\n🔍 Diagnosing data for lawyer: ${slug}\n`)
  console.log('='.repeat(80))

  // 1. Check database
  console.log('\n📊 DATABASE DATA:')
  console.log('-'.repeat(80))
  const { data: dbLawyer, error: dbError } = await supabase
    .from('lawyers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (dbError || !dbLawyer) {
    console.error(`❌ Error fetching from database: ${dbError?.message}`)
    return
  }

  console.log(`Name: ${dbLawyer.first_name} ${dbLawyer.last_name}`)
  console.log(`\nFields in database:`)
  console.log(`  - years_experience: ${dbLawyer.years_experience ?? 'NULL'}`)
  console.log(`  - specializations: ${JSON.stringify(dbLawyer.specializations)} (type: ${typeof dbLawyer.specializations}, isArray: ${Array.isArray(dbLawyer.specializations)})`)
  console.log(`  - bar_admissions: ${JSON.stringify(dbLawyer.bar_admissions)} (type: ${typeof dbLawyer.bar_admissions}, isArray: ${Array.isArray(dbLawyer.bar_admissions)})`)
  console.log(`  - education: ${JSON.stringify(dbLawyer.education)} (type: ${typeof dbLawyer.education}, isArray: ${Array.isArray(dbLawyer.education)})`)
  console.log(`  - awards: ${JSON.stringify(dbLawyer.awards)} (type: ${typeof dbLawyer.awards}, isArray: ${Array.isArray(dbLawyer.awards)})`)
  console.log(`  - publications: ${JSON.stringify(dbLawyer.publications)} (type: ${typeof dbLawyer.publications}, isArray: ${Array.isArray(dbLawyer.publications)})`)
  console.log(`  - professional_memberships: ${JSON.stringify(dbLawyer.professional_memberships)} (type: ${typeof dbLawyer.professional_memberships}, isArray: ${Array.isArray(dbLawyer.professional_memberships)})`)
  console.log(`  - certifications: ${JSON.stringify(dbLawyer.certifications)} (type: ${typeof dbLawyer.certifications}, isArray: ${Array.isArray(dbLawyer.certifications)})`)
  console.log(`  - bio: ${dbLawyer.bio ? `Present (${dbLawyer.bio.length} chars)` : 'NULL or empty'}`)
  console.log(`  - phone: ${dbLawyer.phone ?? 'NULL'}`)

  // 2. Check WordPress JSON
  console.log(`\n📄 WORDPRESS JSON DATA:`)
  console.log('-'.repeat(80))
  const lawyersFile = path.join(outputDir, 'lawyers.json')
  
  if (!fs.existsSync(lawyersFile)) {
    console.error(`❌ WordPress JSON file not found: ${lawyersFile}`)
    return
  }

  const lawyers: any[] = JSON.parse(fs.readFileSync(lawyersFile, 'utf-8'))
  const wpLawyer = lawyers.find(l => l.post_name === slug)

  if (!wpLawyer) {
    console.error(`❌ Lawyer not found in WordPress JSON`)
    return
  }

  console.log(`Found in JSON: ${wpLawyer.title}`)
  console.log(`\nContent preview (first 500 chars):`)
  console.log(wpLawyer.content?.substring(0, 500) || 'No content')

  // 3. Try to extract data
  console.log(`\n🔧 EXTRACTION TEST:`)
  console.log('-'.repeat(80))
  
  const content = wpLawyer.content || ''
  
  // Extract practice areas
  const practiceAreaRegex = /"practice_areas_tags_\d+_tag_name":"([^"]+)"/g
  const practiceAreas: string[] = []
  let match
  while ((match = practiceAreaRegex.exec(content)) !== null) {
    const area = match[1].trim()
    if (area && !practiceAreas.includes(area)) {
      practiceAreas.push(area)
    }
  }
  console.log(`  Practice Areas found: ${practiceAreas.length > 0 ? practiceAreas.join(', ') : 'NONE'}`)

  // Extract phone
  const phoneMatch = content.match(/"phone_number":"([^"]+)"/)
  const phone = phoneMatch ? phoneMatch[1].trim() : null
  console.log(`  Phone found: ${phone || 'NONE'}`)

  // Extract years experience
  const yearsMatch = content.match(/"firm_year_experience":"(\d+)"/)
  const years = yearsMatch ? parseInt(yearsMatch[1], 10) : null
  console.log(`  Years Experience found: ${years || 'NONE'}`)

  // Extract from highlights (updated to handle HTML tags in headings)
  const extractFromHighlights = (content: string, heading: string): string[] => {
    const items: string[] = []
    const keyWords = heading.split(/\s+/).filter(w => w.length > 0 && !w.match(/^<|>$/))
    
    if (keyWords.length === 0) return items
    
    // Find all highlight sections
    const highlightRegex = /"hightlights_List_(\d+)_heading":"([^"]+)"/g
    const allMatches: Array<{index: string, heading: string}> = []
    let match
    
    while ((match = highlightRegex.exec(content)) !== null) {
      allMatches.push({ index: match[1], heading: match[2] })
    }
    
    for (const { index, heading: headingText } of allMatches) {
      const headingTextDecoded = headingText
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .toLowerCase()
      
      const allWordsMatch = keyWords.every(word => 
        headingTextDecoded.includes(word.toLowerCase())
      )
      
      if (allWordsMatch) {
        const descPattern = `"hightlights_List_${index}_description":"([^"]*(?:\\\\.[^"]*)*)"`
        const descRegex = new RegExp(descPattern, 'i')
        const descMatch = content.match(descRegex)
        
        if (descMatch && descMatch[1]) {
          let description = descMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\"/g, '"')
            .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
          
          const listItemRegex = /<li[^>]*>(.*?)<\/li>/gi
          let listMatch
          
          while ((listMatch = listItemRegex.exec(description)) !== null) {
            const item = listMatch[1].replace(/<[^>]*>/g, '').trim()
            if (item) items.push(item)
          }
          break
        }
      }
    }
    
    return items
  }

  const barAdmissions = extractFromHighlights(content, 'Bar Admission')
  console.log(`  Bar Admissions found: ${barAdmissions.length > 0 ? barAdmissions.join(', ') : 'NONE'}`)

  const awards = extractFromHighlights(content, 'Award')
  console.log(`  Awards found: ${awards.length > 0 ? awards.join(', ') : 'NONE'}`)

  const education = extractFromHighlights(content, 'Education')
  console.log(`  Education found: ${education.length > 0 ? education.join(', ') : 'NONE'}`)

  const publications = extractFromHighlights(content, 'Publications')
  console.log(`  Publications found: ${publications.length > 0 ? publications.join(', ') : 'NONE'}`)

  const memberships = extractFromHighlights(content, 'Membership')
  console.log(`  Memberships found: ${memberships.length > 0 ? memberships.join(', ') : 'NONE'}`)

  // 4. Compare
  console.log(`\n📊 COMPARISON:`)
  console.log('-'.repeat(80))
  
  const hasSpecializationsInDB = dbLawyer.specializations && Array.isArray(dbLawyer.specializations) && dbLawyer.specializations.length > 0
  const hasSpecializationsInWP = practiceAreas.length > 0
  console.log(`Specializations: DB=${hasSpecializationsInDB ? 'YES' : 'NO'}, WP=${hasSpecializationsInWP ? 'YES' : 'NO'} ${hasSpecializationsInDB && !hasSpecializationsInWP ? '⚠️ DB has data but WP doesn\'t' : !hasSpecializationsInDB && hasSpecializationsInWP ? '⚠️ WP has data but DB doesn\'t' : hasSpecializationsInDB && hasSpecializationsInWP ? '✓ Both have data' : '❌ Neither has data'}`)

  const hasBarAdmissionsInDB = dbLawyer.bar_admissions && Array.isArray(dbLawyer.bar_admissions) && dbLawyer.bar_admissions.length > 0
  const hasBarAdmissionsInWP = barAdmissions.length > 0
  console.log(`Bar Admissions: DB=${hasBarAdmissionsInDB ? 'YES' : 'NO'}, WP=${hasBarAdmissionsInWP ? 'YES' : 'NO'} ${hasBarAdmissionsInDB && !hasBarAdmissionsInWP ? '⚠️ DB has data but WP doesn\'t' : !hasBarAdmissionsInDB && hasBarAdmissionsInWP ? '⚠️ WP has data but DB doesn\'t' : hasBarAdmissionsInDB && hasBarAdmissionsInWP ? '✓ Both have data' : '❌ Neither has data'}`)

  const hasEducationInDB = dbLawyer.education && Array.isArray(dbLawyer.education) && dbLawyer.education.length > 0
  const hasEducationInWP = education.length > 0
  console.log(`Education: DB=${hasEducationInDB ? 'YES' : 'NO'}, WP=${hasEducationInWP ? 'YES' : 'NO'} ${hasEducationInDB && !hasEducationInWP ? '⚠️ DB has data but WP doesn\'t' : !hasEducationInDB && hasEducationInWP ? '⚠️ WP has data but DB doesn\'t' : hasEducationInDB && hasEducationInWP ? '✓ Both have data' : '❌ Neither has data'}`)

  const hasAwardsInDB = dbLawyer.awards && Array.isArray(dbLawyer.awards) && dbLawyer.awards.length > 0
  const hasAwardsInWP = awards.length > 0
  console.log(`Awards: DB=${hasAwardsInDB ? 'YES' : 'NO'}, WP=${hasAwardsInWP ? 'YES' : 'NO'} ${hasAwardsInDB && !hasAwardsInWP ? '⚠️ DB has data but WP doesn\'t' : !hasAwardsInDB && hasAwardsInWP ? '⚠️ WP has data but DB doesn\'t' : hasAwardsInDB && hasAwardsInWP ? '✓ Both have data' : '❌ Neither has data'}`)

  console.log(`\n${'='.repeat(80)}\n`)
}

// Run for Marvin Solomiany
diagnoseLawyer('marvin-solomiany').catch(console.error)

