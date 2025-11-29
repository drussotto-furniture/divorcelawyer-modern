# WordPress to Next.js Migration Plan
## divorcelawyer.com

---

## Executive Summary

This document outlines the comprehensive plan for migrating divorcelawyer.com from WordPress to a modern tech stack:
- **Frontend**: Next.js 16+ with React 19 and TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel (recommended) or similar
- **Media**: Supabase Storage or Cloudinary

---

## Current Site Analysis

### Content Overview
Based on the WordPress XML export (divorcelawyercom.WordPress.2025-11-27.xml):

**Total Items**: 74,563 items in the WordPress export

**Standard Content:**
- **Posts**: 4 published, 2 drafts (6 total)
- **Pages**: 23 published, 6 drafts (29 total)
- **Media Files**: 440 attachments (images, PDFs, etc.)
- **Users/Authors**: 2 main authors
  - DivorceLawyer.com (74,310 items)
  - sorcram@gmail.com (252 items)
- **Navigation Menus**: 75 menu items
- **Contact Forms**: 12 Contact Form 7 forms

**Custom Post Types (Location-Based Architecture):**
The site has a massive location-based directory system:
- **States**: 52 (all US states + territories) - all published
- **Counties**: 3,217 counties - all published
- **Cities**: 29,585 cities - all published
- **Zip Codes**: 40,954 zip codes - all published
- **Markets**: 1 market definition

**Business Data:**
- **Law Firms**: 5 (all published)
- **Lawyers**: 5 individual lawyer profiles (all published)

**Educational Content:**
- **Articles**: 75 (all published)
- **Article Categories**: 7 (all published)
- **Videos**: 36 published, 3 drafts, 1 private (40 total)
- **Questions**: 16 (all published - FAQ/Q&A content)

**Process Content:**
- **Stages**: 6 (all published - divorce process stages)
- **Emotions**: 6 (all published - emotional support content)

**Team:**
- **Team Members**: 29 (all published)

---

## Architecture Decisions

### 1. Database Schema Design

#### Core Location Tables
```sql
-- States table
CREATE TABLE states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  abbreviation TEXT NOT NULL,
  content TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Counties table
CREATE TABLE counties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_id UUID REFERENCES states(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_id, slug)
);

-- Cities table
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_id UUID REFERENCES states(id),
  county_id UUID REFERENCES counties(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  meta_description TEXT,
  population INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_id, slug)
);

-- Zip codes table
CREATE TABLE zip_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES cities(id),
  zip_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Business/Lawyer Directory
```sql
-- Law firms table
CREATE TABLE law_firms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  city_id UUID REFERENCES cities(id),
  phone TEXT,
  email TEXT,
  website TEXT,
  rating DECIMAL(3,2),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lawyers table
CREATE TABLE lawyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID REFERENCES law_firms(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  bio TEXT,
  photo_url TEXT,
  email TEXT,
  phone TEXT,
  bar_number TEXT,
  years_experience INTEGER,
  specializations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lawyer service areas (many-to-many)
CREATE TABLE lawyer_service_areas (
  lawyer_id UUID REFERENCES lawyers(id),
  city_id UUID REFERENCES cities(id),
  PRIMARY KEY (lawyer_id, city_id)
);
```

#### Content Management
```sql
-- Blog posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID REFERENCES auth.users(id),
  featured_image_url TEXT,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles (educational content)
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category_id UUID REFERENCES article_categories(id),
  featured_image_url TEXT,
  status TEXT DEFAULT 'published',
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article categories
CREATE TABLE article_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions/FAQs
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Process & Support Content
```sql
-- Divorce stages
CREATE TABLE stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emotional support content
CREATE TABLE emotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  coping_strategies TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. URL Structure & SEO Preservation

**Current URL Patterns (to be analyzed):**
- Location pages: `/[state]/[city]/` or `/divorce-lawyer/[state]/[city]/`
- Lawyer profiles: `/lawyers/[lawyer-slug]/`
- Blog posts: `/[post-slug]/` or `/blog/[post-slug]/`
- Articles: `/articles/[article-slug]/`

**New URL Structure:**
```
/                           → Homepage
/[state-slug]/              → State page
/[state-slug]/[city-slug]/  → City page with lawyer listings
/lawyers/[slug]/            → Individual lawyer profile
/law-firms/[slug]/          → Law firm profile
/blog/[slug]/               → Blog posts
/articles/[slug]/           → Educational articles
/videos/[slug]/             → Video content
/resources/                 → Resource hub
/stages/[slug]/             → Divorce stages
/faq/                       → Questions/FAQ
```

**301 Redirects:**
- Implement in `next.config.js` or middleware
- Create redirect mapping CSV from old → new URLs
- Test all redirects before launch

### 3. Next.js App Structure

```
divorcelawyer-modern/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Homepage
│   │   ├── about/
│   │   └── contact/
│   ├── (locations)/
│   │   └── [state]/
│   │       ├── page.tsx          # State page
│   │       └── [city]/
│   │           └── page.tsx      # City page
│   ├── lawyers/
│   │   └── [slug]/
│   │       └── page.tsx          # Lawyer profile
│   ├── law-firms/
│   │   └── [slug]/
│   │       └── page.tsx          # Law firm profile
│   ├── blog/
│   │   ├── page.tsx              # Blog index
│   │   └── [slug]/
│   │       └── page.tsx          # Blog post
│   ├── articles/
│   │   ├── page.tsx              # Articles index
│   │   └── [slug]/
│   │       └── page.tsx          # Article detail
│   ├── videos/
│   ├── faq/
│   ├── stages/
│   ├── api/
│   │   ├── search/
│   │   └── contact/
│   └── layout.tsx
├── components/
│   ├── lawyers/
│   │   ├── LawyerCard.tsx
│   │   ├── LawyerList.tsx
│   │   └── LawyerSearch.tsx
│   ├── locations/
│   │   ├── StateSelector.tsx
│   │   ├── CitySelector.tsx
│   │   └── LocationBreadcrumb.tsx
│   ├── ui/                       # shadcn/ui components
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── queries/
│   ├── utils/
│   └── constants/
├── types/
│   ├── database.types.ts         # Generated from Supabase
│   └── index.ts
└── public/
    └── images/
```

---

## Migration Phases

### Phase 1: Data Export & Analysis ✅
**Status: Complete**
- [x] Export WordPress content via XML (74,563 items)
- [x] Export media files list (440 attachments)
- [x] Analyze content structure
- [x] Document accurate content counts
- [ ] Create detailed data mapping document for each content type

### Phase 2: Infrastructure Setup ✅
**Status: Complete**

1. **Supabase Project Setup** ✅
   - [x] Create Supabase project
   - [x] Configure database schema
   - [ ] Set up Row Level Security (RLS) policies
   - [ ] Create database functions and triggers

2. **Next.js Project Configuration** ✅
   - [x] Initialize Next.js project
   - [x] Install Supabase client libraries
   - [x] Configure environment variables
   - [ ] Set up ESLint and Prettier
   - [ ] Configure TypeScript strict mode

3. **Development Environment** ⏳
   - [ ] Set up local Supabase instance (optional)
   - [ ] Configure VS Code workspace
   - [ ] Set up git repository
   - [ ] Create development branch strategy

### Phase 3: Data Migration ⏳
**Timeline: Week 1-2**  
**Status: Partially Complete**

1. **Location Data Migration** ✅
   - [x] Import states (52 records) ✅
   - [x] Import counties (3,217 records) ✅
   - [x] Import cities (100 sample imported, 29,485 remaining) ⏳
   - [ ] Import zip codes (40,954 records pending)
   - [x] Establish relationships ✅

2. **Business Data Migration** ✅
   - [x] Import law firms (5 records) ✅
   - [x] Import lawyer profiles (5 records) ✅
   - [ ] Map lawyer-to-location relationships
   - [x] Verify data integrity ✅

3. **Content Migration** ✅
   - [x] Import blog posts ✅
   - [x] Import articles (75 records) ✅
   - [ ] Import videos (36 records - needs video_url extraction) ❌
   - [x] Import questions/FAQs (16 records) ✅
   - [x] Import stages and emotions content (12 records) ✅
   - [x] Preserve WordPress IDs for URL mapping ✅

4. **Team/Staff Migration** ❌
   - [ ] Import team members (29 records - schema mismatch) ❌

5. **Media Migration** ⏳
   - [ ] Download all media files (438+ files)
   - [ ] Upload to Supabase Storage or Cloudinary
   - [ ] Update image URLs in content
   - [ ] Generate responsive image sizes
   - [ ] Set up CDN caching

### Phase 4: Core Feature Development
**Timeline: Week 2-4**

1. **Homepage & Navigation**
   - Hero section with search
   - Featured lawyers
   - Location search/browse
   - Responsive navigation

2. **Location Pages**
   - State pages (dynamic)
   - City pages (dynamic)
   - County pages (if needed)
   - Location-based SEO

3. **Lawyer Directory**
   - Lawyer listing pages
   - Individual lawyer profiles
   - Search and filter functionality
   - Contact forms

4. **Content Pages**
   - Blog index and detail pages
   - Article index and detail pages
   - Video gallery
   - FAQ page

5. **Support Content**
   - Divorce stages pages
   - Emotional support content
   - Resource library

### Phase 5: Advanced Features
**Timeline: Week 4-5**

1. **Search Functionality**
   - Full-text search (Supabase FTS)
   - Location-based search
   - Lawyer search with filters
   - Search autocomplete

2. **Forms & Interactions**
   - Contact forms
   - Lawyer inquiry forms
   - Newsletter signup
   - Lead capture forms

3. **SEO Implementation**
   - Next.js Metadata API
   - Dynamic sitemaps
   - Structured data (JSON-LD)
   - robots.txt
   - Open Graph tags

4. **Performance Optimization**
   - Image optimization (Next.js Image)
   - Route prefetching
   - Incremental Static Regeneration (ISR)
   - Edge caching
   - Database query optimization

### Phase 6: Testing & QA
**Timeline: Week 5-6**

1. **Functional Testing**
   - All pages render correctly
   - Forms submit properly
   - Search works as expected
   - Navigation functions

2. **SEO Testing**
   - Verify all meta tags
   - Test structured data
   - Check 301 redirects
   - Validate sitemaps
   - Test robots.txt

3. **Performance Testing**
   - Lighthouse scores
   - Core Web Vitals
   - Page load times
   - Database query performance

4. **Cross-browser Testing**
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers (iOS Safari, Chrome Mobile)
   - Responsive design validation

5. **Accessibility Testing**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader compatibility

### Phase 7: Deployment & Launch
**Timeline: Week 6**

1. **Pre-launch**
   - Set up Vercel project
   - Configure production environment variables
   - Set up custom domain
   - Configure DNS
   - Test on staging environment

2. **Launch**
   - Deploy to production
   - Implement 301 redirects
   - Monitor error logs
   - Check analytics setup
   - Verify SEO tools (Search Console, etc.)

3. **Post-launch**
   - Monitor performance
   - Check for broken links
   - Verify search engine indexing
   - Monitor user feedback
   - Fix any critical issues

---

## Technical Specifications

### Performance Goals
- **Lighthouse Score**: 95+ on all metrics
- **Core Web Vitals**:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1
- **Time to First Byte (TTFB)**: < 600ms
- **Page Load Time**: < 3s on 3G

### SEO Requirements
- All meta tags properly implemented
- Structured data for:
  - Organization
  - Local Business (for law firms)
  - Person (for lawyers)
  - Article (for blog posts)
  - FAQPage (for questions)
- XML sitemaps (split by content type)
- 301 redirects for all old URLs
- Canonical URLs properly set
- Mobile-friendly (responsive design)

### Security Requirements
- HTTPS only
- Environment variables for secrets
- Supabase RLS policies
- Rate limiting on API routes
- Input validation and sanitization
- CORS configuration
- Content Security Policy headers

### Accessibility Requirements
- WCAG 2.1 AA compliance
- Semantic HTML
- ARIA labels where appropriate
- Keyboard navigation
- Focus indicators
- Alt text for all images
- Color contrast ratios

---

## Dependencies & Tools

### Core Dependencies
```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x"
  },
  "devDependencies": {
    "typescript": "^5",
    "tailwindcss": "^4",
    "@types/react": "^19",
    "@types/node": "^20",
    "eslint": "^9",
    "eslint-config-next": "^16"
  }
}
```

### Recommended Additional Packages
- **UI Components**: Headless UI or Radix UI
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns
- **Rich Text**: TipTap or similar (if needed for admin)
- **Analytics**: Vercel Analytics or Plausible
- **Error Tracking**: Sentry
- **Image Optimization**: Next.js Image + Cloudinary (optional)

---

## Risk Mitigation

### Potential Risks

1. **SEO Ranking Loss**
   - **Mitigation**: Proper 301 redirects, maintain URL structure, monitor Search Console
   - **Fallback**: Keep WordPress live temporarily, implement phased rollout

2. **Data Migration Errors**
   - **Mitigation**: Thorough testing, data validation scripts, backup plan
   - **Fallback**: Re-import from WordPress API if needed

3. **Performance Issues**
   - **Mitigation**: Load testing, CDN setup, database indexing
   - **Fallback**: Implement caching layers, optimize queries

4. **Missing Functionality**
   - **Mitigation**: Comprehensive feature audit before migration
   - **Fallback**: Phase 2 feature additions post-launch

---

## Success Metrics

### Technical Metrics
- Zero critical errors in production
- 99.9% uptime
- Lighthouse scores 95+
- Page load time < 3s

### Business Metrics
- Maintain or improve organic search traffic
- Maintain or improve conversion rates
- Reduce bounce rate
- Improve time on site

### User Experience Metrics
- Faster page loads (measure before/after)
- Better mobile experience
- Improved search functionality
- Better accessibility scores

---

## Next Steps

1. ✅ Complete WordPress data export
2. ⏳ Analyze exported data structure
3. ⏳ Create Supabase schema
4. Review and approve migration plan
5. Set up Supabase project
6. Begin data migration
7. Start frontend development

---

## Questions to Address

1. **Hosting**: Vercel, Netlify, or self-hosted?
2. **Media Storage**: Supabase Storage or Cloudinary?
3. **Analytics**: Which analytics platform?
4. **Error Tracking**: Sentry or alternative?
5. **Email Service**: For contact forms (SendGrid, Resend, etc.)
6. **CMS**: Do you need an admin panel, or manage content directly in Supabase?
7. **Authentication**: Do lawyers need login accounts?
8. **Payment Processing**: Any paid features? (Stripe, etc.)

---

*This migration plan will be updated as we analyze the exported WordPress data and refine our approach.*
