/**
 * Update Image URLs in Database Content
 * Replaces WordPress image URLs with Supabase Storage URLs
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const OLD_DOMAIN = 'https://www.divorcelawyer.com/wp-content/uploads/'
const NEW_BASE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`

interface UpdateStats {
  tableName: string
  total: number
  updated: number
  urlsReplaced: number
  errors: number
}

class ImageURLUpdater {
  private supabase
  private stats: UpdateStats[] = []

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  /**
   * Replace WordPress URLs with Supabase URLs in content
   */
  replaceImageURLs(content: string): { newContent: string; replacementCount: number } {
    if (!content) return { newContent: content, replacementCount: 0 }

    let replacementCount = 0
    
    // Replace image URLs in various formats
    let newContent = content

    // Pattern 1: Full WordPress URLs in content
    const wpUrlPattern = /https?:\/\/(?:www\.)?divorcelawyer\.com\/wp-content\/uploads\/[\w\-\/]+\.(jpg|jpeg|png|gif|webp|svg)/gi
    
    newContent = newContent.replace(wpUrlPattern, (match) => {
      replacementCount++
      // Extract filename from URL (everything after the last /)
      const filename = match.split('/').pop()
      return `${NEW_BASE_URL}${filename}`
    })

    // Pattern 2: Relative URLs
    const relativePattern = /\/wp-content\/uploads\/[\w\-\/]+\.(jpg|jpeg|png|gif|webp|svg)/gi
    
    newContent = newContent.replace(relativePattern, (match) => {
      replacementCount++
      const filename = match.split('/').pop()
      return `${NEW_BASE_URL}${filename}`
    })

    return { newContent, replacementCount }
  }

  /**
   * Update content in a table
   */
  async updateTable(
    tableName: string,
    contentField: string = 'content',
    additionalFields: string[] = []
  ) {
    console.log(`\n📝 Updating ${tableName}...`)

    const tableStats: UpdateStats = {
      tableName,
      total: 0,
      updated: 0,
      urlsReplaced: 0,
      errors: 0,
    }

    try {
      // Fetch all records
      const { data: records, error: fetchError } = await this.supabase
        .from(tableName)
        .select(`id, ${contentField}${additionalFields.length > 0 ? ', ' + additionalFields.join(', ') : ''}`)

      if (fetchError) {
        console.error(`❌ Error fetching ${tableName}:`, fetchError)
        return
      }

      if (!records || records.length === 0) {
        console.log(`  ⏭️  No records found`)
        return
      }

      tableStats.total = records.length
      console.log(`  Found ${records.length} records`)

      // Update each record
      for (const record of records) {
        let hasChanges = false
        const updates: Record<string, string> = {}

        // Update main content field
        if (record[contentField as keyof typeof record]) {
          const { newContent, replacementCount } = this.replaceImageURLs(record[contentField as keyof typeof record] as string)
          if (replacementCount > 0) {
            updates[contentField as keyof typeof updates] = newContent
            tableStats.urlsReplaced += replacementCount
            hasChanges = true
          }
        }

        // Update additional fields
        for (const field of additionalFields) {
          if (record[field as keyof typeof record]) {
            const { newContent, replacementCount } = this.replaceImageURLs(record[field as keyof typeof record] as string)
            if (replacementCount > 0) {
              updates[field as keyof typeof updates] = newContent
              tableStats.urlsReplaced += replacementCount
              hasChanges = true
            }
          }
        }

        // Save updates if any
        if (hasChanges) {
          const { error: updateError } = await this.supabase
            .from(tableName)
            .update(updates)
            .eq('id', (record as any).id)

          if (updateError) {
            console.error(`  ❌ Error updating record ${(record as any).id}:`, updateError.message)
            tableStats.errors++
          } else {
            tableStats.updated++
          }
        }
      }

      console.log(`  ✅ Updated ${tableStats.updated}/${tableStats.total} records`)
      console.log(`  🔄 Replaced ${tableStats.urlsReplaced} image URLs`)

      this.stats.push(tableStats)
    } catch (error) {
      console.error(`❌ Error processing ${tableName}:`, error)
    }
  }

  /**
   * Update all tables with content
   */
  async updateAll() {
    console.log('='.repeat(60))
    console.log('Image URL Update Tool')
    console.log('='.repeat(60))
    console.log(`\nOld URL: ${OLD_DOMAIN}[filename]`)
    console.log(`New URL: ${NEW_BASE_URL}[filename]`)

    // Update all tables that have content with images
    await this.updateTable('articles', 'content', ['excerpt', 'meta_description'])
    await this.updateTable('posts', 'content', ['excerpt', 'meta_description'])
    await this.updateTable('videos', 'description', ['thumbnail_url'])
    await this.updateTable('questions', 'answer')
    await this.updateTable('stages', 'content', ['description'])
    await this.updateTable('emotions', 'content', ['description'])
    await this.updateTable('states', 'content', ['meta_description'])
    await this.updateTable('counties', 'content', ['meta_description'])
    await this.updateTable('cities', 'content', ['meta_description'])
    await this.updateTable('lawyers', 'bio')
    await this.updateTable('law_firms', 'description')

    this.printSummary()
  }

  /**
   * Print summary of updates
   */
  printSummary() {
    console.log('\n' + '='.repeat(60))
    console.log('Update Summary')
    console.log('='.repeat(60))

    let totalRecords = 0
    let totalUpdated = 0
    let totalURLs = 0
    let totalErrors = 0

    for (const stat of this.stats) {
      if (stat.updated > 0 || stat.errors > 0) {
        console.log(`\n${stat.tableName}:`)
        console.log(`  Total Records: ${stat.total}`)
        console.log(`  Updated: ${stat.updated}`)
        console.log(`  URLs Replaced: ${stat.urlsReplaced}`)
        if (stat.errors > 0) {
          console.log(`  Errors: ${stat.errors}`)
        }
      }

      totalRecords += stat.total
      totalUpdated += stat.updated
      totalURLs += stat.urlsReplaced
      totalErrors += stat.errors
    }

    console.log('\n' + '-'.repeat(60))
    console.log(`📊 Total Records Processed: ${totalRecords}`)
    console.log(`✅ Total Records Updated: ${totalUpdated}`)
    console.log(`🔄 Total URLs Replaced: ${totalURLs}`)
    if (totalErrors > 0) {
      console.log(`❌ Total Errors: ${totalErrors}`)
    }
    console.log('='.repeat(60))
  }
}

async function main() {
  try {
    const updater = new ImageURLUpdater()
    await updater.updateAll()
  } catch (error) {
    console.error('❌ Update failed:', error)
    process.exit(1)
  }
}

main()

