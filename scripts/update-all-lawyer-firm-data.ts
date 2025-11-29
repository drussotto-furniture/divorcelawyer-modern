/**
 * Comprehensive script to extract and update ALL data from lawyers.json and law_firms.json
 * 
 * Extracts:
 * - Practice areas/specializations
 * - Bio/description
 * - Contact info (phone, email)
 * - Years of experience
 * - Education, awards, bar admissions, publications, professional memberships (from highlights)
 * - Practice areas for law firms
 * - Description for law firms
 * 
 * Usage: npx tsx scripts/update-all-lawyer-firm-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials.')
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface LawyerData {
  title: string
  post_name: string
  content: string
  excerpt?: string
  meta?: any
}

interface LawFirmData {
  title: string
  post_name: string
  content: string
  excerpt?: string
  meta?: any
}

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

function extractPracticeAreas(content: string): string[] {
  const practiceAreas: string[] = []
  const regex = /"practice_areas_tags_\d+_tag_name":"([^"]+)"/g
  let match
  
  while ((match = regex.exec(content)) !== null) {
    const area = match[1].trim()
    if (area && !practiceAreas.includes(area)) {
      practiceAreas.push(area)
    }
  }
  
  return practiceAreas
}

function extractBio(content: string): string | null {
  // Extract from intro section's short_description
  // The JSON is embedded in HTML comments, so we need to parse it carefully
  
  // Find the intro block - match across newlines
  const introBlockRegex = /<!-- wp:acf\/intro[^>]*>[\s\S]*?"short_description":"((?:[^"\\]|\\.|\\u[0-9a-fA-F]{4})*)"/
  const introBlockMatch = content.match(introBlockRegex)
  
  if (!introBlockMatch || !introBlockMatch[1]) {
    return null
  }
  
  // Unescape the JSON string value
  let bio = introBlockMatch[1]
    // Handle unicode escapes (e.g., \u003c becomes <, \u003e becomes >)
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    // Handle escaped quotes
    .replace(/\\"/g, '"')
    // Handle newlines
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    // Handle escaped backslashes (must be last)
    .replace(/\\\\/g, '\\')
    .trim()
  
  // Remove HTML tags and entities
  bio = bio
    .replace(/<[^>]*>/g, '') // Remove HTML tags like <span>
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
  
  // Clean up whitespace - preserve paragraph breaks but normalize
  bio = bio
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .replace(/[ \t]+/g, ' ') // Normalize spaces
    .replace(/ \n/g, '\n') // Remove trailing spaces before newlines
    .replace(/\n /g, '\n') // Remove leading spaces after newlines
    .trim()
  
  if (bio.length > 0) {
    return bio
  }
  
  return null
}

function extractPhone(content: string): string | null {
  const match = content.match(/"phone_number":"([^"]+)"/)
  return match ? match[1].trim() : null
}

function extractYearsExperience(content: string): number | null {
  const match = content.match(/"firm_year_experience":"(\d+)"/)
  return match ? parseInt(match[1], 10) : null
}

function extractFromHighlights(content: string, heading: string): string[] {
  const items: string[] = []
  
  // Find the highlights section with the matching heading
  const headingRegex = new RegExp(`"hightlights_List_\\d+_heading":"([^"]*${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"]*)",[^}]*"hightlights_List_\\d+_description":"([^"]*(?:\\\\.[^"]*)*)"`, 'i')
  const match = content.match(headingRegex)
  
  if (match) {
    let description = match[2]
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\"/g, '"')
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    
    // Extract list items from HTML
    const listItemRegex = /<li[^>]*>(.*?)<\/li>/gi
    let listMatch
    
    while ((listMatch = listItemRegex.exec(description)) !== null) {
      const item = listMatch[1]
        .replace(/<[^>]*>/g, '')
        .trim()
      if (item) {
        items.push(item)
      }
    }
  }
  
  return items
}

function extractBarAdmissions(content: string): string[] {
  // Look for "Bar Admission" or "Bar Admissions" heading
  const admissions = extractFromHighlights(content, 'Bar Admission')
  if (admissions.length === 0) {
    return extractFromHighlights(content, 'Bar Admissions')
  }
  return admissions
}

function extractAwards(content: string): string[] {
  return extractFromHighlights(content, 'Award')
}

function extractEducation(content: string): string[] {
  return extractFromHighlights(content, 'Education')
}

function extractPublications(content: string): string[] {
  // Look for "Publications" or "Lectures and Publications"
  const pubs = extractFromHighlights(content, 'Publications')
  if (pubs.length === 0) {
    return extractFromHighlights(content, 'Lectures and Publications')
  }
  return pubs
}

function extractProfessionalMemberships(content: string): string[] {
  // Look for "Membership" or "Association Membership"
  const memberships = extractFromHighlights(content, 'Membership')
  if (memberships.length === 0) {
    return extractFromHighlights(content, 'Association Membership')
  }
  return memberships
}

function extractLeadershipRoles(content: string): string[] {
  return extractFromHighlights(content, 'Leadership')
}

// ============================================================================
// UPDATE FUNCTIONS
// ============================================================================

async function updateAllLawyers() {
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
    console.log(`\n👤 Processing: ${lawyer.title} (${lawyer.post_name})`)
    
    // Extract all data
    const practiceAreas = extractPracticeAreas(lawyer.content)
    const bio = extractBio(lawyer.content)
    const phone = extractPhone(lawyer.content)
    const yearsExperience = extractYearsExperience(lawyer.content)
    const barAdmissions = extractBarAdmissions(lawyer.content)
    const awards = extractAwards(lawyer.content)
    const education = extractEducation(lawyer.content)
    const publications = extractPublications(lawyer.content)
    const professionalMemberships = extractProfessionalMemberships(lawyer.content)
    const leadershipRoles = extractLeadershipRoles(lawyer.content)
    
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
    
    // Build update object
    const updateData: any = {}
    
    if (practiceAreas.length > 0) {
      updateData.specializations = practiceAreas
      console.log(`   ✓ Specializations: ${practiceAreas.length} found`)
    }
    
    if (bio) {
      updateData.bio = bio
      console.log(`   ✓ Bio extracted (${bio.length} chars)`)
    }
    
    if (phone) {
      updateData.phone = phone
      console.log(`   ✓ Phone: ${phone}`)
    }
    
    if (yearsExperience) {
      updateData.years_experience = yearsExperience
      console.log(`   ✓ Years Experience: ${yearsExperience}`)
    }
    
    if (barAdmissions.length > 0) {
      updateData.bar_admissions = barAdmissions
      console.log(`   ✓ Bar Admissions: ${barAdmissions.length} found`)
    }
    
    if (awards.length > 0) {
      updateData.awards = awards
      console.log(`   ✓ Awards: ${awards.length} found`)
    }
    
    if (education.length > 0) {
      updateData.education = education
      console.log(`   ✓ Education: ${education.length} found`)
    }
    
    if (publications.length > 0) {
      updateData.publications = publications
      console.log(`   ✓ Publications: ${publications.length} found`)
    }
    
    if (professionalMemberships.length > 0) {
      updateData.professional_memberships = professionalMemberships
      console.log(`   ✓ Professional Memberships: ${professionalMemberships.length} found`)
    }
    
    if (Object.keys(updateData).length === 0) {
      console.log(`   ⚠️  No data to update`)
      continue
    }
    
    // Update database
    const { error: updateError } = await supabase
      .from('lawyers')
      .update(updateData)
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
  console.log('📊 LAWYERS UPDATE SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Updated: ${updated}`)
  console.log(`⚠️  Not found: ${notFound}`)
  console.log(`❌ Errors: ${errors}`)
  console.log('='.repeat(50))
  
  return { updated, notFound, errors }
}

async function updateAllLawFirms() {
  console.log('\n📖 Reading law_firms.json...')
  const firmsFile = path.join(process.cwd(), 'output', 'law_firms.json')
  
  if (!fs.existsSync(firmsFile)) {
    console.error(`❌ File not found: ${firmsFile}`)
    return { updated: 0, notFound: 0, errors: 0 }
  }
  
  const firms: LawFirmData[] = JSON.parse(fs.readFileSync(firmsFile, 'utf-8'))
  console.log(`✓ Found ${firms.length} law firms in JSON\n`)
  
  let updated = 0
  let notFound = 0
  let errors = 0
  
  for (const firm of firms) {
    console.log(`\n🏢 Processing: ${firm.title} (${firm.post_name})`)
    
    // Extract all data
    const practiceAreas = extractPracticeAreas(firm.content)
    const description = extractBio(firm.content)
    const phone = extractPhone(firm.content)
    
    // Find firm by slug
    const { data: existingFirm, error: fetchError } = await supabase
      .from('law_firms')
      .select('id, name, slug')
      .eq('slug', firm.post_name)
      .single()
    
    if (fetchError || !existingFirm) {
      console.log(`   ❌ Not found in database (slug: ${firm.post_name})`)
      notFound++
      continue
    }
    
    // Build update object
    const updateData: any = {}
    
    if (practiceAreas.length > 0) {
      updateData.practice_areas = practiceAreas
      console.log(`   ✓ Practice Areas: ${practiceAreas.length} found`)
    }
    
    if (description) {
      updateData.description = description
      console.log(`   ✓ Description extracted (${description.length} chars)`)
    }
    
    if (phone) {
      updateData.phone = phone
      console.log(`   ✓ Phone: ${phone}`)
    }
    
    if (Object.keys(updateData).length === 0) {
      console.log(`   ⚠️  No data to update`)
      continue
    }
    
    // Update database
    const { error: updateError } = await supabase
      .from('law_firms')
      .update(updateData)
      .eq('id', existingFirm.id)
    
    if (updateError) {
      console.log(`   ❌ Error updating: ${updateError.message}`)
      errors++
    } else {
      console.log(`   ✅ Updated successfully`)
      updated++
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 LAW FIRMS UPDATE SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Updated: ${updated}`)
  console.log(`⚠️  Not found: ${notFound}`)
  console.log(`❌ Errors: ${errors}`)
  console.log('='.repeat(50))
  
  return { updated, notFound, errors }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🚀 Starting comprehensive data update...\n')
  console.log(`Supabase URL: ${supabaseUrl}\n`)
  
  try {
    // Update lawyers
    const lawyerStats = await updateAllLawyers()
    
    // Update law firms
    const firmStats = await updateAllLawFirms()
    
    // Final summary
    console.log('\n' + '='.repeat(50))
    console.log('🎉 FINAL SUMMARY')
    console.log('='.repeat(50))
    console.log(`Lawyers: ${lawyerStats.updated} updated, ${lawyerStats.notFound} not found, ${lawyerStats.errors} errors`)
    console.log(`Law Firms: ${firmStats.updated} updated, ${firmStats.notFound} not found, ${firmStats.errors} errors`)
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
main().catch(console.error)

