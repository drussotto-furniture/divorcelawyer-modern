/**
 * Migration Script: WordPress to Supabase
 *
 * This script reads the parsed JSON files from parse-wordpress-xml.py
 * and migrates the data to Supabase.
 *
 * Prerequisites:
 * 1. Run parse-wordpress-xml.py first to generate JSON files
 * 2. Set up Supabase project and schema
 * 3. Configure .env.local with Supabase credentials
 *
 * Usage:
 *   npx tsx scripts/migrate-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Types
interface WordPressItem {
  title: string
  post_id: string
  post_name: string
  post_type: string
  status: string
  content: string
  excerpt: string
  post_date: string
  post_modified: string
  meta: Record<string, string>
}

interface MigrationStats {
  total: number
  successful: number
  failed: number
  errors: Array<{ item: string; error: string }>
}

class SupabaseMigration {
  private supabase
  private outputDir = './output'
  private stats: Record<string, MigrationStats> = {}

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
   * Main migration orchestrator
   */
  async migrate() {
    console.log('🚀 Starting migration to Supabase...\n')

    try {
      // Migrate in order of dependencies
      await this.migrateStates()
      await this.migrateCounties()
      await this.migrateCities()
      await this.migrateMarkets() // Markets should be migrated before zip codes
      await this.migrateZipCodes() // Now enabled for full migration
      await this.migrateArticleCategories()
      await this.migrateTeamMembers()
      await this.migrateArticles()
      await this.migrateQuestions()
      await this.migrateVideos()
      await this.migrateStages()
      await this.migrateEmotions()
      await this.migrateLawFirms()
      await this.migrateLawyers()

      this.printSummary()
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }

  /**
   * Migrate States
   */
  async migrateStates() {
    console.log('📍 Migrating states...')
    const data = await this.loadJSON<WordPressItem[]>('states.json')
    const stats = this.initStats('states', data.length)

    for (const item of data) {
      try {
        const { error } = await this.supabase.from('states').insert({
          name: item.title,
          slug: item.post_name,
          abbreviation: this.extractStateAbbreviation(item),
          content: item.content,
          meta_description: item.meta['_yoast_wpseo_metadesc'] || '',
        })

        if (error) throw error
        stats.successful++
      } catch (error) {
        stats.failed++
        stats.errors.push({
          item: item.title,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        })
      }
    }

    console.log(`✓ States: ${stats.successful}/${stats.total}\n`)
  }

  /**
   * Migrate Counties
   */
  async migrateCounties() {
    console.log('📍 Migrating counties...')
    const data = await this.loadJSON<WordPressItem[]>('counties.json')
    const statesData = await this.loadJSON<WordPressItem[]>('states.json')
    const stats = this.initStats('counties', data.length)

    // Create mapping of WordPress post_id to state slug
    const wpPostIdToStateSlug = new Map<string, string>()
    statesData.forEach(state => {
      wpPostIdToStateSlug.set(state.post_id, state.post_name)
    })

    // Get state mapping from Supabase
    const stateMap = await this.getStateMapping()

    let processed = 0
    for (const item of data) {
      processed++
      if (processed % 500 === 0) {
        console.log(`  Processed ${processed}/${data.length} counties... (${stats.successful} successful, ${stats.failed} failed)`)
      }

      try {
        // Get state from _county_state meta field (which is a WP post_id)
        const statePostId = item.meta['_county_state'] || ''
        const stateSlug = wpPostIdToStateSlug.get(statePostId)
        
        if (!stateSlug) {
          throw new Error(`State slug not found for post_id: ${statePostId}`)
        }

        const stateId = stateMap.get(stateSlug)
        if (!stateId) {
          throw new Error(`State not found for slug: ${stateSlug}`)
        }

        const { error } = await this.supabase.from('counties').insert({
          state_id: stateId,
          name: item.title,
          slug: item.post_name,
          content: item.content,
          meta_description: item.meta['_yoast_wpseo_metadesc'] || '',
        })

        if (error) {
          // Handle duplicate key errors gracefully
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            stats.successful++ // Count as successful since it already exists
          } else {
            throw error
          }
        } else {
          stats.successful++
        }
      } catch (error) {
        // Only count as failed if it's not a duplicate
        if (error instanceof Error && (error.message.includes('duplicate') || error.message.includes('unique'))) {
          stats.successful++
        } else {
          stats.failed++
          if (stats.errors.length < 10) { // Only keep first 10 errors
            stats.errors.push({
              item: item.title,
              error: error instanceof Error ? error.message : JSON.stringify(error),
            })
          }
        }
      }
    }

    console.log(`✓ Counties: ${stats.successful}/${stats.total} (${stats.failed} failed)\n`)
  }

  /**
   * Migrate Cities (sample only - full migration would take longer)
   */
  async migrateCities() {
    console.log('📍 Migrating cities (sample)...')
    const data = await this.loadJSON<WordPressItem[]>('cities.json')
    const stats = this.initStats('cities', data.length)

    // Get mappings
    const stateMap = await this.getStateMapping()
    const countyMap = await this.getCountyMapping()

    for (const item of data) {
      try {
        // Get state name from meta (_city_state_name) and convert to lowercase slug
        const stateName = item.meta['_city_state_name'] || ''
        const stateSlug = stateName.toLowerCase().replace(/\s+/g, '-')
        const countySlug = this.extractCountyFromContent(item)

        const stateId = stateMap.get(stateSlug)
        const countyId = countyMap.get(`${stateSlug}:${countySlug}`)

        if (!stateId) {
          throw new Error(`State not found: ${stateSlug}`)
        }

        const { error } = await this.supabase.from('cities').insert({
          wordpress_id: parseInt(item.post_id),
          state_id: stateId,
          county_id: countyId || null,
          name: item.title,
          slug: item.post_name,
          content: item.content,
          meta_description: item.meta['_yoast_wpseo_metadesc'] || '',
        })

        if (error) throw error
        stats.successful++
      } catch (error) {
        stats.failed++
        stats.errors.push({
          item: item.title,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        })
      }
    }

    console.log(`✓ Cities: ${stats.successful}/${stats.total}\n`)
  }

  /**
   * Migrate Markets
   */
  async migrateMarkets() {
    console.log('📊 Migrating markets...')
    
    // Try to load from market.json (WordPress REST API format)
    let markets: any[] = []
    try {
      const marketData = await this.loadJSON<any[]>('../wordpress-export/custom-post-types/market.json')
      // Convert WordPress REST API format to our format
      markets = marketData.map(item => ({
        wordpress_id: item.id,
        name: item.title?.rendered || item.title || '',
        slug: item.slug || '',
        description: item.content?.rendered || item.content || null,
      }))
    } catch (error) {
      console.log('  Market.json not found, extracting from zip codes...')
      // Fallback: extract from zip codes if market.json doesn't exist
      const zipCodesData = await this.loadJSON<WordPressItem[]>('zip_codes.json')
      const marketsMap = new Map<string, { name: string; wordpress_id?: number }>()
      
      for (const item of zipCodesData) {
        const marketName = item.meta['_zip_code_market'] || item.meta['market']
        if (marketName && typeof marketName === 'string' && marketName.trim()) {
          const marketKey = marketName.trim().toLowerCase()
          if (!marketsMap.has(marketKey)) {
            marketsMap.set(marketKey, {
              name: marketName.trim(),
              wordpress_id: item.meta['_zip_code_market_id'] ? parseInt(item.meta['_zip_code_market_id'] as string) : undefined
            })
          }
        }
      }
      // Convert map to array format
      markets = Array.from(marketsMap.values()).map(m => ({
        wordpress_id: m.wordpress_id,
        name: m.name,
        slug: m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: null,
      }))
    }

    const stats = this.initStats('markets', markets.length)

    for (const market of markets) {
      try {
        const slug = market.slug || market.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        
        const { error } = await this.supabase.from('markets').insert({
          wordpress_id: market.wordpress_id,
          name: market.name,
          slug: slug,
          description: market.description,
        })

        if (error) throw error
        stats.successful++
      } catch (error) {
        // Ignore duplicate key errors (market already exists)
        if (error instanceof Error && error.message.includes('duplicate')) {
          stats.successful++
        } else {
          stats.failed++
          stats.errors.push({
            item: market.name,
            error: error instanceof Error ? error.message : JSON.stringify(error),
          })
        }
      }
    }

    console.log(`✓ Markets: ${stats.successful}/${stats.total}\n`)
  }

  /**
   * Migrate Zip Codes
   */
  async migrateZipCodes() {
    console.log('📮 Migrating zip codes...')
    const data = await this.loadJSON<WordPressItem[]>('zip_codes.json')
    const stats = this.initStats('zip_codes', data.length)

    // Get city mapping by WordPress ID
    const cityMap = new Map<number, string>()
    const { data: cities } = await this.supabase
      .from('cities')
      .select('id, wordpress_id')
    
    if (cities) {
      for (const city of cities) {
        if (city.wordpress_id) {
          cityMap.set(parseInt(city.wordpress_id.toString()), city.id)
        }
      }
      console.log(`  Mapped ${cityMap.size} cities by WordPress ID`)
    } else {
      console.log('  ⚠️  No cities found in database - zip codes will be imported without city links')
    }

    let processed = 0
    for (const item of data) {
      processed++
      if (processed % 5000 === 0) {
        console.log(`  Processed ${processed}/${data.length} zip codes... (${stats.successful} successful, ${stats.failed} failed)`)
      }

      try {
        // Get city WordPress ID from meta
        const cityWordPressId = item.meta?.['_zip_code_city'] 
          ? parseInt(item.meta['_zip_code_city'] as string)
          : null
        
        const cityId = cityWordPressId ? cityMap.get(cityWordPressId) : null

        const { error } = await this.supabase.from('zip_codes').insert({
          wordpress_id: parseInt(item.post_id),
          city_id: cityId || null,
          zip_code: item.title.trim(),
        })

        if (error) {
          // Handle duplicate key errors gracefully
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            stats.successful++ // Count as successful since it already exists
          } else {
            throw error
          }
        } else {
          stats.successful++
        }
      } catch (error) {
        // Only count as failed if it's not a duplicate
        if (error instanceof Error && (error.message.includes('duplicate') || error.message.includes('unique'))) {
          stats.successful++
        } else {
          stats.failed++
          if (stats.errors.length < 10) { // Only keep first 10 errors
            stats.errors.push({
              item: item.title,
              error: error instanceof Error ? error.message : JSON.stringify(error),
            })
          }
        }
      }
    }

    console.log(`✓ Zip Codes: ${stats.successful}/${stats.total}\n`)
  }

  /**
   * Migrate Article Categories
   */
  async migrateArticleCategories() {
    console.log('📚 Migrating article categories...')
    const data = await this.loadJSON<WordPressItem[]>('article_categories.json')
    const stats = this.initStats('article_categories', data.length)

    for (const item of data) {
      try {
        const { error } = await this.supabase.from('article_categories').insert({
          name: item.title,
          slug: item.post_name,
          description: item.meta['articlecategory_description'] || '',
        })

        if (error) throw error
        stats.successful++
      } catch (error) {
        stats.failed++
        stats.errors.push({
          item: item.title,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        })
      }
    }

    console.log(`✓ Article Categories: ${stats.successful}/${stats.total}\n`)
  }

  /**
   * Migrate Team Members
   */
  async migrateTeamMembers() {
    console.log('👥 Migrating team members...')
    const data = await this.loadJSON<WordPressItem[]>('team_members.json')
    const stats = this.initStats('team_members', data.length)

    for (const item of data) {
      try {
        const { error } = await this.supabase.from('team_members').insert({
          wordpress_id: parseInt(item.post_id),
          name: item.title,
          slug: item.post_name,
          title: item.meta['position'] || '',
          bio: item.meta['long_bio'] || item.excerpt || '',
          linkedin_url: item.meta['linkedin_url'] || '',
          created_at: item.post_date,
          updated_at: item.post_modified,
          active: item.status === 'publish',
        })

        if (error) throw error
        stats.successful++
      } catch (error) {
        stats.failed++
        stats.errors.push({
          item: item.title,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        })
      }
    }

    console.log(`✓ Team Members: ${stats.successful}/${stats.total}\n`)
  }

  /**
   * Migrate Articles
   */
  async migrateArticles() {
    console.log('📝 Migrating articles...')
    const data = await this.loadJSON<WordPressItem[]>('articles.json')
    const stats = this.initStats('articles', data.length)

    // Get mappings
    const categoryMap = await this.getArticleCategoryMapping()
    const teamMap = await this.getTeamMemberMapping()

    for (const item of data) {
      try {
        const { error } = await this.supabase.from('articles').insert({
          title: item.title,
          slug: item.post_name,
          content: item.content,
          excerpt: item.excerpt,
          // category_id: categoryMap.get(...), // Need to extract from meta
          status: 'published',
          meta_title: item.meta['_yoast_wpseo_title'] || '',
          meta_description: item.meta['_yoast_wpseo_metadesc'] || '',
          created_at: item.post_date,
          updated_at: item.post_modified,
        })

        if (error) throw error
        stats.successful++
      } catch (error) {
        stats.failed++
        stats.errors.push({
          item: item.title,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        })
      }
    }

    console.log(`✓ Articles: ${stats.successful}/${stats.total}\n`)
  }

  /**
   * Migrate Questions/FAQs
   */
  async migrateQuestions() {
    console.log('❓ Migrating questions...')
    const data = await this.loadJSON<WordPressItem[]>('questions.json')
    const stats = this.initStats('questions', data.length)

    for (const item of data) {
      try {
        // Use excerpt if content is empty (excerpt contains the actual answer)
        const answer = item.excerpt || item.content || ''
        
        const { error } = await this.supabase.from('questions').insert({
          question: item.title,
          answer: answer,
          slug: item.post_name,
        })

        if (error) throw error
        stats.successful++
      } catch (error) {
        stats.failed++
        stats.errors.push({
          item: item.title,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        })
      }
    }

    console.log(`✓ Questions: ${stats.successful}/${stats.total}\n`)
  }

  /**
   * Migrate Videos
   */
  async migrateVideos() {
    console.log('🎥 Migrating videos...')
    const data = await this.loadJSON<WordPressItem[]>('videos.json')
    const stats = this.initStats('videos', data.length)

    for (const item of data) {
      try {
        // Extract video URL from meta (videoPost_link is the Vimeo URL)
        const videoUrl = item.meta['videoPost_link'] || ''
        
        if (!videoUrl) {
          throw new Error('Missing video URL')
        }

        // Extract video provider and ID from URL
        let videoProvider = 'vimeo'
        let videoId = ''
        
        if (videoUrl.includes('vimeo.com')) {
          videoProvider = 'vimeo'
          // Extract video ID from Vimeo URL (e.g., https://player.vimeo.com/video/1042362789)
          const vimeoMatch = videoUrl.match(/vimeo\.com\/video\/(\d+)/)
          videoId = vimeoMatch ? vimeoMatch[1] : ''
        } else if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
          videoProvider = 'youtube'
          const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)
          videoId = youtubeMatch ? youtubeMatch[1] : ''
        }

        const { error } = await this.supabase.from('videos').insert({
          wordpress_id: parseInt(item.post_id),
          title: item.title,
          slug: item.post_name,
          description: item.content,
          video_url: videoUrl,
          video_provider: videoProvider,
          video_id: videoId,
          status: item.status === 'publish' ? 'published' : 'draft',
          published_at: item.status === 'publish' ? item.post_date : null,
          created_at: item.post_date,
          updated_at: item.post_modified,
        })

        if (error) throw error
        stats.successful++
      } catch (error) {
        stats.failed++
        stats.errors.push({
          item: item.title,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        })
      }
    }

    console.log(`✓ Videos: ${stats.successful}/${stats.total}\n`)
  }

  /**
   * Migrate Stages
   */
  async migrateStages() {
    console.log('📊 Migrating stages...')
    const data = await this.loadJSON<WordPressItem[]>('stages.json')
    const stats = this.initStats('stages', data.length)

    for (const item of data) {
      try {
        const { error } = await this.supabase.from('stages').insert({
          name: item.title,
          slug: item.post_name,
          description: item.excerpt,
          content: item.content,
        })

        if (error) throw error
        stats.successful++
      } catch (error) {
        stats.failed++
        stats.errors.push({
          item: item.title,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        })
      }
    }

    console.log(`✓ Stages: ${stats.successful}/${stats.total}\n`)
  }

  /**
   * Migrate Emotions
   */
  async migrateEmotions() {
    console.log('💭 Migrating emotions...')
    const data = await this.loadJSON<WordPressItem[]>('emotions.json')
    const stats = this.initStats('emotions', data.length)

    for (const item of data) {
      try {
        const { error } = await this.supabase.from('emotions').insert({
          name: item.title,
          slug: item.post_name,
          description: item.excerpt,
          content: item.content,
        })

        if (error) throw error
        stats.successful++
      } catch (error) {
        stats.failed++
        stats.errors.push({
          item: item.title,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        })
      }
    }

    console.log(`✓ Emotions: ${stats.successful}/${stats.total}\n`)
  }

  /**
   * Migrate Law Firms
   */
  async migrateLawFirms() {
    console.log('🏢 Migrating law firms...')
    const data = await this.loadJSON<WordPressItem[]>('law_firms.json')
    const stats = this.initStats('law_firms', data.length)

    for (const item of data) {
      try {
        const { error } = await this.supabase.from('law_firms').insert({
          name: item.title,
          slug: item.post_name,
          description: item.content,
          // Add more fields from meta
        })

        if (error) throw error
        stats.successful++
      } catch (error) {
        stats.failed++
        stats.errors.push({
          item: item.title,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        })
      }
    }

    console.log(`✓ Law Firms: ${stats.successful}/${stats.total}\n`)
  }

  /**
   * Migrate Lawyers
   */
  async migrateLawyers() {
    console.log('👨‍⚖️ Migrating lawyers...')
    const data = await this.loadJSON<WordPressItem[]>('lawyers.json')
    const stats = this.initStats('lawyers', data.length)

    const firmMap = await this.getLawFirmMapping()

    for (const item of data) {
      try {
        const { error } = await this.supabase.from('lawyers').insert({
          first_name: this.extractFirstName(item.title),
          last_name: this.extractLastName(item.title),
          slug: item.post_name,
          bio: item.content,
          // law_firm_id: firmMap.get(...), // Extract from meta
        })

        if (error) throw error
        stats.successful++
      } catch (error) {
        stats.failed++
        stats.errors.push({
          item: item.title,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        })
      }
    }

    console.log(`✓ Lawyers: ${stats.successful}/${stats.total}\n`)
  }

  // Helper methods

  private async loadJSON<T>(filename: string): Promise<T> {
    const filePath = path.join(this.outputDir, filename)
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  }

  private initStats(name: string, total: number): MigrationStats {
    const stats: MigrationStats = {
      total,
      successful: 0,
      failed: 0,
      errors: [],
    }
    this.stats[name] = stats
    return stats
  }

  private async getStateMapping(): Promise<Map<string, string>> {
    const { data } = await this.supabase.from('states').select('id, slug')
    const map = new Map<string, string>()
    data?.forEach((item) => map.set(item.slug, item.id))
    return map
  }

  private async getCountyMapping(): Promise<Map<string, string>> {
    const { data } = await this.supabase
      .from('counties')
      .select('id, slug, states(slug)')
    const map = new Map<string, string>()
    data?.forEach((item: any) => {
      const key = `${item.states.slug}:${item.slug}`
      map.set(key, item.id)
    })
    return map
  }

  private async getArticleCategoryMapping(): Promise<Map<string, string>> {
    const { data } = await this.supabase.from('article_categories').select('id, slug')
    const map = new Map<string, string>()
    data?.forEach((item) => map.set(item.slug, item.id))
    return map
  }

  private async getTeamMemberMapping(): Promise<Map<string, string>> {
    const { data } = await this.supabase.from('team_members').select('id, slug')
    const map = new Map<string, string>()
    data?.forEach((item) => map.set(item.slug, item.id))
    return map
  }

  private async getLawFirmMapping(): Promise<Map<string, string>> {
    const { data } = await this.supabase.from('law_firms').select('id, slug')
    const map = new Map<string, string>()
    data?.forEach((item) => map.set(item.slug, item.id))
    return map
  }

  private extractStateAbbreviation(item: WordPressItem): string {
    // Extract from meta or slug
    return item.post_name.toUpperCase().slice(0, 2)
  }

  private extractStateFromContent(item: WordPressItem): string {
    // For counties: extract from post_name (e.g., "henry-alabama" -> "alabama")
    if (item.post_name && item.post_name.includes('-')) {
      const parts = item.post_name.split('-')
      return parts[parts.length - 1] // Last part is the state name
    }
    return ''
  }

  private extractCountyFromContent(item: WordPressItem): string {
    // For cities: extract from post_name (e.g., "alabama/abbeville" -> need county lookup)
    // For now, return empty as this relationship isn't clear in the data
    return ''
  }

  private extractFirstName(fullName: string): string {
    return fullName.split(' ')[0]
  }

  private extractLastName(fullName: string): string {
    const parts = fullName.split(' ')
    return parts[parts.length - 1]
  }

  private printSummary() {
    console.log('\n' + '='.repeat(50))
    console.log('MIGRATION SUMMARY')
    console.log('='.repeat(50))

    for (const [name, stats] of Object.entries(this.stats)) {
      console.log(`\n${name}:`)
      console.log(`  Total: ${stats.total}`)
      console.log(`  Successful: ${stats.successful}`)
      console.log(`  Failed: ${stats.failed}`)

      if (stats.errors.length > 0) {
        console.log('  Errors:')
        stats.errors.forEach((error) => {
          console.log(`    - ${error.item}: ${error.error}`)
        })
      }
    }

    console.log('\n' + '='.repeat(50))
  }
}

// Main execution
async function main() {
  const migration = new SupabaseMigration()
  await migration.migrate()
}

main().catch(console.error)
