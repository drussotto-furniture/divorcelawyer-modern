/**
 * Comprehensive field-by-field check for all lawyer and law firm forms
 * 
 * Usage: npx tsx scripts/check-all-lawyer-fields.ts
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

interface FieldStatus {
  field: string
  hasData: boolean
  dataType: string
  sampleValue: any
  inWordPress: boolean
  extractionPossible: boolean
}

async function checkLawyerFields() {
  console.log('\n🔍 CHECKING LAWYER FIELDS\n')
  console.log('='.repeat(80))

  // Get a sample lawyer from database
  const { data: dbLawyer } = await supabase
    .from('lawyers')
    .select('*')
    .eq('slug', 'marvin-solomiany')
    .single()

  if (!dbLawyer) {
    console.error('Lawyer not found in database')
    return
  }

  // Get WordPress data
  const lawyersFile = path.join(outputDir, 'lawyers.json')
  if (!fs.existsSync(lawyersFile)) {
    console.error('WordPress JSON file not found')
    return
  }

  const lawyers: any[] = JSON.parse(fs.readFileSync(lawyersFile, 'utf-8'))
  const wpLawyer = lawyers.find(l => l.post_name === 'marvin-solomiany')
  const content = wpLawyer?.content || ''

  // Define all fields to check
  const fieldsToCheck: Array<{name: string, dbKey: string, wpExtractable: boolean, wpLocation?: string}> = [
    // Basic Info
    { name: 'First Name', dbKey: 'first_name', wpExtractable: true, wpLocation: 'title split' },
    { name: 'Last Name', dbKey: 'last_name', wpExtractable: true, wpLocation: 'title split' },
    { name: 'Title', dbKey: 'title', wpExtractable: true, wpLocation: 'ACF field' },
    { name: 'Bio', dbKey: 'bio', wpExtractable: true, wpLocation: 'intro block' },
    { name: 'Email', dbKey: 'email', wpExtractable: false },
    { name: 'Phone', dbKey: 'phone', wpExtractable: true, wpLocation: 'hero block' },
    { name: 'Photo URL', dbKey: 'photo_url', wpExtractable: true, wpLocation: 'featured image' },
    
    // Professional Info
    { name: 'Bar Number', dbKey: 'bar_number', wpExtractable: false },
    { name: 'Years Experience', dbKey: 'years_experience', wpExtractable: true, wpLocation: 'hero block' },
    { name: 'Specializations', dbKey: 'specializations', wpExtractable: true, wpLocation: 'practice areas block' },
    { name: 'Bar Admissions', dbKey: 'bar_admissions', wpExtractable: true, wpLocation: 'highlights: Bar Admission' },
    { name: 'Education', dbKey: 'education', wpExtractable: true, wpLocation: 'highlights: Education' },
    { name: 'Awards', dbKey: 'awards', wpExtractable: true, wpLocation: 'highlights: Awards' },
    { name: 'Publications', dbKey: 'publications', wpExtractable: true, wpLocation: 'highlights: Publications' },
    { name: 'Professional Memberships', dbKey: 'professional_memberships', wpExtractable: true, wpLocation: 'highlights: Leadership Roles' },
    { name: 'Certifications', dbKey: 'certifications', wpExtractable: true, wpLocation: 'highlights: Certifications' },
    { name: 'Credentials Summary', dbKey: 'credentials_summary', wpExtractable: false },
    
    // Practice & Approach
    { name: 'Practice Focus', dbKey: 'practice_focus', wpExtractable: false },
    { name: 'Approach', dbKey: 'approach', wpExtractable: false },
    { name: 'Languages', dbKey: 'languages', wpExtractable: true, wpLocation: 'hero block' },
    
    // Recognition & Media
    { name: 'Media Mentions', dbKey: 'media_mentions', wpExtractable: false },
    { name: 'Speaking Engagements', dbKey: 'speaking_engagements', wpExtractable: false },
    
    // Contact & Office
    { name: 'LinkedIn URL', dbKey: 'linkedin_url', wpExtractable: false },
    { name: 'Twitter URL', dbKey: 'twitter_url', wpExtractable: false },
    { name: 'Consultation Fee', dbKey: 'consultation_fee', wpExtractable: false },
    { name: 'Accepts New Clients', dbKey: 'accepts_new_clients', wpExtractable: false },
    { name: 'Consultation Available', dbKey: 'consultation_available', wpExtractable: false },
    { name: 'Office Address', dbKey: 'office_address', wpExtractable: true, wpLocation: 'locations block' },
    { name: 'Office Hours', dbKey: 'office_hours', wpExtractable: false },
    
    // Ratings & Status
    { name: 'Rating', dbKey: 'rating', wpExtractable: false },
    { name: 'Review Count', dbKey: 'review_count', wpExtractable: false },
    { name: 'Verified', dbKey: 'verified', wpExtractable: false },
    { name: 'Featured', dbKey: 'featured', wpExtractable: false },
    
    // SEO
    { name: 'Meta Title', dbKey: 'meta_title', wpExtractable: true, wpLocation: 'title' },
    { name: 'Meta Description', dbKey: 'meta_description', wpExtractable: true, wpLocation: 'excerpt' },
  ]

  console.log(`\nChecking ${fieldsToCheck.length} fields for: ${dbLawyer.first_name} ${dbLawyer.last_name}\n`)

  const results: FieldStatus[] = []

  for (const field of fieldsToCheck) {
    const dbValue = dbLawyer[field.dbKey]
    const hasData = dbValue !== null && dbValue !== undefined && 
                   (Array.isArray(dbValue) ? dbValue.length > 0 : 
                    typeof dbValue === 'string' ? dbValue.trim().length > 0 :
                    typeof dbValue === 'number' ? dbValue > 0 : 
                    typeof dbValue === 'boolean' ? true : false)
    
    const dataType = Array.isArray(dbValue) ? 'array' : typeof dbValue
    const sampleValue = Array.isArray(dbValue) 
      ? (dbValue.length > 0 ? dbValue.slice(0, 2) : [])
      : (typeof dbValue === 'string' && dbValue.length > 50 ? dbValue.substring(0, 50) + '...' : dbValue)
    
    // Check if data exists in WordPress
    let inWordPress = false
    if (field.wpExtractable && content) {
      // Simple checks for different field types
      if (field.dbKey === 'education') {
        inWordPress = /Education/i.test(content) || /hightlights_List.*Education/i.test(content)
      } else if (field.dbKey === 'bar_admissions') {
        inWordPress = /Bar.*Admission/i.test(content)
      } else if (field.dbKey === 'awards') {
        inWordPress = /Awards/i.test(content)
      } else if (field.dbKey === 'publications') {
        inWordPress = /Publications/i.test(content)
      } else if (field.dbKey === 'professional_memberships') {
        inWordPress = /Leadership.*Roles/i.test(content)
      } else if (field.dbKey === 'specializations') {
        inWordPress = /practice_areas_tags/i.test(content)
      } else if (field.dbKey === 'phone') {
        inWordPress = /phone_number/i.test(content)
      } else if (field.dbKey === 'years_experience') {
        inWordPress = /firm_year_experience/i.test(content)
      } else if (field.dbKey === 'bio') {
        inWordPress = /intro|short_description/i.test(content)
      }
    }

    results.push({
      field: field.name,
      hasData,
      dataType,
      sampleValue,
      inWordPress,
      extractionPossible: field.wpExtractable && inWordPress && !hasData
    })
  }

  // Print results
  console.log('FIELD STATUS REPORT\n')
  console.log('-' .repeat(80))
  
  const sections = [
    { title: '✅ HAS DATA', filter: (r: FieldStatus) => r.hasData },
    { title: '❌ MISSING DATA (Extractable from WordPress)', filter: (r: FieldStatus) => !r.hasData && r.extractionPossible },
    { title: '⚠️  MISSING DATA (Not in WordPress)', filter: (r: FieldStatus) => !r.hasData && !r.extractionPossible && r.inWordPress === false },
    { title: 'ℹ️  MISSING DATA (Manual Entry Required)', filter: (r: FieldStatus) => !r.hasData && !r.extractionPossible && !r.inWordPress },
  ]

  for (const section of sections) {
    const sectionResults = results.filter(section.filter)
    if (sectionResults.length > 0) {
      console.log(`\n${section.title} (${sectionResults.length} fields):`)
      console.log('-'.repeat(80))
      for (const result of sectionResults) {
        const fieldInfo = fieldsToCheck.find(f => f.name === result.field)
        console.log(`  ${result.field.padEnd(30)} | Type: ${result.dataType.padEnd(8)} | ${fieldInfo?.wpLocation || 'N/A'}`)
        if (result.hasData && result.sampleValue) {
          console.log(`    Sample: ${JSON.stringify(result.sampleValue)}`)
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n📊 SUMMARY:')
  console.log(`  Total fields: ${results.length}`)
  console.log(`  Has data: ${results.filter(r => r.hasData).length}`)
  console.log(`  Missing (extractable): ${results.filter(r => !r.hasData && r.extractionPossible).length}`)
  console.log(`  Missing (not in WP): ${results.filter(r => !r.hasData && !r.extractionPossible && !r.inWordPress).length}`)
  console.log(`  Missing (manual): ${results.filter(r => !r.hasData && !r.extractionPossible && !r.inWordPress === false).length}`)
}

checkLawyerFields().catch(console.error)

