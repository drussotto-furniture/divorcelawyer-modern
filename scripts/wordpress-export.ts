/**
 * WordPress Content Export Script
 * Fetches content from divorcelawyer.com via WordPress REST API
 */

import * as fs from 'fs';
import * as path from 'path';

const WP_SITE_URL = 'https://divorcelawyer.com';
const WP_API_BASE = `${WP_SITE_URL}/wp-json/wp/v2`;
const EXPORT_DIR = path.join(process.cwd(), 'wordpress-export');

interface WPPost {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  yoast_head_json?: any;
  [key: string]: any;
}

interface WPPage {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  parent: number;
  author: number;
  featured_media: number;
  yoast_head_json?: any;
  [key: string]: any;
}

interface WPMedia {
  id: number;
  date: string;
  slug: string;
  type: string;
  link: string;
  title: { rendered: string };
  source_url: string;
  mime_type: string;
  media_details: any;
  alt_text: string;
  [key: string]: any;
}

interface WPUser {
  id: number;
  name: string;
  slug: string;
  description: string;
  link: string;
  avatar_urls: { [key: string]: string };
  [key: string]: any;
}

interface WPCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  parent: number;
  [key: string]: any;
}

interface WPTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  [key: string]: any;
}

interface ExportSummary {
  timestamp: string;
  siteUrl: string;
  posts: number;
  pages: number;
  media: number;
  users: number;
  categories: number;
  tags: number;
  customPostTypes: { [key: string]: number };
}

/**
 * Fetch all items from a paginated WordPress REST API endpoint
 */
async function fetchAllPages<T>(endpoint: string, params: Record<string, any> = {}): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const queryParams = new URLSearchParams({
      per_page: perPage.toString(),
      page: page.toString(),
      ...params,
    });

    const url = `${endpoint}?${queryParams}`;
    console.log(`Fetching: ${url}`);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 400 && page > 1) {
          // No more pages
          break;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const items: T[] = await response.json();

      if (items.length === 0) {
        break;
      }

      allItems.push(...items);
      console.log(`  → Fetched ${items.length} items (total: ${allItems.length})`);

      // Check if there are more pages
      const totalPages = response.headers.get('X-WP-TotalPages');
      if (totalPages && page >= parseInt(totalPages)) {
        break;
      }

      page++;

      // Rate limiting - be nice to the server
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      break;
    }
  }

  return allItems;
}

/**
 * Discover available post types
 */
async function discoverPostTypes(): Promise<string[]> {
  try {
    const response = await fetch(`${WP_SITE_URL}/wp-json/wp/v2/types`);
    if (!response.ok) {
      console.warn('Could not fetch post types, using defaults');
      return ['post', 'page'];
    }
    const types = await response.json();
    return Object.keys(types);
  } catch (error) {
    console.warn('Error discovering post types:', error);
    return ['post', 'page'];
  }
}

/**
 * Create export directory structure
 */
function setupExportDirectory() {
  const dirs = [
    EXPORT_DIR,
    path.join(EXPORT_DIR, 'posts'),
    path.join(EXPORT_DIR, 'pages'),
    path.join(EXPORT_DIR, 'media'),
    path.join(EXPORT_DIR, 'users'),
    path.join(EXPORT_DIR, 'taxonomies'),
    path.join(EXPORT_DIR, 'custom-post-types'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Save data to JSON file
 */
function saveJSON(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ Saved: ${filePath}`);
}

/**
 * Main export function
 */
async function exportWordPressContent() {
  console.log('='.repeat(60));
  console.log('WordPress Content Export Tool');
  console.log('='.repeat(60));
  console.log(`Site: ${WP_SITE_URL}`);
  console.log(`Export Directory: ${EXPORT_DIR}`);
  console.log('='.repeat(60));
  console.log('');

  setupExportDirectory();

  const summary: ExportSummary = {
    timestamp: new Date().toISOString(),
    siteUrl: WP_SITE_URL,
    posts: 0,
    pages: 0,
    media: 0,
    users: 0,
    categories: 0,
    tags: 0,
    customPostTypes: {},
  };

  try {
    // Export Posts
    console.log('\n📝 Exporting Posts...');
    const posts = await fetchAllPages<WPPost>(`${WP_API_BASE}/posts`, { status: 'publish,draft,private' });
    saveJSON(path.join(EXPORT_DIR, 'posts', 'all-posts.json'), posts);
    summary.posts = posts.length;

    // Export Pages
    console.log('\n📄 Exporting Pages...');
    const pages = await fetchAllPages<WPPage>(`${WP_API_BASE}/pages`, { status: 'publish,draft,private' });
    saveJSON(path.join(EXPORT_DIR, 'pages', 'all-pages.json'), pages);
    summary.pages = pages.length;

    // Export Media
    console.log('\n🖼️  Exporting Media...');
    const media = await fetchAllPages<WPMedia>(`${WP_API_BASE}/media`);
    saveJSON(path.join(EXPORT_DIR, 'media', 'all-media.json'), media);

    // Create media download list
    const mediaDownloadList = media.map(m => ({
      id: m.id,
      url: m.source_url,
      filename: path.basename(m.source_url.split('?')[0]),
      mime_type: m.mime_type,
      alt_text: m.alt_text,
    }));
    saveJSON(path.join(EXPORT_DIR, 'media', 'download-list.json'), mediaDownloadList);
    summary.media = media.length;

    // Export Users/Authors
    console.log('\n👤 Exporting Users...');
    const users = await fetchAllPages<WPUser>(`${WP_API_BASE}/users`);
    saveJSON(path.join(EXPORT_DIR, 'users', 'all-users.json'), users);
    summary.users = users.length;

    // Export Categories
    console.log('\n📁 Exporting Categories...');
    const categories = await fetchAllPages<WPCategory>(`${WP_API_BASE}/categories`);
    saveJSON(path.join(EXPORT_DIR, 'taxonomies', 'categories.json'), categories);
    summary.categories = categories.length;

    // Export Tags
    console.log('\n🏷️  Exporting Tags...');
    const tags = await fetchAllPages<WPTag>(`${WP_API_BASE}/tags`);
    saveJSON(path.join(EXPORT_DIR, 'taxonomies', 'tags.json'), tags);
    summary.tags = tags.length;

    // Discover and export custom post types
    console.log('\n🔍 Discovering Custom Post Types...');
    const postTypes = await discoverPostTypes();
    const standardTypes = ['post', 'page', 'attachment', 'revision', 'nav_menu_item', 'wp_block', 'wp_template', 'wp_template_part', 'wp_navigation'];
    const customTypes = postTypes.filter(type => !standardTypes.includes(type));

    if (customTypes.length > 0) {
      console.log(`Found custom post types: ${customTypes.join(', ')}`);

      for (const customType of customTypes) {
        try {
          console.log(`\n📦 Exporting Custom Post Type: ${customType}...`);
          const customPosts = await fetchAllPages<any>(`${WP_API_BASE}/${customType}`);
          saveJSON(path.join(EXPORT_DIR, 'custom-post-types', `${customType}.json`), customPosts);
          summary.customPostTypes[customType] = customPosts.length;
        } catch (error) {
          console.warn(`  ⚠️  Could not export ${customType}:`, error);
        }
      }
    } else {
      console.log('No custom post types found.');
    }

    // Save export summary
    saveJSON(path.join(EXPORT_DIR, 'export-summary.json'), summary);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Export Complete!');
    console.log('='.repeat(60));
    console.log(`Posts: ${summary.posts}`);
    console.log(`Pages: ${summary.pages}`);
    console.log(`Media Files: ${summary.media}`);
    console.log(`Users: ${summary.users}`);
    console.log(`Categories: ${summary.categories}`);
    console.log(`Tags: ${summary.tags}`);
    if (Object.keys(summary.customPostTypes).length > 0) {
      console.log('\nCustom Post Types:');
      Object.entries(summary.customPostTypes).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });
    }
    console.log('\n' + '='.repeat(60));
    console.log(`Export saved to: ${EXPORT_DIR}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  }
}

// Run the export
exportWordPressContent();
