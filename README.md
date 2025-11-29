# divorcelawyer-modern

Modern Next.js application migrating from WordPress (divorcelawyer.com)

## Stack

- **Frontend**: Next.js 16+ with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel (recommended)

## Project Structure

```
divorcelawyer-modern/
├── app/                    # Next.js App Router
├── components/             # React components
├── lib/                    # Utilities and helpers
├── scripts/                # Migration and utility scripts
├── supabase/               # Database schema and migrations
├── wordpress-export/       # Exported WordPress content
└── MIGRATION-PLAN.md       # Comprehensive migration plan
```

## Getting Started

### 1. WordPress Content Export

Export content from the live WordPress site:

```bash
npm run export:wordpress
```

This will fetch all content via the WordPress REST API and save it to `wordpress-export/`:
- Posts and pages
- Media files (list)
- Custom post types (states, counties, cities, lawyers, etc.)
- Users, categories, tags

### 2. Analyze Exported Content

Analyze the exported WordPress content:

```bash
npm run analyze:content
```

This generates a detailed analysis report at `wordpress-export/analysis-report.json`.

### 3. Download Media Files (Optional)

Download all media files from WordPress:

```bash
npm run download:media
```

This downloads 438+ media files to `wordpress-export/media/files/`.

## Site Architecture

The site has a sophisticated location-based directory system:

### Location Hierarchy
- **States**: 52 US states + territories
- **Counties**: 3,217 counties
- **Cities**: 20,000+ cities
- **Zip Codes**: TBD

### Business Directory
- **Law Firms**: Directory of divorce law firms
- **Lawyers**: Individual lawyer profiles with service areas

### Content Types
- **Blog Posts**: Standard blog content
- **Articles**: Educational content about divorce
- **Videos**: Video library
- **Questions**: FAQ system
- **Stages**: Divorce process stages
- **Emotions**: Emotional support content

## Database Schema

See [supabase/schema.sql](./supabase/schema.sql) for the complete PostgreSQL schema.

Key features:
- Location-based tables (states, counties, cities, zip codes)
- Lawyer and law firm directory
- Content management (posts, articles, videos, FAQs)
- Full-text search support
- SEO-optimized (slugs, meta fields)
- WordPress ID mapping for migration

## Next Steps

1. **Set up Supabase**
   - Create a new Supabase project
   - Run the schema.sql file
   - Configure environment variables

2. **Install Supabase Dependencies**
   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   Add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Run Data Migration**
   - Create migration scripts to import WordPress data into Supabase
   - Start with location data (states, counties, cities)
   - Then import business data (law firms, lawyers)
   - Finally import content (posts, articles, etc.)

5. **Start Development**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Migration Plan

See [MIGRATION-PLAN.md](./MIGRATION-PLAN.md) for the complete migration strategy, including:
- Detailed timeline
- Database schema design
- URL structure and SEO preservation
- Feature development phases
- Testing and deployment plan

## Key Features to Implement

1. **Location-Based Search**
   - Browse lawyers by state, county, city
   - Dynamic location pages
   - Location-based SEO

2. **Lawyer Directory**
   - Search and filter lawyers
   - Individual lawyer profiles
   - Law firm pages
   - Contact forms

3. **Content Hub**
   - Blog with pagination
   - Educational articles
   - Video library
   - FAQ system

4. **Divorce Resources**
   - Process stages guide
   - Emotional support content
   - State-specific information

5. **Lead Generation**
   - Contact forms
   - Lawyer inquiry forms
   - Email capture

## Performance Goals

- Lighthouse Score: 95+ on all metrics
- Core Web Vitals:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
- Page Load Time: < 3s

## SEO Requirements

- 301 redirects for all old URLs
- Proper meta tags and Open Graph
- Structured data (JSON-LD)
- XML sitemaps
- Mobile-friendly responsive design

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run export:wordpress` - Export WordPress content
- `npm run analyze:content` - Analyze exported content
- `npm run download:media` - Download media files

## License

Private project

## Notes

This is a migration project from an existing WordPress site. All WordPress data is being exported and migrated to a modern stack for better performance, security, and maintainability.
