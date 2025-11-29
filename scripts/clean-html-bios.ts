/**
 * Script to clean existing HTML/Gutenberg block content from bio fields
 * 
 * This removes any Gutenberg block markup and HTML from existing bio fields
 * and replaces them with plain text.
 * 
 * Usage: npx tsx scripts/clean-html-bios.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

function cleanHtmlContent(text: string): string {
  if (!text) return ''
  
  // Remove Gutenberg block comments
  let cleaned = text.replace(/<!-- wp:[^>]*-->[\s\S]*?<!-- \/wp:[^>]*-->/g, '')
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '')
  
  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
  
  // Normalize whitespace
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .trim()
  
  return cleaned
}

async function cleanBios() {
  console.log('🧹 Cleaning HTML/Gutenberg content from bios...\n')
  
  // Get all lawyers with bio content
  const { data: lawyers, error: fetchError } = await supabase
    .from('lawyers')
    .select('id, first_name, last_name, bio')
  
  if (fetchError) {
    console.error('❌ Error fetching lawyers:', fetchError.message)
    process.exit(1)
  }
  
  if (!lawyers || lawyers.length === 0) {
    console.log('⚠️  No lawyers found')
    return
  }
  
  console.log(`Found ${lawyers.length} lawyers\n`)
  
  let cleaned = 0
  let skipped = 0
  let errors = 0
  
  for (const lawyer of lawyers) {
    if (!lawyer.bio) {
      skipped++
      continue
    }
    
    // Check if bio contains HTML/Gutenberg blocks
    const hasHtml = lawyer.bio.includes('<!--') || lawyer.bio.includes('<') || lawyer.bio.includes('&nbsp;')
    
    if (!hasHtml) {
      skipped++
      continue
    }
    
    console.log(`Cleaning: ${lawyer.first_name} ${lawyer.last_name}`)
    
    const cleanedBio = cleanHtmlContent(lawyer.bio)
    
    if (cleanedBio.length === 0) {
      console.log(`  ⚠️  Bio became empty after cleaning, skipping`)
      skipped++
      continue
    }
    
    const { error: updateError } = await supabase
      .from('lawyers')
      .update({ bio: cleanedBio })
      .eq('id', lawyer.id)
    
    if (updateError) {
      console.log(`  ❌ Error: ${updateError.message}`)
      errors++
    } else {
      console.log(`  ✅ Cleaned (${lawyer.bio.length} → ${cleanedBio.length} chars)`)
      cleaned++
    }
  }
  
  // Do the same for law firms
  console.log('\n🧹 Cleaning law firm descriptions...\n')
  
  const { data: firms, error: firmFetchError } = await supabase
    .from('law_firms')
    .select('id, name, description')
  
  if (!firmFetchError && firms) {
    for (const firm of firms) {
      if (!firm.description) continue
      
      const hasHtml = firm.description.includes('<!--') || firm.description.includes('<') || firm.description.includes('&nbsp;')
      
      if (!hasHtml) continue
      
      console.log(`Cleaning: ${firm.name}`)
      
      const cleanedDesc = cleanHtmlContent(firm.description)
      
      if (cleanedDesc.length === 0) continue
      
      const { error: updateError } = await supabase
        .from('law_firms')
        .update({ description: cleanedDesc })
        .eq('id', firm.id)
      
      if (updateError) {
        console.log(`  ❌ Error: ${updateError.message}`)
      } else {
        console.log(`  ✅ Cleaned`)
        cleaned++
      }
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 CLEANUP SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Cleaned: ${cleaned}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Errors: ${errors}`)
  console.log('='.repeat(50))
}

cleanBios().catch(console.error)

