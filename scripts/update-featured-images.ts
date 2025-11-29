/**
 * Update Featured Images Script
 * 
 * This script updates the featured_image_url field for articles, stages, and emotions
 * by matching the WordPress _thumbnail_id with the media download list.
 * 
 * Usage:
 *   npx tsx scripts/update-featured-images.ts
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

interface MediaItem {
  id: number
  url: string
  filename: string
  mime_type: string
  alt_text: string
}

interface WordPressItem {
  title: string
  post_id: string
  post_name: string
  meta: Record<string, string>
}

class FeaturedImageUpdater {
  private supabase
  private mediaMap: Map<number, MediaItem> = new Map()
  private supabaseStorageUrl: string

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.supabaseStorageUrl = `${supabaseUrl}/storage/v1/object/public/media`
  }

  async run() {
    console.log('🖼️  Starting featured image update...\n')

    // Load media mapping
    await this.loadMediaMapping()

    // Update each content type
    await this.updateArticles()
    await this.updateStages()
    await this.updateEmotions()

    console.log('\n✅ Featured image update complete!')
  }

  private async loadMediaMapping() {
    console.log('📂 Loading media mapping...')
    
    const downloadListPath = path.join(process.cwd(), 'wordpress-export/media/download-list.json')
    const content = await fs.readFile(downloadListPath, 'utf-8')
    const mediaList: MediaItem[] = JSON.parse(content)

    mediaList.forEach(item => {
      this.mediaMap.set(item.id, item)
    })

    console.log(`   Loaded ${this.mediaMap.size} media items\n`)
  }

  private getStorageUrl(mediaItem: MediaItem): string {
    // Convert WordPress URL to Supabase storage URL
    // The files are stored with their original filename in the media bucket
    return `${this.supabaseStorageUrl}/${encodeURIComponent(mediaItem.filename)}`
  }

  private async updateArticles() {
    console.log('📝 Updating article featured images...')
    
    const articlesPath = path.join(process.cwd(), 'output/articles.json')
    const content = await fs.readFile(articlesPath, 'utf-8')
    const articles: WordPressItem[] = JSON.parse(content)

    let updated = 0
    let skipped = 0
    let notFound = 0

    for (const article of articles) {
      const thumbnailId = article.meta['_thumbnail_id']
      
      if (!thumbnailId) {
        skipped++
        continue
      }

      const mediaItem = this.mediaMap.get(parseInt(thumbnailId))
      
      if (!mediaItem) {
        console.log(`   ⚠️  Media not found for article "${article.title}" (thumbnail_id: ${thumbnailId})`)
        notFound++
        continue
      }

      const storageUrl = this.getStorageUrl(mediaItem)

      const { error } = await this.supabase
        .from('articles')
        .update({ featured_image_url: storageUrl })
        .eq('slug', article.post_name)

      if (error) {
        console.log(`   ❌ Error updating "${article.title}": ${error.message}`)
      } else {
        updated++
      }
    }

    console.log(`   ✓ Articles: ${updated} updated, ${skipped} no thumbnail, ${notFound} media not found\n`)
  }

  private async updateStages() {
    console.log('📊 Updating stage featured images...')
    
    const stagesPath = path.join(process.cwd(), 'output/stages.json')
    const content = await fs.readFile(stagesPath, 'utf-8')
    const stages: WordPressItem[] = JSON.parse(content)

    let updated = 0
    let skipped = 0
    let notFound = 0

    for (const stage of stages) {
      const thumbnailId = stage.meta['_thumbnail_id']
      
      if (!thumbnailId) {
        skipped++
        continue
      }

      const mediaItem = this.mediaMap.get(parseInt(thumbnailId))
      
      if (!mediaItem) {
        console.log(`   ⚠️  Media not found for stage "${stage.title}" (thumbnail_id: ${thumbnailId})`)
        notFound++
        continue
      }

      const storageUrl = this.getStorageUrl(mediaItem)

      const { error } = await this.supabase
        .from('stages')
        .update({ featured_image_url: storageUrl })
        .eq('slug', stage.post_name)

      if (error) {
        console.log(`   ❌ Error updating "${stage.title}": ${error.message}`)
      } else {
        updated++
      }
    }

    console.log(`   ✓ Stages: ${updated} updated, ${skipped} no thumbnail, ${notFound} media not found\n`)
  }

  private async updateEmotions() {
    console.log('💭 Updating emotion featured images...')
    
    const emotionsPath = path.join(process.cwd(), 'output/emotions.json')
    const content = await fs.readFile(emotionsPath, 'utf-8')
    const emotions: WordPressItem[] = JSON.parse(content)

    let updated = 0
    let skipped = 0
    let notFound = 0

    for (const emotion of emotions) {
      const thumbnailId = emotion.meta['_thumbnail_id']
      
      if (!thumbnailId) {
        skipped++
        continue
      }

      const mediaItem = this.mediaMap.get(parseInt(thumbnailId))
      
      if (!mediaItem) {
        console.log(`   ⚠️  Media not found for emotion "${emotion.title}" (thumbnail_id: ${thumbnailId})`)
        notFound++
        continue
      }

      const storageUrl = this.getStorageUrl(mediaItem)

      const { error } = await this.supabase
        .from('emotions')
        .update({ featured_image_url: storageUrl })
        .eq('slug', emotion.post_name)

      if (error) {
        console.log(`   ❌ Error updating "${emotion.title}": ${error.message}`)
      } else {
        updated++
      }
    }

    console.log(`   ✓ Emotions: ${updated} updated, ${skipped} no thumbnail, ${notFound} media not found\n`)
  }
}

// Main execution
async function main() {
  const updater = new FeaturedImageUpdater()
  await updater.run()
}

main().catch(console.error)

