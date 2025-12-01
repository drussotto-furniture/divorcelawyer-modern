/**
 * Migration Script: WordPress Tags to Supabase
 * 
 * This script migrates WordPress tags to Supabase and links them to articles/posts.
 * Since the tags.json export is empty, it fetches tags directly from WordPress REST API.
 * 
 * Usage:
 *   npx tsx scripts/migrate-tags.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import fs from 'fs/promises'
import path from 'path'

// Load environment variables
config({ path: '.env.local' })

const WP_API_BASE = 'https://divorcelawyer.com/wp-json/wp/v2'
const EXPORT_DIR = path.join(process.cwd(), 'wordpress-export')

interface WPTag {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  [key: string]: any
}

interface WPPost {
  id: number
  tags: number[]
  [key: string]: any
}

class TagsMigration {
  private supabase
  private tagMap = new Map<number, string>() // WordPress tag ID -> Supabase tag ID

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      )
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Fetch all tags from WordPress REST API
   */
  async fetchWordPressTags(): Promise<WPTag[]> {
    console.log('📥 Fetching tags from WordPress REST API...')
    
    const tags: WPTag[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      try {
        const response = await fetch(`${WP_API_BASE}/tags?per_page=100&page=${page}`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: WPTag[] = await response.json()
        
        if (data.length === 0) {
          hasMore = false
        } else {
          tags.push(...data)
          console.log(`  Fetched page ${page}: ${data.length} tags`)
          page++
          
          // Check if there are more pages
          const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '0')
          if (page > totalPages) {
            hasMore = false
          }
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error)
        hasMore = false
      }
    }

    console.log(`✓ Total tags fetched: ${tags.length}\n`)
    return tags
  }

  /**
   * Load tags from JSON file if it exists and has data
   */
  async loadTagsFromJSON(): Promise<WPTag[] | null> {
    const tagsPath = path.join(EXPORT_DIR, 'taxonomies', 'tags.json')
    
    try {
      const content = await fs.readFile(tagsPath, 'utf-8')
      const tags: WPTag[] = JSON.parse(content)
      
      if (Array.isArray(tags) && tags.length > 0) {
        console.log(`✓ Loaded ${tags.length} tags from JSON file\n`)
        return tags
      }
    } catch (error) {
      // File doesn't exist or is empty, that's okay
    }
    
    return null
  }

  /**
   * Migrate tags to Supabase
   */
  async migrateTags(): Promise<void> {
    console.log('🏷️  Migrating tags to Supabase...\n')

    // Try to load from JSON first, otherwise fetch from API
    let tags = await this.loadTagsFromJSON()
    
    if (!tags || tags.length === 0) {
      tags = await this.fetchWordPressTags()
    }

    if (tags.length === 0) {
      console.log('⚠️  No tags found. Skipping tag migration.\n')
      return
    }

    let imported = 0
    let updated = 0
    let skipped = 0

    for (const tag of tags) {
      try {
        // Check if tag already exists by wordpress_id
        const { data: existing } = await this.supabase
          .from('tags')
          .select('id, wordpress_id')
          .eq('wordpress_id', tag.id)
          .maybeSingle()

        const tagData = {
          wordpress_id: tag.id,
          name: tag.name,
          slug: tag.slug,
          description: tag.description || null,
        }

        if (existing) {
          // Update existing tag
          const { error } = await this.supabase
            .from('tags')
            .update(tagData)
            .eq('id', existing.id)

          if (error) throw error
          this.tagMap.set(tag.id, existing.id)
          updated++
          console.log(`  ✓ Updated: ${tag.name}`)
        } else {
          // Insert new tag
          const { data: inserted, error } = await this.supabase
            .from('tags')
            .insert(tagData)
            .select('id')
            .single()

          if (error) throw error
          if (inserted) {
            this.tagMap.set(tag.id, inserted.id)
            imported++
            console.log(`  ✓ Imported: ${tag.name}`)
          }
        }
      } catch (error) {
        console.error(`  ❌ Error processing tag "${tag.name}":`, error)
        skipped++
      }
    }

    console.log(`\n✓ Tags migration complete:`)
    console.log(`  - Imported: ${imported}`)
    console.log(`  - Updated: ${updated}`)
    console.log(`  - Skipped: ${skipped}\n`)
  }

  /**
   * Link tags to articles
   */
  async linkTagsToArticles(): Promise<void> {
    console.log('🔗 Linking tags to articles...\n')

    // Fetch articles with their WordPress IDs
    const { data: articles, error: articlesError } = await this.supabase
      .from('articles')
      .select('id, wordpress_id')
      .not('wordpress_id', 'is', null)

    if (articlesError) {
      console.error('❌ Error fetching articles:', articlesError)
      return
    }

    if (!articles || articles.length === 0) {
      console.log('⚠️  No articles found. Skipping tag linking.\n')
      return
    }

    console.log(`  Found ${articles.length} articles to process`)

    // Fetch tag associations from WordPress REST API
    let linked = 0
    let skipped = 0

    for (const article of articles) {
      try {
        // Fetch article from WordPress REST API to get tags
        const response = await fetch(`${WP_API_BASE}/articles/${article.wordpress_id}`)
        
        if (!response.ok) {
          // Article might not exist in WordPress anymore, skip
          skipped++
          continue
        }

        const wpArticle: WPPost = await response.json()
        
        if (!wpArticle.tags || wpArticle.tags.length === 0) {
          skipped++
          continue
        }

        // Link each tag to the article using page_tags
        for (const wpTagId of wpArticle.tags) {
          const supabaseTagId = this.tagMap.get(wpTagId)
          
          if (!supabaseTagId) {
            // Tag not migrated yet, skip
            continue
          }

          // Check if link already exists
          const { data: existing } = await this.supabase
            .from('page_tags')
            .select('id')
            .eq('content_type', 'article')
            .eq('content_id', article.id)
            .eq('tag_id', supabaseTagId)
            .maybeSingle()

          if (!existing) {
            const { error } = await this.supabase
              .from('page_tags')
              .insert({
                content_type: 'article',
                content_id: article.id,
                tag_id: supabaseTagId,
              })

            if (error) {
              console.error(`  ❌ Error linking tag to article ${article.wordpress_id}:`, error)
            } else {
              linked++
            }
          }
        }
      } catch (error) {
        console.error(`  ❌ Error processing article ${article.wordpress_id}:`, error)
        skipped++
      }
    }

    console.log(`\n✓ Article tag linking complete:`)
    console.log(`  - Linked: ${linked} tag-article relationships`)
    console.log(`  - Skipped: ${skipped} articles\n`)
  }

  /**
   * Link tags to posts
   */
  async linkTagsToPosts(): Promise<void> {
    console.log('🔗 Linking tags to posts...\n')

    // Fetch posts with their WordPress IDs
    const { data: posts, error: postsError } = await this.supabase
      .from('posts')
      .select('id, wordpress_id')
      .not('wordpress_id', 'is', null)

    if (postsError) {
      console.error('❌ Error fetching posts:', postsError)
      return
    }

    if (!posts || posts.length === 0) {
      console.log('⚠️  No posts found. Skipping tag linking.\n')
      return
    }

    console.log(`  Found ${posts.length} posts to process`)

    let linked = 0
    let skipped = 0

    for (const post of posts) {
      try {
        // Fetch post from WordPress REST API to get tags
        const response = await fetch(`${WP_API_BASE}/posts/${post.wordpress_id}`)
        
        if (!response.ok) {
          skipped++
          continue
        }

        const wpPost: WPPost = await response.json()
        
        if (!wpPost.tags || wpPost.tags.length === 0) {
          skipped++
          continue
        }

        // Link each tag to the post using page_tags
        for (const wpTagId of wpPost.tags) {
          const supabaseTagId = this.tagMap.get(wpTagId)
          
          if (!supabaseTagId) {
            continue
          }

          // Check if link already exists
          const { data: existing } = await this.supabase
            .from('page_tags')
            .select('id')
            .eq('content_type', 'post')
            .eq('content_id', post.id)
            .eq('tag_id', supabaseTagId)
            .maybeSingle()

          if (!existing) {
            const { error } = await this.supabase
              .from('page_tags')
              .insert({
                content_type: 'post',
                content_id: post.id,
                tag_id: supabaseTagId,
              })

            if (error) {
              console.error(`  ❌ Error linking tag to post ${post.wordpress_id}:`, error)
            } else {
              linked++
            }
          }
        }
      } catch (error) {
        console.error(`  ❌ Error processing post ${post.wordpress_id}:`, error)
        skipped++
      }
    }

    console.log(`\n✓ Post tag linking complete:`)
    console.log(`  - Linked: ${linked} tag-post relationships`)
    console.log(`  - Skipped: ${skipped} posts\n`)
  }

  /**
   * Main migration function
   */
  async migrate() {
    console.log('🚀 Starting tags migration...\n')

    try {
      // Step 1: Migrate tags
      await this.migrateTags()

      // Step 2: Link tags to articles (if tag map was populated)
      if (this.tagMap.size > 0) {
        await this.linkTagsToArticles()
        await this.linkTagsToPosts()
      } else {
        console.log('⚠️  No tags were migrated. Skipping tag linking.\n')
      }

      console.log('✅ Tags migration complete!\n')
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }
}

// Run migration
const migration = new TagsMigration()
migration.migrate().catch(console.error)



