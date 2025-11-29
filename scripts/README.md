# Migration Scripts Guide

This directory contains scripts to migrate divorcelawyer.com from WordPress to Next.js/Supabase.

## Overview

The migration process consists of three main steps:

1. **Parse WordPress XML** → Extract structured data from the WordPress export
2. **Convert Content** → Transform Gutenberg blocks to React components/MDX
3. **Import to Supabase** → Load data into PostgreSQL database

---

## Step 1: Parse WordPress XML

### Script: `parse-wordpress-xml.py`

This Python script reads the WordPress XML export and extracts structured JSON files for each content type.

**Prerequisites:**
- Python 3.7+
- WordPress XML export file in `public/` directory

**Usage:**
```bash
python3 scripts/parse-wordpress-xml.py
```

**Output:**
Creates an `output/` directory with:
- JSON files for each content type
- CSV files for bulk import
- `redirects.csv` - URL mapping for 301 redirects
- `summary.json` - Migration statistics

**Output Files:**
- `states.json` (52 states)
- `counties.json` (3,217 counties)
- `cities.json` (sample of 100, full data is 29,585)
- `zip_codes.json` (sample of 100, full data is 40,954)
- `articles.json` (75 articles)
- `article_categories.json` (7 categories)
- `videos.json` (36 videos)
- `questions.json` (16 FAQs)
- `lawyers.json` (5 lawyers)
- `law_firms.json` (5 law firms)
- `stages.json` (6 divorce stages)
- `emotions.json` (6 emotional support pages)
- `team_members.json` (29 team members)
- `pages.json` (23 pages)
- `posts.json` (4 blog posts)

---

## Step 2: Set Up Supabase

### Before running the migration:

1. **Create a Supabase project** at https://supabase.com

2. **Run the database schema** from `MIGRATION-PLAN.md`:
   - Go to Supabase Dashboard → SQL Editor
   - Copy the schema from the Migration Plan
   - Execute the SQL to create all tables

3. **Set up environment variables** in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Configure Row Level Security (RLS)**:
   - Set up appropriate RLS policies for public read access
   - Restrict write access to authenticated users/service role

---

## Step 3: Migrate to Supabase

### Script: `migrate-to-supabase.ts`

This TypeScript script reads the JSON files from Step 1 and imports them into Supabase.

**Prerequisites:**
- Node.js 18+
- Supabase project configured
- Environment variables set
- `output/` directory from Step 1

**Install dependencies:**
```bash
npm install
# or
pnpm install
```

**Usage:**
```bash
npx tsx scripts/migrate-to-supabase.ts
```

**Migration Order:**
The script migrates content in dependency order:
1. States
2. Counties (depends on States)
3. Cities (depends on States, Counties)
4. Zip Codes (depends on Cities) - *optional, can be skipped initially*
5. Article Categories
6. Team Members
7. Articles (depends on Categories, Team Members)
8. Questions
9. Videos
10. Stages
11. Emotions
12. Law Firms
13. Lawyers (depends on Law Firms)

**Important Notes:**
- The script uses the Supabase service role key for full access
- Initial run only migrates sample data (100 cities, 100 zip codes)
- Full location data migration will take longer (~74,000 records)
- Each content type prints success/failure statistics

---

## Step 4: Content Conversion (Manual)

### Gutenberg Blocks to React Components

The articles contain Gutenberg blocks that need to be converted to React components:

**Common ACF Blocks:**
1. `acf/simple-hero-component` - Article hero with author
2. `acf/generic-content-template` - Main content area
3. `acf/related-articles-card` - Related articles widget
4. `acf/categories` - Category listing
5. `acf/connect-with-lawyer` - CTA section

**Conversion Strategy:**

**Option 1: Convert to MDX** (Recommended)
- Extract plain text content from Gutenberg blocks
- Save as MDX files with frontmatter
- Create React components to match ACF block functionality
- Use Next.js MDX support

**Option 2: Store as JSON**
- Parse Gutenberg block JSON structure
- Store in JSONB column in Supabase
- Render with custom React components

### Sample Article Structure:

```mdx
---
title: "I Wish I Had Taken Alimony"
excerpt: "If I were talking to my younger self, I'd say: take the money, it's yours."
slug: "i-wish-i-had-taken-alimony"
publishedAt: "2024-01-31"
author: "The DivorceLawyer.com Team"
categories: ["spousal-support", "life-after-divorce"]
stages: ["acceptance"]
emotions: ["regret"]
featuredImage: "/images/articles/alimony.jpg"
---

# I Wish I Had Taken Alimony

We divorced because my husband was terrible. Abusive, manipulative, controlling...

[Main content here]

## Starting Over

Without alimony, my number one focus became survival...

[Rest of content]
```

---

## Data Structure Notes

### Parsed Data Format

Each JSON file contains an array of items with this structure:

```json
{
  "title": "Article Title",
  "post_id": "12345",
  "post_name": "article-slug",
  "post_type": "articles",
  "status": "publish",
  "content": "<!-- Gutenberg blocks -->",
  "excerpt": "Short description",
  "post_date": "2024-01-31 01:40:00",
  "post_modified": "2024-02-15 10:30:00",
  "link": "https://www.divorcelawyer.com/articles/...",
  "meta": {
    "_yoast_wpseo_title": "SEO Title",
    "_yoast_wpseo_metadesc": "SEO Description",
    "_thumbnail_id": "13287",
    "article_categories": "serialized_array",
    "article_stages": "serialized_array",
    // ... more custom fields
  }
}
```

### Key Data Relationships

**States:**
- `_state_code` in meta (e.g., "AL", "NY")

**Articles:**
- `article_categories` - serialized PHP array of category IDs
- `article_stages` - serialized PHP array of stage IDs
- `article_emotions` - serialized PHP array of emotion IDs
- `_thumbnail_id` - featured image attachment ID

**Cities:**
- Need to parse state/county relationships from content or meta

---

## Full Location Data Migration

### For Production Migration:

To migrate ALL cities and zip codes (not just samples), modify `parse-wordpress-xml.py`:

```python
# Line 174-175, change:
'cities': self.cities[:100],  # Remove [:100] slice
'zip_codes': self.zip_codes[:100],  # Remove [:100] slice

# To:
'cities': self.cities,
'zip_codes': self.zip_codes,
```

**Warning:** Full location data creates ~74,000 records. Consider:
- Running during off-peak hours
- Using batch inserts (chunks of 1000)
- Monitoring database performance
- Creating database indexes after import

---

## Redirects

### `redirects.csv` Format:

```csv
old_url,new_url,status_code,post_type
https://www.divorcelawyer.com/articles/old-slug/,https://www.divorcelawyer.com/articles/new-slug/,301,articles
```

### Implementing Redirects in Next.js:

**Option 1: `next.config.js`**
```javascript
async redirects() {
  return [
    {
      source: '/articles/:slug',
      destination: '/learning-center/:slug',
      permanent: true,
    },
  ]
}
```

**Option 2: Middleware**
```typescript
import { NextResponse } from 'next/server'
import redirects from './redirects.json'

export function middleware(request) {
  const url = request.nextUrl.pathname
  const redirect = redirects[url]

  if (redirect) {
    return NextResponse.redirect(new URL(redirect, request.url), 301)
  }
}
```

---

## Troubleshooting

### Common Issues:

**1. Python script fails to parse XML:**
- Check file path is correct
- Ensure XML file is valid (not corrupted)
- Check available memory (large file)

**2. Supabase connection fails:**
- Verify environment variables
- Check service role key permissions
- Ensure RLS policies allow service role access

**3. Foreign key constraint errors:**
- Ensure parent records exist before children
- Check migration order (states → counties → cities)
- Verify UUID references are correct

**4. Content encoding issues:**
- HTML entities may need unescaping
- Check UTF-8 encoding throughout
- Test with sample articles first

---

## Next Steps

After successful migration:

1. **Verify Data Integrity**
   - Check all relationships are correct
   - Verify content renders properly
   - Test sample pages

2. **Build React Components**
   - Create components matching ACF blocks
   - Build article/page templates
   - Implement location page templates

3. **Media Migration**
   - Download 440 media files from WordPress
   - Upload to Supabase Storage or Cloudinary
   - Update image URLs in content

4. **Test Redirects**
   - Verify all old URLs redirect correctly
   - Monitor 404 errors
   - Update sitemap

5. **SEO Verification**
   - Check all meta tags
   - Verify structured data
   - Submit sitemap to Google

---

## Support

For questions or issues:
- See `DATA-STRUCTURE-ANALYSIS.md` for detailed data structure info
- See `MIGRATION-PLAN.md` for overall migration strategy
- Check parsed JSON files in `output/` for sample data

---

*Last Updated: 2025-11-26*
