/**
 * Upload Media to Supabase Storage
 * Uploads downloaded WordPress media files to Supabase Storage bucket
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const MEDIA_DIR = path.join(process.cwd(), 'wordpress-export', 'media', 'files')
const MEDIA_LIST_PATH = path.join(
  process.cwd(),
  'wordpress-export',
  'media',
  'download-list.json'
)
const BUCKET_NAME = 'media' // Supabase storage bucket name

interface MediaItem {
  id: number
  url: string
  filename: string
  mime_type: string
  alt_text: string
}

class SupabaseUploader {
  private supabase
  private stats = {
    total: 0,
    uploaded: 0,
    skipped: 0,
    failed: 0,
    errors: [] as Array<{ file: string; error: string }>,
  }

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      )
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  async ensureBucket() {
    console.log('🗂️  Checking storage bucket...')

    // Check if bucket exists
    const { data: buckets, error: listError } = await this.supabase.storage.listBuckets()

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }

    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME)

    if (!bucketExists) {
      console.log(`Creating bucket: ${BUCKET_NAME}`)
      const { error: createError } = await this.supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          'application/pdf',
        ],
      })

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`)
      }
      console.log('✅ Bucket created successfully\n')
    } else {
      console.log('✅ Bucket already exists\n')
    }
  }

  async uploadFile(filename: string, mimeType: string): Promise<boolean> {
    const filePath = path.join(MEDIA_DIR, filename)

    try {
      // Check if file already exists in storage
      const { data: existingFile } = await this.supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          search: filename,
        })

      if (existingFile && existingFile.length > 0) {
        return false // Already exists
      }

      // Read file
      const fileBuffer = await fs.readFile(filePath)

      // Upload to Supabase
      const { error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, fileBuffer, {
          contentType: mimeType,
          upsert: false,
        })

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      throw error
    }
  }

  async upload() {
    console.log('='.repeat(60))
    console.log('Supabase Media Upload Tool')
    console.log('='.repeat(60))
    console.log('')

    // Ensure bucket exists
    await this.ensureBucket()

    // Load media list
    const mediaList: MediaItem[] = JSON.parse(
      await fs.readFile(MEDIA_LIST_PATH, 'utf-8')
    )

    this.stats.total = mediaList.length
    console.log(`Found ${mediaList.length} media files to upload\n`)

    for (let i = 0; i < mediaList.length; i++) {
      const item = mediaList[i]

      try {
        const uploaded = await this.uploadFile(item.filename, item.mime_type)

        if (uploaded) {
          console.log(`[${i + 1}/${mediaList.length}] ✅ Uploaded: ${item.filename}`)
          this.stats.uploaded++
        } else {
          console.log(`[${i + 1}/${mediaList.length}] ⏭️  Skipped: ${item.filename} (already exists)`)
          this.stats.skipped++
        }

        // Rate limiting - avoid hitting Supabase limits
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`[${i + 1}/${mediaList.length}] ❌ Failed: ${item.filename}`)
        this.stats.failed++
        this.stats.errors.push({
          file: item.filename,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    this.printSummary()
  }

  printSummary() {
    console.log('\n' + '='.repeat(60))
    console.log('Upload Complete!')
    console.log('='.repeat(60))
    console.log(`📊 Total: ${this.stats.total}`)
    console.log(`✅ Uploaded: ${this.stats.uploaded}`)
    console.log(`⏭️  Skipped: ${this.stats.skipped}`)
    console.log(`❌ Failed: ${this.stats.failed}`)

    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors:')
      this.stats.errors.forEach((err) => {
        console.log(`  - ${err.file}: ${err.error}`)
      })
    }

    console.log('\n📁 Files available at:')
    console.log(`   ${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/`)
    console.log('='.repeat(60))
  }
}

async function main() {
  try {
    const uploader = new SupabaseUploader()
    await uploader.upload()
  } catch (error) {
    console.error('❌ Upload failed:', error)
    process.exit(1)
  }
}

main()

