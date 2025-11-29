/**
 * Comprehensive Data Check and Update Script
 * 
 * This script systematically checks all content types and updates missing data
 * from the WordPress JSON exports to the Supabase database.
 * 
 * Usage: npm run check-and-update-all-data
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const outputDir = path.join(process.cwd(), 'output')

interface UpdateStats {
  checked: number
  updated: number
  skipped: number
  errors: number
  missing: number
}

class DataChecker {
  private stats: Record<string, UpdateStats> = {}
  private tableCache: Set<string> = new Set()

  /**
   * Check if a table exists in the database
   */
  private async tableExists(tableName: string): Promise<boolean> {
    if (this.tableCache.has(tableName)) {
      return true
    }

    try {
      // Try a simple query to see if table exists
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0)
      
      if (error) {
        // Check if error is about table not existing
        if (error.message.includes('does not exist') || 
            error.message.includes('Could not find the table') ||
            error.message.includes('relation') && error.message.includes('does not exist')) {
          return false
        }
        // Other errors might mean table exists but has other issues
        // For now, assume it exists if error is not about missing table
        return true
      }
      
      this.tableCache.add(tableName)
      return true
    } catch (error: any) {
      if (error.message?.includes('does not exist') || 
          error.message?.includes('Could not find the table')) {
        return false
      }
      // Assume it exists if we can't determine
      return true
    }
  }

  /**
   * Extract plain text from Gutenberg block JSON
   */
  private extractPlainTextFromGutenberg(content: string): string {
    if (!content || typeof content !== 'string') return ''
    
    try {
      // Try to parse as JSON first (Gutenberg blocks)
      const parsed = JSON.parse(content)
      if (typeof parsed === 'object') {
        // Recursively extract text from Gutenberg blocks
        const extractText = (obj: any): string => {
          if (typeof obj === 'string') return obj
          if (Array.isArray(obj)) return obj.map(extractText).join(' ')
          if (obj && typeof obj === 'object') {
            return Object.values(obj).map(extractText).join(' ')
          }
          return ''
        }
        return extractText(parsed).replace(/\s+/g, ' ').trim()
      }
    } catch {
      // Not JSON, treat as HTML/text
    }
    
    // Remove HTML tags and Gutenberg comments
    return content
      .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/wp:acf\/[^\s"']+/g, '') // Remove Gutenberg block names
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * Extract practice areas from content
   */
  private extractPracticeAreas(content: string): string[] {
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

  /**
   * Extract phone from content
   */
  private extractPhone(content: string): string | null {
    const match = content.match(/"phone_number":"([^"]+)"/)
    return match ? match[1].trim() : null
  }

  /**
   * Extract description from Gutenberg intro block
   */
  private extractDescription(content: string): string | null {
    const introBlockRegex = /<!-- wp:acf\/intro[^>]*>[\s\S]*?"short_description":"((?:[^"\\]|\\.|\\u[0-9a-fA-F]{4})*)"/
    const introBlockMatch = content.match(introBlockRegex)
    
    if (!introBlockMatch || !introBlockMatch[1]) {
      return null
    }
    
    let description = introBlockMatch[1]
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\\\/g, '\\')
      .trim()
    
    description = description
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim()
    
    return description.length > 0 ? description : null
  }

  /**
   * Check and update Law Firms
   */
  async checkLawFirms(): Promise<UpdateStats> {
    console.log('\n🏢 Checking and Updating Law Firms...')
    const stats: UpdateStats = { checked: 0, updated: 0, skipped: 0, errors: 0, missing: 0 }
    
    try {
      const data = JSON.parse(fs.readFileSync(path.join(outputDir, 'law_firms.json'), 'utf-8'))
      
      for (const item of data) {
        stats.checked++
        try {
          const { data: existing, error: findError } = await supabase
            .from('law_firms')
            .select('*')
            .eq('slug', item.post_name)
            .single()

          if (findError || !existing) {
            console.log(`⚠️  Firm not found: ${item.title}`)
            stats.missing++
            continue
          }

          const updates: any = {}
          const content = item.content || ''
          
          // Extract and update description (handle null, empty string, or missing)
          const hasDescription = existing.description && existing.description.trim() !== ''
          if (!hasDescription) {
            const description = this.extractDescription(content)
            if (description) {
              updates.description = description
              console.log(`   → Will update description (${description.length} chars)`)
            }
          }
          
          // Extract and update phone (handle null, empty string, or missing)
          const hasPhone = existing.phone && existing.phone.trim() !== ''
          if (!hasPhone) {
            const phone = this.extractPhone(content)
            if (phone) {
              updates.phone = phone
              console.log(`   → Will update phone: ${phone}`)
            }
          }
          
          // Extract and update practice areas (handle null, empty array, or missing)
          const hasPracticeAreas = existing.practice_areas && Array.isArray(existing.practice_areas) && existing.practice_areas.length > 0
          if (!hasPracticeAreas) {
            const practiceAreas = this.extractPracticeAreas(content)
            if (practiceAreas.length > 0) {
              updates.practice_areas = practiceAreas
              console.log(`   → Will update practice_areas: ${practiceAreas.length} items`)
            }
          }
          
          // Extract and update linkedin_url, facebook_url, twitter_url if missing
          // These are typically not in WordPress content, but check anyway
          if (!existing.linkedin_url) {
            // Could extract from content if available, but usually not present
          }
          if (!existing.facebook_url) {
            // Could extract from content if available, but usually not present
          }
          if (!existing.twitter_url) {
            // Could extract from content if available, but usually not present
          }
          
          // Extract and update founded_year if missing
          if (!existing.founded_year) {
            // Try to extract from content - look for year patterns
            const yearMatch = content.match(/(?:founded|established|since)[\s:]*(\d{4})/i)
            if (yearMatch && yearMatch[1]) {
              const year = parseInt(yearMatch[1], 10)
              if (year > 1800 && year <= new Date().getFullYear()) {
                updates.founded_year = year
                console.log(`   → Will update founded_year: ${year}`)
              }
            }
          }
          
          // Extract and update firm_size if missing
          if (!existing.firm_size) {
            // Usually not in WordPress content - manual entry required
          }
          
          // Extract and update meta_title (handle null, empty string, or missing)
          if (existing.hasOwnProperty('meta_title')) {
            const hasMetaTitle = existing.meta_title && existing.meta_title.trim() !== ''
            if (!hasMetaTitle) {
              // Extract from WordPress title
              const wpTitle = item.title?.rendered || item.title
              if (wpTitle && typeof wpTitle === 'string' && wpTitle.trim()) {
                updates.meta_title = wpTitle.trim()
                console.log(`   → Will update meta_title: ${updates.meta_title.substring(0, 50)}...`)
              }
            }
          }
          
          // Extract and update meta_description (handle null, empty string, or missing)
          if (existing.hasOwnProperty('meta_description')) {
            const hasMetaDescription = existing.meta_description && existing.meta_description.trim() !== ''
            if (!hasMetaDescription) {
              // Extract from WordPress excerpt
              const wpExcerpt = item.excerpt?.rendered || item.excerpt
              if (wpExcerpt && typeof wpExcerpt === 'string') {
                // Strip HTML tags from excerpt
                const cleanExcerpt = wpExcerpt.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
                if (cleanExcerpt && cleanExcerpt.length > 0) {
                  updates.meta_description = cleanExcerpt.substring(0, 160) // Limit to 160 chars for SEO
                  console.log(`   → Will update meta_description: ${updates.meta_description.substring(0, 50)}...`)
                }
              }
            }
          }

          if (Object.keys(updates).length === 0) {
            stats.skipped++
            continue
          }

          const { error: updateError } = await supabase
            .from('law_firms')
            .update(updates)
            .eq('id', existing.id)

          if (updateError) {
            console.error(`❌ Error updating ${item.title}:`, updateError.message)
            stats.errors++
          } else {
            console.log(`✓ Updated ${item.title}: ${Object.keys(updates).join(', ')}`)
            stats.updated++
          }
        } catch (error) {
          console.error(`❌ Error processing ${item.title}:`, error)
          stats.errors++
        }
      }
    } catch (error) {
      console.error('❌ Error reading law_firms.json:', error)
    }

    this.stats['law_firms'] = stats
    return stats
  }

  /**
   * Extract bio from content (same as description extraction)
   */
  private extractBio(content: string): string | null {
    return this.extractDescription(content)
  }

  /**
   * Extract years of experience
   */
  private extractYearsExperience(content: string): number | null {
    const match = content.match(/"firm_year_experience":"(\d+)"/)
    return match ? parseInt(match[1], 10) : null
  }

  /**
   * Extract items from highlights section
   * Handles headings with HTML tags (e.g., "Bar <span>Admission</span>" becomes "Bar \\u003cspan\\u003eAdmission\\u003c/span\\u003e" in JSON)
   * Uses a simpler approach: find all highlight sections, then match by key words in heading
   */
  private extractFromHighlights(content: string, heading: string): string[] {
    const items: string[] = []
    // Extract key words from the heading (ignore HTML tags like <span>)
    const keyWords = heading.split(/\s+/).filter(w => w.length > 0 && !w.match(/^<|>$/))
    
    if (keyWords.length === 0) return items
    
    // Find all highlight sections - match heading and description pairs
    const highlightRegex = /"hightlights_List_(\d+)_heading":"([^"]+)"/g
    const allMatches: Array<{index: string, heading: string}> = []
    let match
    
    // First, collect all headings with their indices
    while ((match = highlightRegex.exec(content)) !== null) {
      allMatches.push({ index: match[1], heading: match[2] })
    }
    
    // Now find the matching heading and extract its description
    for (const { index, heading: headingText } of allMatches) {
      // Decode the heading: unescape unicode and remove HTML tags
      const headingTextDecoded = headingText
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
        .replace(/<[^>]*>/g, ' ') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .toLowerCase()
      
      // Check if all key words are present in the decoded heading
      const allWordsMatch = keyWords.every(word => 
        headingTextDecoded.includes(word.toLowerCase())
      )
      
      if (allWordsMatch) {
        // Find the corresponding description for this index
        // The description may have escaped characters, so we need a flexible regex
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
          break // Found the matching section, no need to continue
        }
      }
    }
    
    return items
  }

  /**
   * Check and update Lawyers
   */
  async checkLawyers(): Promise<UpdateStats> {
    console.log('\n👨‍⚖️ Checking and Updating Lawyers...')
    const stats: UpdateStats = { checked: 0, updated: 0, skipped: 0, errors: 0, missing: 0 }
    
    try {
      const data = JSON.parse(fs.readFileSync(path.join(outputDir, 'lawyers.json'), 'utf-8'))
      
      for (const item of data) {
        stats.checked++
        try {
          const { data: existing, error: findError } = await supabase
            .from('lawyers')
            .select('*')
            .eq('slug', item.post_name)
            .single()

          if (findError || !existing) {
            console.log(`⚠️  Lawyer not found: ${item.title}`)
            stats.missing++
            continue
          }

          const updates: any = {}
          const content = item.content || ''
          
          // Extract and update bio (handle null, empty string, or missing)
          const hasBio = existing.bio && existing.bio.trim() !== ''
          if (!hasBio) {
            const bio = this.extractBio(content)
            if (bio) {
              updates.bio = bio
              console.log(`   → Will update bio (${bio.length} chars)`)
            }
          }
          
          // Extract and update phone (handle null, empty string, or missing)
          const hasPhone = existing.phone && existing.phone.trim() !== ''
          if (!hasPhone) {
            const phone = this.extractPhone(content)
            if (phone) {
              updates.phone = phone
              console.log(`   → Will update phone: ${phone}`)
            }
          }
          
          // Extract and update years_experience (handle null or missing)
          if (!existing.years_experience) {
            const years = this.extractYearsExperience(content)
            if (years) {
              updates.years_experience = years
              console.log(`   → Will update years_experience: ${years}`)
            }
          }
          
          // Extract and update title (handle null, empty string, or missing)
          const hasTitle = existing.title && existing.title.trim() !== ''
          if (!hasTitle) {
            // Extract from title_tagline in hero block
            const titleMatch = content.match(/"title_tagline":"([^"]+)"/)
            if (titleMatch && titleMatch[1]) {
              updates.title = titleMatch[1].trim()
              console.log(`   → Will update title: ${updates.title}`)
            }
          }
          
          // Extract and update languages (handle null, empty array, or missing)
          const hasLanguages = existing.languages && Array.isArray(existing.languages) && existing.languages.length > 0
          if (!hasLanguages) {
            // Extract from firms_language in hero block
            const langMatch = content.match(/"firms_language":"([^"]+)"/)
            if (langMatch && langMatch[1]) {
              const language = langMatch[1].trim()
              if (language) {
                updates.languages = [language]
                console.log(`   → Will update languages: ${language}`)
              }
            }
          }
          
          // Extract and update office_address (handle null, empty string, or missing)
          const hasOfficeAddress = existing.office_address && existing.office_address.trim() !== ''
          if (!hasOfficeAddress) {
            // Extract from locations block - get first physical address
            // Note: The field name is "physicial_address" (typo in WordPress)
            const addressMatch = content.match(/"physicial_address":"([^"]+)"/)
            if (addressMatch && addressMatch[1]) {
              const address = addressMatch[1].trim()
              if (address) {
                updates.office_address = address
                console.log(`   → Will update office_address: ${address.substring(0, 50)}...`)
              }
            }
          }
          
          // Extract and update meta_title (handle null, empty string, or missing)
          // Note: This column may not exist in all databases
          if (existing.hasOwnProperty('meta_title')) {
            const hasMetaTitle = existing.meta_title && existing.meta_title.trim() !== ''
            if (!hasMetaTitle) {
              // Extract from WordPress title
              const wpTitle = item.title?.rendered || item.title
              if (wpTitle && typeof wpTitle === 'string' && wpTitle.trim()) {
                updates.meta_title = wpTitle.trim()
                console.log(`   → Will update meta_title: ${updates.meta_title.substring(0, 50)}...`)
              }
            }
          }
          
          // Extract and update meta_description (handle null, empty string, or missing)
          // Note: This column may not exist in all databases
          if (existing.hasOwnProperty('meta_description')) {
            const hasMetaDescription = existing.meta_description && existing.meta_description.trim() !== ''
            if (!hasMetaDescription) {
              // Extract from WordPress excerpt
              const wpExcerpt = item.excerpt?.rendered || item.excerpt
              if (wpExcerpt && typeof wpExcerpt === 'string') {
                // Strip HTML tags from excerpt
                const cleanExcerpt = wpExcerpt.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
                if (cleanExcerpt && cleanExcerpt.length > 0) {
                  updates.meta_description = cleanExcerpt.substring(0, 160) // Limit to 160 chars for SEO
                  console.log(`   → Will update meta_description: ${updates.meta_description.substring(0, 50)}...`)
                }
              }
            }
          }
          
          // Extract and update linkedin_url, twitter_url if missing (usually not in content)
          // These would need to be manually added or extracted from a different source
          
          // Extract and update practice_focus from intro block short_description
          const hasPracticeFocus = existing.practice_focus && existing.practice_focus.trim() !== ''
          if (!hasPracticeFocus) {
            // Extract from intro block short_description
            const introMatch = content.match(/"short_description":"([^"]+)"/)
            if (introMatch && introMatch[1]) {
              let practiceFocus = introMatch[1]
                .replace(/\\u003c/g, '<')
                .replace(/\\u003e/g, '>')
                .replace(/\\r\\n/g, ' ')
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .trim()
              if (practiceFocus && practiceFocus.length > 20) {
                updates.practice_focus = practiceFocus
                console.log(`   → Will update practice_focus: ${practiceFocus.substring(0, 50)}...`)
              }
            }
          }
          
          // Extract and update approach from quote block
          const hasApproach = existing.approach && existing.approach.trim() !== ''
          if (!hasApproach) {
            // Extract from quote block add_quote
            const quoteMatch = content.match(/"add_quote":"([^"]+)"/)
            if (quoteMatch && quoteMatch[1]) {
              let approach = quoteMatch[1]
                .replace(/\\u003c/g, '<')
                .replace(/\\u003e/g, '>')
                .replace(/\\r\\n/g, ' ')
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .trim()
              if (approach && approach.length > 10) {
                updates.approach = approach
                console.log(`   → Will update approach: ${approach.substring(0, 50)}...`)
              }
            }
          }
          
          // Extract and update consultation_fee, office_hours if missing
          // These would need to be manually added or extracted from a different source
          
          // Extract and update credentials_summary if missing (usually not in content)
          // This would need to be manually added or extracted from a different source
          
          // Extract and update specializations (handle null, empty array, or missing)
          const hasSpecializations = existing.specializations && Array.isArray(existing.specializations) && existing.specializations.length > 0
          if (!hasSpecializations) {
            const specializations = this.extractPracticeAreas(content)
            if (specializations.length > 0) {
              updates.specializations = specializations
              console.log(`   → Will update specializations: ${specializations.length} items`)
            }
          }
          
          // Extract and update bar_admissions (handle null, empty array, or missing)
          const hasBarAdmissions = existing.bar_admissions && Array.isArray(existing.bar_admissions) && existing.bar_admissions.length > 0
          if (!hasBarAdmissions) {
            // Try different variations (the heading is "Bar <span>Admission</span>")
            let admissions = this.extractFromHighlights(content, 'Bar Admission')
            if (admissions.length === 0) {
              admissions = this.extractFromHighlights(content, 'Bar Admissions')
            }
            if (admissions.length > 0) {
              updates.bar_admissions = admissions
              console.log(`   → Will update bar_admissions: ${admissions.length} items`)
            }
          }
          
          // Extract and update awards (handle null, empty array, or missing)
          const hasAwards = existing.awards && Array.isArray(existing.awards) && existing.awards.length > 0
          if (!hasAwards) {
            // The heading is "Awards <span></span>"
            const awards = this.extractFromHighlights(content, 'Awards')
            if (awards.length > 0) {
              updates.awards = awards
              console.log(`   → Will update awards: ${awards.length} items`)
            }
          }
          
          // Extract and update education (handle null, empty array, or missing)
          const hasEducation = existing.education && Array.isArray(existing.education) && existing.education.length > 0
          if (!hasEducation) {
            // Try different variations of education headings
            let education = this.extractFromHighlights(content, 'Education & License')
            if (education.length === 0) {
              education = this.extractFromHighlights(content, 'Education')
            }
            if (education.length === 0) {
              education = this.extractFromHighlights(content, 'Educational Background')
            }
            if (education.length > 0) {
              updates.education = education
              console.log(`   → Will update education: ${education.length} items`)
            }
          }
          
          // Extract and update publications (handle null, empty array, or missing)
          const hasPublications = existing.publications && Array.isArray(existing.publications) && existing.publications.length > 0
          if (!hasPublications) {
            // The heading is "Publications and <span>Presentations</span>"
            let publications = this.extractFromHighlights(content, 'Publications and Presentations')
            if (publications.length === 0) {
              publications = this.extractFromHighlights(content, 'Publications')
            }
            if (publications.length > 0) {
              updates.publications = publications
              console.log(`   → Will update publications: ${publications.length} items`)
            }
          }
          
          // Extract and update professional_memberships (handle null, empty array, or missing)
          const hasMemberships = existing.professional_memberships && Array.isArray(existing.professional_memberships) && existing.professional_memberships.length > 0
          if (!hasMemberships) {
            // The heading is "Leadership <span>Roles</span>"
            let memberships = this.extractFromHighlights(content, 'Leadership Roles')
            if (memberships.length === 0) {
              memberships = this.extractFromHighlights(content, 'Leadership')
            }
            if (memberships.length > 0) {
              updates.professional_memberships = memberships
              console.log(`   → Will update professional_memberships: ${memberships.length} items`)
            }
          }
          
          // Extract and update certifications (handle null, empty array, or missing)
          const hasCertifications = existing.certifications && Array.isArray(existing.certifications) && existing.certifications.length > 0
          if (!hasCertifications) {
            const certifications = this.extractFromHighlights(content, 'Certification')
            if (certifications.length === 0) {
              const altCerts = this.extractFromHighlights(content, 'Certifications')
              if (altCerts.length > 0) {
                updates.certifications = altCerts
                console.log(`   → Will update certifications: ${altCerts.length} items`)
              }
            } else {
              updates.certifications = certifications
              console.log(`   → Will update certifications: ${certifications.length} items`)
            }
          }
          
          // Extract and update media_mentions (handle null, empty array, or missing)
          const hasMediaMentions = existing.media_mentions && Array.isArray(existing.media_mentions) && existing.media_mentions.length > 0
          if (!hasMediaMentions) {
            const mediaMentions = this.extractFromHighlights(content, 'Media')
            if (mediaMentions.length === 0) {
              const altMedia = this.extractFromHighlights(content, 'Media Mentions')
              if (altMedia.length > 0) {
                updates.media_mentions = altMedia
                console.log(`   → Will update media_mentions: ${altMedia.length} items`)
              }
            } else {
              updates.media_mentions = mediaMentions
              console.log(`   → Will update media_mentions: ${mediaMentions.length} items`)
            }
          }
          
          // Extract and update speaking_engagements (handle null, empty array, or missing)
          const hasSpeakingEngagements = existing.speaking_engagements && Array.isArray(existing.speaking_engagements) && existing.speaking_engagements.length > 0
          if (!hasSpeakingEngagements) {
            const speakingEngagements = this.extractFromHighlights(content, 'Speaking')
            if (speakingEngagements.length === 0) {
              const altSpeaking = this.extractFromHighlights(content, 'Speaking Engagements')
              if (altSpeaking.length > 0) {
                updates.speaking_engagements = altSpeaking
                console.log(`   → Will update speaking_engagements: ${altSpeaking.length} items`)
              }
            } else {
              updates.speaking_engagements = speakingEngagements
              console.log(`   → Will update speaking_engagements: ${speakingEngagements.length} items`)
            }
          }
          
          // Extract and update bar_number if missing
          if (existing.hasOwnProperty('bar_number')) {
            const hasBarNumber = existing.bar_number && existing.bar_number.trim() !== ''
            if (!hasBarNumber) {
              // Try to extract from various locations
              // Check for direct field
              const barNumberMatch = content.match(/"bar[_ ]number":\s*"([^"]+)"/i)
              if (barNumberMatch && barNumberMatch[1]) {
                updates.bar_number = barNumberMatch[1].trim()
                console.log(`   → Will update bar_number: ${updates.bar_number}`)
              } else {
                // Check in meta fields
                const metaBarMatch = content.match(/"bar[_ ]number[_\"]*:\s*"([^"]+)"/i)
                if (metaBarMatch && metaBarMatch[1]) {
                  updates.bar_number = metaBarMatch[1].trim()
                  console.log(`   → Will update bar_number: ${updates.bar_number}`)
                }
                // Note: Bar number might also be in bar_admissions text, but that's harder to extract reliably
              }
            }
          }

          if (Object.keys(updates).length === 0) {
            stats.skipped++
            continue
          }

          const { error: updateError } = await supabase
            .from('lawyers')
            .update(updates)
            .eq('id', existing.id)

          if (updateError) {
            console.error(`❌ Error updating ${item.title}:`, updateError.message)
            stats.errors++
          } else {
            console.log(`✓ Updated ${item.title}: ${Object.keys(updates).join(', ')}`)
            stats.updated++
          }
        } catch (error) {
          console.error(`❌ Error processing ${item.title}:`, error)
          stats.errors++
        }
      }
    } catch (error) {
      console.error('❌ Error reading lawyers.json:', error)
    }

    this.stats['lawyers'] = stats
    return stats
  }

  /**
   * Check and update Articles
   */
  async checkArticles(): Promise<UpdateStats> {
    console.log('\n📝 Checking and Updating Articles...')
    const stats: UpdateStats = { checked: 0, updated: 0, skipped: 0, errors: 0, missing: 0 }
    
    try {
      const data = JSON.parse(fs.readFileSync(path.join(outputDir, 'articles.json'), 'utf-8'))
      
      for (const item of data) {
        stats.checked++
        try {
          const { data: existing, error: findError } = await supabase
            .from('articles')
            .select('*')
            .eq('slug', item.post_name)
            .single()

          if (findError || !existing) {
            console.log(`⚠️  Article not found: ${item.title}`)
            stats.missing++
            continue
          }

          const updates: any = {}
          
          // Update excerpt if missing
          if (!existing.excerpt || existing.excerpt.trim() === '') {
            const excerpt = item.excerpt?.rendered || item.excerpt
            if (excerpt && typeof excerpt === 'string' && excerpt.trim()) {
              // Strip HTML tags from excerpt
              const cleanExcerpt = excerpt.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
              if (cleanExcerpt) updates.excerpt = cleanExcerpt
            }
          }
          
          // Update content if missing
          if (!existing.content || existing.content.trim() === '') {
            if (item.content && item.content.trim()) {
              // Clean up content - remove Gutenberg comments but keep HTML
              let content = item.content
                .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
                .trim()
              if (content) updates.content = content
            }
          }
          
          // Update meta_title if missing
          if (existing.hasOwnProperty('meta_title')) {
            if (!existing.meta_title || existing.meta_title.trim() === '') {
              const wpTitle = item.title?.rendered || item.title
              if (wpTitle && typeof wpTitle === 'string' && wpTitle.trim()) {
                updates.meta_title = wpTitle.trim()
              }
            }
          }
          
          // Update meta_description if missing
          if (existing.hasOwnProperty('meta_description')) {
            if (!existing.meta_description || existing.meta_description.trim() === '') {
              const excerpt = item.excerpt?.rendered || item.excerpt
              if (excerpt && typeof excerpt === 'string') {
                const cleanExcerpt = excerpt.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
                if (cleanExcerpt) {
                  updates.meta_description = cleanExcerpt.substring(0, 160) // Limit to 160 chars for SEO
                }
              }
            }
          }
          
          // Update featured_image_url if missing (from featured_media or featured image)
          if (!existing.featured_image_url || existing.featured_image_url.trim() === '') {
            // Try to extract from featured_media or other image fields
            const featuredMedia = item.featured_media
            if (featuredMedia) {
              // This would need to be resolved from media library
              // For now, we'll skip this as it requires media lookup
            }
          }

          if (Object.keys(updates).length === 0) {
            stats.skipped++
            continue
          }

          const { error: updateError } = await supabase
            .from('articles')
            .update(updates)
            .eq('id', existing.id)

          if (updateError) {
            console.error(`❌ Error updating ${item.title}:`, updateError.message)
            stats.errors++
          } else {
            console.log(`✓ Updated ${item.title}: ${Object.keys(updates).join(', ')}`)
            stats.updated++
          }
        } catch (error) {
          console.error(`❌ Error processing ${item.title}:`, error)
          stats.errors++
        }
      }
    } catch (error) {
      console.error('❌ Error reading articles.json:', error)
    }

    this.stats['articles'] = stats
    return stats
  }

  /**
   * Check and update Videos
   */
  async checkVideos(): Promise<UpdateStats> {
    console.log('\n🎥 Checking and Updating Videos...')
    const stats: UpdateStats = { checked: 0, updated: 0, skipped: 0, errors: 0, missing: 0 }
    
    try {
      const data = JSON.parse(fs.readFileSync(path.join(outputDir, 'videos.json'), 'utf-8'))
      
      for (const item of data) {
        stats.checked++
        try {
          const { data: existing, error: findError } = await supabase
            .from('videos')
            .select('*')
            .eq('slug', item.post_name)
            .single()

          if (findError || !existing) {
            console.log(`⚠️  Video not found: ${item.title}`)
            stats.missing++
            continue
          }

          const updates: any = {}
          
          // Update description if missing
          if (!existing.description || existing.description.trim() === '') {
            const excerpt = item.excerpt?.rendered || item.excerpt
            if (excerpt && typeof excerpt === 'string' && excerpt.trim()) {
              const cleanExcerpt = excerpt.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
              if (cleanExcerpt) updates.description = cleanExcerpt
            }
          }
          
          // Update video_url if missing
          if (!existing.video_url || existing.video_url.trim() === '') {
            if (item.meta?.video_url) {
              updates.video_url = item.meta.video_url
            } else if (item.meta?.video) {
              updates.video_url = item.meta.video
            }
          }
          
          // Update transcript if missing
          if (!existing.transcript || existing.transcript.trim() === '') {
            // Could extract from content if available
            const content = this.extractPlainTextFromGutenberg(item.content || '')
            if (content && content.length > 100) {
              updates.transcript = content
            }
          }
          
          // Update thumbnail_url if missing
          if (!existing.thumbnail_url || existing.thumbnail_url.trim() === '') {
            // Could extract from featured_media if available
            if (item.featured_media_url) {
              updates.thumbnail_url = item.featured_media_url
            }
          }
          
          // Extract video provider and ID if possible
          if (existing.video_url && !existing.video_provider) {
            const url = existing.video_url
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
              updates.video_provider = 'youtube'
              const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
              if (youtubeMatch) updates.video_id = youtubeMatch[1]
            } else if (url.includes('vimeo.com')) {
              updates.video_provider = 'vimeo'
              const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
              if (vimeoMatch) updates.video_id = vimeoMatch[1]
            }
          }

          if (Object.keys(updates).length === 0) {
            stats.skipped++
            continue
          }

          const { error: updateError } = await supabase
            .from('videos')
            .update(updates)
            .eq('id', existing.id)

          if (updateError) {
            console.error(`❌ Error updating ${item.title}:`, updateError.message)
            stats.errors++
          } else {
            console.log(`✓ Updated ${item.title}: ${Object.keys(updates).join(', ')}`)
            stats.updated++
          }
        } catch (error) {
          console.error(`❌ Error processing ${item.title}:`, error)
          stats.errors++
        }
      }
    } catch (error) {
      console.error('❌ Error reading videos.json:', error)
    }

    this.stats['videos'] = stats
    return stats
  }

  /**
   * Check and update Stages
   */
  async checkStages(): Promise<UpdateStats> {
    console.log('\n📋 Checking and Updating Stages...')
    const stats: UpdateStats = { checked: 0, updated: 0, skipped: 0, errors: 0, missing: 0 }
    
    try {
      const data = JSON.parse(fs.readFileSync(path.join(outputDir, 'stages.json'), 'utf-8'))
      
      for (const item of data) {
        stats.checked++
        try {
          const { data: existing, error: findError } = await supabase
            .from('stages')
            .select('*')
            .eq('slug', item.post_name)
            .single()

          if (findError || !existing) {
            console.log(`⚠️  Stage not found: ${item.title}`)
            stats.missing++
            continue
          }

          const updates: any = {}
          
          // Update description if missing
          if (!existing.description || existing.description.trim() === '') {
            const excerpt = item.excerpt?.rendered || item.excerpt
            if (excerpt && typeof excerpt === 'string' && excerpt.trim()) {
              const cleanExcerpt = excerpt.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
              if (cleanExcerpt) updates.description = cleanExcerpt
            }
          }
          
          // Update content if missing - extract plain text from Gutenberg
          if (!existing.content || existing.content.trim() === '') {
            const content = this.extractPlainTextFromGutenberg(item.content || '')
            if (content) updates.content = content
          }
          
          // Update meta_title if missing
          if (existing.hasOwnProperty('meta_title')) {
            if (!existing.meta_title || existing.meta_title.trim() === '') {
              const wpTitle = item.title?.rendered || item.title
              if (wpTitle && typeof wpTitle === 'string' && wpTitle.trim()) {
                updates.meta_title = wpTitle.trim()
              }
            }
          }
          
          // Update meta_description if missing
          if (existing.hasOwnProperty('meta_description')) {
            if (!existing.meta_description || existing.meta_description.trim() === '') {
              const excerpt = item.excerpt?.rendered || item.excerpt
              if (excerpt && typeof excerpt === 'string') {
                const cleanExcerpt = excerpt.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
                if (cleanExcerpt) {
                  updates.meta_description = cleanExcerpt.substring(0, 160)
                }
              }
            }
          }
          
          // Update estimated_duration if missing (for stages)
          if (existing.hasOwnProperty('estimated_duration') && (!existing.estimated_duration || existing.estimated_duration.trim() === '')) {
            // Could extract from content if it mentions duration, but usually manual entry
          }
          
          // Update icon_name if missing (for stages)
          if (existing.hasOwnProperty('icon_name') && (!existing.icon_name || existing.icon_name.trim() === '')) {
            // Usually manual entry, but could try to extract from content
          }

          if (Object.keys(updates).length === 0) {
            stats.skipped++
            continue
          }

          const { error: updateError } = await supabase
            .from('stages')
            .update(updates)
            .eq('id', existing.id)

          if (updateError) {
            console.error(`❌ Error updating ${item.title}:`, updateError.message)
            stats.errors++
          } else {
            console.log(`✓ Updated ${item.title}: ${Object.keys(updates).join(', ')}`)
            stats.updated++
          }
        } catch (error) {
          console.error(`❌ Error processing ${item.title}:`, error)
          stats.errors++
        }
      }
    } catch (error) {
      console.error('❌ Error reading stages.json:', error)
    }

    this.stats['stages'] = stats
    return stats
  }

  /**
   * Check and update Emotions
   */
  async checkEmotions(): Promise<UpdateStats> {
    console.log('\n💭 Checking and Updating Emotions...')
    const stats: UpdateStats = { checked: 0, updated: 0, skipped: 0, errors: 0, missing: 0 }
    
    try {
      const data = JSON.parse(fs.readFileSync(path.join(outputDir, 'emotions.json'), 'utf-8'))
      
      for (const item of data) {
        stats.checked++
        try {
          const { data: existing, error: findError } = await supabase
            .from('emotions')
            .select('*')
            .eq('slug', item.post_name)
            .single()

          if (findError || !existing) {
            console.log(`⚠️  Emotion not found: ${item.title}`)
            stats.missing++
            continue
          }

          const updates: any = {}
          
          // Update description if missing
          if (!existing.description || existing.description.trim() === '') {
            const excerpt = item.excerpt?.rendered || item.excerpt
            if (excerpt && typeof excerpt === 'string' && excerpt.trim()) {
              const cleanExcerpt = excerpt.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
              if (cleanExcerpt) updates.description = cleanExcerpt
            }
          }
          
          // Update content if missing - extract plain text from Gutenberg
          if (!existing.content || existing.content.trim() === '') {
            const content = this.extractPlainTextFromGutenberg(item.content || '')
            if (content) updates.content = content
          }
          
          // Update meta_title if missing
          if (existing.hasOwnProperty('meta_title')) {
            if (!existing.meta_title || existing.meta_title.trim() === '') {
              const wpTitle = item.title?.rendered || item.title
              if (wpTitle && typeof wpTitle === 'string' && wpTitle.trim()) {
                updates.meta_title = wpTitle.trim()
              }
            }
          }
          
          // Update meta_description if missing
          if (existing.hasOwnProperty('meta_description')) {
            if (!existing.meta_description || existing.meta_description.trim() === '') {
              const excerpt = item.excerpt?.rendered || item.excerpt
              if (excerpt && typeof excerpt === 'string') {
                const cleanExcerpt = excerpt.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
                if (cleanExcerpt) {
                  updates.meta_description = cleanExcerpt.substring(0, 160)
                }
              }
            }
          }
          
          // Update icon_name and color_hex if missing (for emotions)
          // These are usually manual entry, but could try to extract from content
          if (existing.hasOwnProperty('icon_name') && (!existing.icon_name || existing.icon_name.trim() === '')) {
            // Usually manual entry
          }
          if (existing.hasOwnProperty('color_hex') && (!existing.color_hex || existing.color_hex.trim() === '')) {
            // Usually manual entry
          }

          if (Object.keys(updates).length === 0) {
            stats.skipped++
            continue
          }

          const { error: updateError } = await supabase
            .from('emotions')
            .update(updates)
            .eq('id', existing.id)

          if (updateError) {
            console.error(`❌ Error updating ${item.title}:`, updateError.message)
            stats.errors++
          } else {
            console.log(`✓ Updated ${item.title}: ${Object.keys(updates).join(', ')}`)
            stats.updated++
          }
        } catch (error) {
          console.error(`❌ Error processing ${item.title}:`, error)
          stats.errors++
        }
      }
    } catch (error) {
      console.error('❌ Error reading emotions.json:', error)
    }

    this.stats['emotions'] = stats
    return stats
  }

  /**
   * Print summary of all checks
   */
  printSummary() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 DATA CHECK SUMMARY')
    console.log('='.repeat(60))
    
    for (const [type, stats] of Object.entries(this.stats)) {
      console.log(`\n${type.toUpperCase()}:`)
      console.log(`  Checked: ${stats.checked}`)
      console.log(`  Updated: ${stats.updated}`)
      console.log(`  Skipped: ${stats.skipped}`)
      console.log(`  Missing: ${stats.missing}`)
      console.log(`  Errors: ${stats.errors}`)
    }
    
    const total = Object.values(this.stats).reduce((acc, s) => ({
      checked: acc.checked + s.checked,
      updated: acc.updated + s.updated,
      skipped: acc.skipped + s.skipped,
      missing: acc.missing + s.missing,
      errors: acc.errors + s.errors,
    }), { checked: 0, updated: 0, skipped: 0, missing: 0, errors: 0 })
    
    console.log('\n' + '='.repeat(60))
    console.log('TOTALS:')
    console.log(`  Checked: ${total.checked}`)
    console.log(`  Updated: ${total.updated}`)
    console.log(`  Skipped: ${total.skipped}`)
    console.log(`  Missing: ${total.missing}`)
    console.log(`  Errors: ${total.errors}`)
    console.log('='.repeat(60))
  }

  /**
   * Check and update Media
   */
  async checkMedia(): Promise<UpdateStats> {
    console.log('\n📸 Checking and Updating Media...')
    const stats: UpdateStats = { checked: 0, updated: 0, skipped: 0, errors: 0, missing: 0 }
    
    try {
      // Check if media table exists
      const tableExists = await this.tableExists('media')
      if (!tableExists) {
        console.error('\n❌ ERROR: The "media" table does not exist in the database.')
        console.error('\n📋 To fix this, please run the following migration in Supabase SQL Editor:')
        console.error('   Migration: 019_create_media_table.sql')
        console.error('\n   Or manually create the table using the schema in:')
        console.error('   supabase/schema.sql (lines 404-421)')
        console.error('\n⚠️  Skipping media check until table is created.\n')
        this.stats['media'] = stats
        return stats
      }

      // Check if all-media.json exists
      const allMediaPath = path.join(process.cwd(), 'wordpress-export', 'media', 'all-media.json')
      if (!fs.existsSync(allMediaPath)) {
        console.log('⚠️  all-media.json not found. Skipping media check.')
        this.stats['media'] = stats
        return stats
      }

      const data = JSON.parse(fs.readFileSync(allMediaPath, 'utf-8'))
      const mediaList = Array.isArray(data) ? data : (data.items || [])
      
      console.log(`Found ${mediaList.length} media items in JSON\n`)
      
      for (const item of mediaList) {
        stats.checked++
        try {
          // Extract URL from various possible fields
          const sourceUrl = item.source_url || item.guid?.rendered || item.url || item.link || ''
          
          if (!sourceUrl) {
            stats.skipped++
            continue
          }

          // Extract filename from URL or use slug
          const urlParts = sourceUrl.split('/')
          const filenameFromUrl = urlParts[urlParts.length - 1] || ''
          const filename = item.slug || filenameFromUrl || `media-${item.id || Date.now()}`

          // Find by wordpress_id first, then by original_url
          let existing = null

          if (item.id) {
            const result = await supabase
              .from('media')
              .select('*')
              .eq('wordpress_id', item.id)
              .maybeSingle()
            
            if (result.error) {
              // Check if error is about missing table
              if (result.error.message.includes('does not exist') || 
                  result.error.message.includes('Could not find the table')) {
                console.error('\n❌ ERROR: The "media" table was removed or does not exist.')
                console.error('   Please run migration 019_create_media_table.sql in Supabase SQL Editor.')
                console.error('   Stopping media processing to prevent further errors.\n')
                stats.errors++
                break // Stop processing remaining items
              }
            }
            existing = result.data
          }

          // If not found by wordpress_id, try by original_url
          if (!existing && sourceUrl) {
            const result = await supabase
              .from('media')
              .select('*')
              .eq('original_url', sourceUrl)
              .maybeSingle()
            
            if (result.error) {
              // Check if error is about missing table
              if (result.error.message.includes('does not exist') || 
                  result.error.message.includes('Could not find the table')) {
                console.error('\n❌ ERROR: The "media" table was removed or does not exist.')
                console.error('   Please run migration 019_create_media_table.sql in Supabase SQL Editor.')
                console.error('   Stopping media processing to prevent further errors.\n')
                stats.errors++
                break // Stop processing remaining items
              }
            }
            existing = result.data
          }

          // Extract media details
          const mediaDetails = item.media_details || {}
          const mimeType = item.mime_type || null
          const title = item.title?.rendered || item.title || null
          const altText = item.alt_text || null
          const caption = item.caption?.rendered || item.caption || item.description?.rendered || item.description || null

          // If not found, create new record
          if (!existing) {
            const mediaData: any = {
              wordpress_id: item.id || null,
              filename: filename,
              original_url: sourceUrl,
              mime_type: mimeType,
              alt_text: altText || title, // Use title as alt_text if alt_text not available
              caption: caption,
            }

            // Extract dimensions if available
            if (mediaDetails.width) {
              mediaData.width = parseInt(mediaDetails.width, 10)
            }
            if (mediaDetails.height) {
              mediaData.height = parseInt(mediaDetails.height, 10)
            }

            // Extract file size if available
            if (mediaDetails.filesize) {
              mediaData.file_size_bytes = parseInt(mediaDetails.filesize, 10)
            }

            const { error: insertError } = await supabase
              .from('media')
              .insert(mediaData)

            if (insertError) {
              // Check if error is about missing table
              if (insertError.message.includes('does not exist') || 
                  insertError.message.includes('Could not find the table')) {
                console.error('\n❌ ERROR: The "media" table was removed or does not exist.')
                console.error('   Please run migration 019_create_media_table.sql in Supabase SQL Editor.')
                console.error('   Stopping media processing to prevent further errors.\n')
                stats.errors++
                break // Stop processing remaining items
              }
              console.error(`❌ Error inserting ${filename}:`, insertError.message)
              stats.errors++
            } else {
              console.log(`✓ Created: ${filename}`)
              stats.updated++
            }
            continue
          }

          // Update existing record if missing data
          const updates: any = {}
          
          if (!existing.filename || existing.filename.trim() === '') {
            if (filename) updates.filename = filename
          }
          if (!existing.mime_type && mimeType) {
            updates.mime_type = mimeType
          }
          if (!existing.alt_text && (altText || title)) {
            updates.alt_text = altText || title
          }
          if (!existing.caption && caption) {
            updates.caption = caption
          }
          if (!existing.width && mediaDetails.width) {
            updates.width = parseInt(mediaDetails.width, 10)
          }
          if (!existing.height && mediaDetails.height) {
            updates.height = parseInt(mediaDetails.height, 10)
          }
          if (!existing.file_size_bytes && mediaDetails.filesize) {
            updates.file_size_bytes = parseInt(mediaDetails.filesize, 10)
          }

          if (Object.keys(updates).length === 0) {
            stats.skipped++
            continue
          }

          const { error: updateError } = await supabase
            .from('media')
            .update(updates)
            .eq('id', existing.id)

          if (updateError) {
            // Check if error is about missing table
            if (updateError.message.includes('does not exist') || 
                updateError.message.includes('Could not find the table')) {
              console.error('\n❌ ERROR: The "media" table was removed or does not exist.')
              console.error('   Please run migration 019_create_media_table.sql in Supabase SQL Editor.')
              console.error('   Stopping media processing to prevent further errors.\n')
              stats.errors++
              break // Stop processing remaining items
            }
            console.error(`❌ Error updating ${existing.filename}:`, updateError.message)
            stats.errors++
          } else {
            console.log(`✓ Updated ${existing.filename}: ${Object.keys(updates).join(', ')}`)
            stats.updated++
          }
        } catch (error) {
          console.error(`❌ Error processing media item ${item.id || 'unknown'}:`, error)
          stats.errors++
        }
      }
    } catch (error) {
      console.error('❌ Error reading all-media.json:', error)
    }

    this.stats['media'] = stats
    return stats
  }

  /**
   * Run all checks
   */
  async runAll() {
    console.log('🚀 Starting comprehensive data check and update...\n')
    
    await this.checkLawFirms()
    await this.checkLawyers()
    await this.checkArticles()
    await this.checkVideos()
    await this.checkStages()
    await this.checkEmotions()
    await this.checkMedia()
    
    this.printSummary()
  }
}

// Run the checker
const checker = new DataChecker()
checker.runAll()
  .then(() => {
    console.log('\n✅ Data check complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    console.error('\n💡 Troubleshooting tips:')
    console.error('   1. Check that all required tables exist in your database')
    console.error('   2. Verify your .env.local has correct Supabase credentials')
    console.error('   3. Run migrations in Supabase SQL Editor if tables are missing')
    console.error('   4. Check Supabase logs for detailed error messages')
    process.exit(1)
  })

