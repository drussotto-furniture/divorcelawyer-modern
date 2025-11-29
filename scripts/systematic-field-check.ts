/**
 * Systematic field-by-field check for all admin forms
 * This will check each field and identify what needs to be fixed
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

interface FieldReport {
  field: string
  form: string
  hasData: boolean
  canExtract: boolean
  extractionLocation?: string
  needsManualEntry: boolean
  sampleValue?: any
}

async function systematicCheck() {
  console.log('\n📋 SYSTEMATIC FIELD CHECK FOR ALL ADMIN FORMS\n')
  console.log('='.repeat(80))

  const reports: FieldReport[] = []

  // ============================================================================
  // LAWYER FIELDS
  // ============================================================================
  console.log('\n👨‍⚖️  LAWYER FIELDS\n')
  
  const { data: sampleLawyer } = await supabase
    .from('lawyers')
    .select('*')
    .eq('slug', 'marvin-solomiany')
    .single()

  const lawyerFields = [
    // Basic Info
    { name: 'First Name', key: 'first_name', extractable: true },
    { name: 'Last Name', key: 'last_name', extractable: true },
    { name: 'Title', key: 'title', extractable: true, location: 'ACF hero block' },
    { name: 'Bio', key: 'bio', extractable: true, location: 'intro block' },
    { name: 'Email', key: 'email', extractable: false },
    { name: 'Phone', key: 'phone', extractable: true, location: 'hero block' },
    { name: 'Photo URL', key: 'photo_url', extractable: true, location: 'featured image' },
    
    // Professional Info
    { name: 'Bar Number', key: 'bar_number', extractable: false },
    { name: 'Years Experience', key: 'years_experience', extractable: true, location: 'hero block' },
    { name: 'Specializations', key: 'specializations', extractable: true, location: 'practice areas block' },
    { name: 'Bar Admissions', key: 'bar_admissions', extractable: true, location: 'highlights: Bar Admission' },
    { name: 'Education', key: 'education', extractable: true, location: 'highlights: Education (if exists)' },
    { name: 'Awards', key: 'awards', extractable: true, location: 'highlights: Awards' },
    { name: 'Publications', key: 'publications', extractable: true, location: 'highlights: Publications' },
    { name: 'Professional Memberships', key: 'professional_memberships', extractable: true, location: 'highlights: Leadership Roles' },
    { name: 'Certifications', key: 'certifications', extractable: true, location: 'highlights: Certifications (if exists)' },
    { name: 'Credentials Summary', key: 'credentials_summary', extractable: false },
    
    // Practice & Approach
    { name: 'Practice Focus', key: 'practice_focus', extractable: false },
    { name: 'Approach', key: 'approach', extractable: false },
    { name: 'Languages', key: 'languages', extractable: true, location: 'hero block' },
    
    // Recognition & Media
    { name: 'Media Mentions', key: 'media_mentions', extractable: false },
    { name: 'Speaking Engagements', key: 'speaking_engagements', extractable: false },
    
    // Contact & Office
    { name: 'LinkedIn URL', key: 'linkedin_url', extractable: false },
    { name: 'Twitter URL', key: 'twitter_url', extractable: false },
    { name: 'Consultation Fee', key: 'consultation_fee', extractable: false },
    { name: 'Accepts New Clients', key: 'accepts_new_clients', extractable: false },
    { name: 'Consultation Available', key: 'consultation_available', extractable: false },
    { name: 'Office Address', key: 'office_address', extractable: true, location: 'locations block' },
    { name: 'Office Hours', key: 'office_hours', extractable: false },
    
    // Ratings & Status
    { name: 'Rating', key: 'rating', extractable: false },
    { name: 'Review Count', key: 'review_count', extractable: false },
    { name: 'Verified', key: 'verified', extractable: false },
    { name: 'Featured', key: 'featured', extractable: false },
    
    // SEO
    { name: 'Meta Title', key: 'meta_title', extractable: true, location: 'title' },
    { name: 'Meta Description', key: 'meta_description', extractable: true, location: 'excerpt' },
  ]

  for (const field of lawyerFields) {
    const value = sampleLawyer?.[field.key]
    const hasData = value !== null && value !== undefined && 
                   (Array.isArray(value) ? value.length > 0 : 
                    typeof value === 'string' ? value.trim().length > 0 :
                    typeof value === 'number' ? value > 0 : 
                    typeof value === 'boolean' ? true : false)

    reports.push({
      field: field.name,
      form: 'Lawyer',
      hasData,
      canExtract: field.extractable && !hasData,
      extractionLocation: field.location,
      needsManualEntry: !field.extractable && !hasData,
      sampleValue: Array.isArray(value) ? value.slice(0, 2) : (typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value)
    })
  }

  // Print Lawyer Fields Report
  console.log('FIELD STATUS:')
  console.log('-'.repeat(80))
  const missingExtractable = reports.filter(r => r.form === 'Lawyer' && !r.hasData && r.canExtract)
  const missingManual = reports.filter(r => r.form === 'Lawyer' && !r.hasData && r.needsManualEntry)
  const hasData = reports.filter(r => r.form === 'Lawyer' && r.hasData)

  console.log(`\n✅ HAS DATA (${hasData.length} fields):`)
  hasData.forEach(r => console.log(`  ${r.field}`))

  console.log(`\n❌ MISSING - CAN EXTRACT (${missingExtractable.length} fields):`)
  missingExtractable.forEach(r => {
    console.log(`  ${r.field.padEnd(35)} → ${r.extractionLocation || 'WordPress'}`)
  })

  console.log(`\n⚠️  MISSING - MANUAL ENTRY (${missingManual.length} fields):`)
  missingManual.forEach(r => console.log(`  ${r.field}`))

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 SUMMARY FOR LAWYER FORM:')
  console.log(`  Total fields: ${lawyerFields.length}`)
  console.log(`  Has data: ${hasData.length}`)
  console.log(`  Missing (extractable): ${missingExtractable.length}`)
  console.log(`  Missing (manual): ${missingManual.length}`)
  console.log(`  Completion: ${((hasData.length / lawyerFields.length) * 100).toFixed(1)}%`)

  console.log('\n' + '='.repeat(80))
  console.log('\n💡 NEXT STEPS:')
  if (missingExtractable.length > 0) {
    console.log(`\n1. Fix extraction for ${missingExtractable.length} fields:`)
    missingExtractable.forEach(r => {
      console.log(`   - ${r.field}: ${r.extractionLocation}`)
    })
  }
  if (missingManual.length > 0) {
    console.log(`\n2. Add manual entry UI/instructions for ${missingManual.length} fields`)
  }
  console.log('\n')
}

systematicCheck().catch(console.error)

