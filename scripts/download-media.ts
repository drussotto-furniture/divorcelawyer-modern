/**
 * WordPress Media Download Script
 * Downloads all media files from the WordPress export
 */

import * as fs from 'fs';
import * as path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const EXPORT_DIR = path.join(process.cwd(), 'wordpress-export');
const MEDIA_LIST_PATH = path.join(EXPORT_DIR, 'media', 'download-list.json');
const DOWNLOAD_DIR = path.join(EXPORT_DIR, 'media', 'files');

interface MediaItem {
  id: number;
  url: string;
  filename: string;
  mime_type: string;
  alt_text: string;
}

async function downloadFile(url: string, filePath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }

  const fileStream = createWriteStream(filePath);
  await pipeline(response.body as any, fileStream);
}

async function downloadMedia() {
  console.log('='.repeat(60));
  console.log('WordPress Media Download Tool');
  console.log('='.repeat(60));
  console.log('');

  // Check if media list exists
  if (!fs.existsSync(MEDIA_LIST_PATH)) {
    console.error('❌ Media list not found. Please run "npm run export:wordpress" first.');
    process.exit(1);
  }

  // Create download directory
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  // Load media list
  const mediaList: MediaItem[] = JSON.parse(fs.readFileSync(MEDIA_LIST_PATH, 'utf-8'));
  console.log(`Found ${mediaList.length} media files to download\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < mediaList.length; i++) {
    const item = mediaList[i];
    const filePath = path.join(DOWNLOAD_DIR, item.filename);

    // Skip if already downloaded
    if (fs.existsSync(filePath)) {
      console.log(`[${i + 1}/${mediaList.length}] ⏭️  Skipped: ${item.filename} (already exists)`);
      skipped++;
      continue;
    }

    try {
      console.log(`[${i + 1}/${mediaList.length}] ⬇️  Downloading: ${item.filename}`);
      await downloadFile(item.url, filePath);
      downloaded++;

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`[${i + 1}/${mediaList.length}] ❌ Failed: ${item.filename}`, error);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Download Complete!');
  console.log('='.repeat(60));
  console.log(`✅ Downloaded: ${downloaded}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Saved to: ${DOWNLOAD_DIR}`);
  console.log('='.repeat(60));
}

downloadMedia();
