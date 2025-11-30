/**
 * Import Media from WordPress JSON
 * This script imports media metadata from WordPress JSON exports into the media table
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import fs from 'fs/promises'
import path from 'path'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Try multiple possible locations for the media JSON file
const possiblePaths = [
  path.join(process.cwd(), 'wordpress-export', 'media', 'all-media.json'),
  path.join(process.cwd(), 'output', 'media.json'),
  path.join(process.cwd(), 'output', 'all-media.json'),
]

async function findMediaFile(): Promise<string | null> {
  for (const filePath of possiblePaths) {
    try {
      await fs.access(filePath)
      console.log(`✓ Found media file at: ${filePath}`)
      return filePath
    } catch {
      // File doesn't exist at this path, try next
    }
  }
  return null
}

async function importMedia() {
  console.log('📸 Importing Media from WordPress JSON...\n')

  // Check if media table exists
  const { error: tableError } = await supabase
    .from('media')
    .select('id')
    .limit(1)

  if (tableError && tableError.message.includes('does not exist')) {
    console.error('❌ ERROR: The "media" table does not exist.')
    console.error('   Please run migration 019_create_media_table.sql in Supabase SQL Editor.')
    return
  }

  // Find the media JSON file
  const mediaFilePath = await findMediaFile()
  if (!mediaFilePath) {
    console.error('❌ Could not find media JSON file in any of these locations:')
    possiblePaths.forEach(p => console.error(`   - ${p}`))
    console.error('\n💡 If you have the media JSON file elsewhere, update the script paths.')
    return
  }

  // Read and parse the JSON file
  let mediaList: any[] = []
  try {
    const fileContent = await fs.readFile(mediaFilePath, 'utf-8')
    const data = JSON.parse(fileContent)
    mediaList = Array.isArray(data) ? data : (data.items || data.media || [])
    console.log(`Found ${mediaList.length} media items in JSON file\n`)
  } catch (error) {
    console.error('❌ Error reading media JSON file:', error)
    return
  }

  if (mediaList.length === 0) {
    console.log('⚠️  No media items found in JSON file.')
    return
  }

  let imported = 0
  let updated = 0
  let skipped = 0
  let errors = 0

  for (const item of mediaList) {
    try {
      // Extract URL from various possible fields
      const sourceUrl = item.source_url || item.guid?.rendered || item.url || item.link || ''
      
      if (!sourceUrl) {
        skipped++
        continue
      }

      // Extract filename from URL or use slug
      const urlParts = sourceUrl.split('/')
      const filenameFromUrl = urlParts[urlParts.length - 1]?.split('?')[0] || ''
      const filename = item.slug || filenameFromUrl || `media-${item.id || Date.now()}`

      // Extract media details
      const mediaDetails = item.media_details || {}
      const mimeType = item.mime_type || null
      const title = item.title?.rendered || item.title || null
      const altText = item.alt_text || null
      const caption = item.caption?.rendered || item.caption || item.description?.rendered || item.description || null

      // Check if media already exists by wordpress_id
      let existing = null
      if (item.id) {
        const { data } = await supabase
          .from('media')
          .select('*')
          .eq('wordpress_id', item.id)
          .maybeSingle()
        existing = data
      }

      // If not found by wordpress_id, try by original_url
      if (!existing && sourceUrl) {
        const { data } = await supabase
          .from('media')
          .select('*')
          .eq('original_url', sourceUrl)
          .maybeSingle()
        existing = data
      }

      const mediaData: any = {
        wordpress_id: item.id || null,
        filename: filename,
        original_url: sourceUrl,
        mime_type: mimeType,
        alt_text: altText || title,
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

      if (existing) {
        // Update existing record
        const updates: any = {}
        if (!existing.filename || existing.filename.trim() === '') updates.filename = filename
        if (!existing.mime_type && mimeType) updates.mime_type = mimeType
        if (!existing.alt_text && (altText || title)) updates.alt_text = altText || title
        if (!existing.caption && caption) updates.caption = caption
        if (!existing.width && mediaDetails.width) updates.width = parseInt(mediaDetails.width, 10)
        if (!existing.height && mediaDetails.height) updates.height = parseInt(mediaDetails.height, 10)
        if (!existing.file_size_bytes && mediaDetails.filesize) updates.file_size_bytes = parseInt(mediaDetails.filesize, 10)

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('media')
            .update(updates)
            .eq('id', existing.id)

          if (updateError) {
            console.error(`❌ Error updating ${filename}:`, updateError.message)
            errors++
          } else {
            updated++
            if (updated % 50 === 0) {
              console.log(`  Updated ${updated} media items...`)
            }
          }
        } else {
          skipped++
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('media')
          .insert(mediaData)

        if (insertError) {
          console.error(`❌ Error inserting ${filename}:`, insertError.message)
          errors++
        } else {
          imported++
          if (imported % 50 === 0) {
            console.log(`  Imported ${imported} media items...`)
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error processing media item ${item.id || 'unknown'}:`, error)
      errors++
    }
  }

  console.log(`\n✅ Media import complete:`)
  console.log(`   Imported: ${imported}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Total: ${imported + updated + skipped + errors}/${mediaList.length}`)
}

importMedia().catch(console.error)



