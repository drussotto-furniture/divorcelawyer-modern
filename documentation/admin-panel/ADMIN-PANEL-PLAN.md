# Admin Panel Plan

## Overview
This document outlines the plan for creating a comprehensive admin panel to manage all content on divorcelawyer.com, including data imported from WordPress and new content.

## Database Schema Analysis

### Current Database Tables
1. **Location Data**
   - `states` - State information
   - `counties` - County information
   - `cities` - City information
   - `zip_codes` - Zip code data
   - `markets` - Geographic market areas

2. **Business/Directory**
   - `law_firms` - Law firm profiles
   - `lawyers` - Individual lawyer profiles
   - `lawyer_service_areas` - Many-to-many relationship

3. **Content**
   - `posts` - Blog posts
   - `articles` - Educational articles
   - `article_categories` - Article categorization
   - `videos` - Video content
   - `questions` - FAQ/Questions
   - `stages` - Divorce stages
   - `emotions` - Emotional support content

4. **Team & Media**
   - `team_members` - Team member profiles
   - `media` - Media library
   - `tags` - Content tags
   - `post_tags`, `article_tags` - Tag relationships

5. **Forms & Leads**
   - `contact_submissions` - Contact form submissions

## Homepage Content Analysis

### Currently Database-Driven ✅
- Law Firms (ThreePackComponent)
- Articles (MostPopularReads)
- Stages of Divorce
- Emotions
- Questions/FAQ

### Currently Hardcoded ❌ (Needs Database)
1. **Hero Section**
   - Title: "The Best Divorce Lawyers and Expert Resources"
   - Subtitle: "Go your own way"
   - Description text
   - Hero images (mobile & desktop)
   - CTA button text and links

2. **Discover Slider**
   - All 4 slides with:
     - Images
     - Subtitles
     - Descriptions
     - Captions
     - Links

3. **Real Voices Section**
   - Section title
   - Description
   - All story entries (title, description, author)

4. **Categories Section**
   - Section title
   - Description
   - Category list (7 categories)

5. **Connect CTA Section**
   - Title
   - Subtitle
   - Description
   - Image
   - Form placeholder text

6. **Default Location**
   - Default city/state (currently hardcoded to Atlanta, GA)

## Required Database Schema Additions

### 1. Homepage Content Table
```sql
CREATE TABLE homepage_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section TEXT NOT NULL, -- 'hero', 'discover_slider', 'real_voices', etc.
  key TEXT NOT NULL, -- unique identifier for each content piece
  title TEXT,
  subtitle TEXT,
  description TEXT,
  content JSONB, -- flexible JSON for section-specific data
  image_url TEXT,
  link_url TEXT,
  link_text TEXT,
  order_index INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section, key)
);
```

### 2. Site Settings Table
```sql
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  value_json JSONB, -- for complex settings
  description TEXT,
  category TEXT, -- 'general', 'homepage', 'seo', etc.
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Real Voices Stories Table
```sql
CREATE TABLE real_voices_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author TEXT,
  author_display_name TEXT, -- for anonymous stories
  featured BOOLEAN DEFAULT false,
  order_index INTEGER,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Content Categories Table (for homepage)
```sql
CREATE TABLE content_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  order_index INTEGER,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Admin Panel Structure

### Navigation Structure
```
/admin
├── Dashboard
├── Content
│   ├── Homepage
│   │   ├── Hero Section
│   │   ├── Discover Slider
│   │   ├── Real Voices
│   │   ├── Categories
│   │   └── Connect CTA
│   ├── Articles
│   ├── Videos
│   ├── Posts
│   └── Questions/FAQ
├── Directory
│   ├── Law Firms
│   ├── Lawyers
│   └── Locations (States/Cities)
├── Resources
│   ├── Stages
│   ├── Emotions
│   └── Categories
├── Media Library
├── Team
│   └── Team Members
├── Settings
│   ├── Site Settings
│   ├── SEO Settings
│   └── Default Locations
└── Forms
    └── Contact Submissions
```

## Admin Panel Features

### 1. Dashboard
- Overview statistics
- Recent activity
- Quick actions
- Content status overview

### 2. Content Management
- **Homepage Editor**: Visual editor for each homepage section
- **Article Editor**: Rich text editor with media support
- **Video Manager**: Upload/manage videos, embed external videos
- **FAQ Manager**: Create/edit questions and answers

### 3. Directory Management
- **Law Firm Manager**: 
  - CRUD operations
  - Logo upload
  - Lawyer assignment
  - Location management
  - Featured/verified status
- **Lawyer Manager**:
  - Profile management
  - Photo upload
  - Bio editor
  - Service areas assignment
  - Specializations
- **Location Manager**:
  - States/Counties/Cities
  - Bulk import
  - SEO metadata

### 4. Media Library
- Upload images/videos
- Organize by folders/tags
- Search and filter
- Bulk operations
- Image optimization
- CDN integration

### 5. Settings
- Site-wide settings
- Default homepage location
- SEO defaults
- Email templates
- Integration settings

## Implementation Plan

### Phase 1: Database Schema
1. Create new tables for homepage content
2. Create site_settings table
3. Create real_voices_stories table
4. Create content_categories table
5. Migrate hardcoded content to database

### Phase 2: Admin Panel Foundation
1. Set up admin authentication (Supabase Auth)
2. Create admin layout and navigation
3. Set up admin routing
4. Create dashboard page

### Phase 3: Content Management Pages
1. Homepage content editor
2. Article management
3. Video management
4. FAQ management

### Phase 4: Directory Management
1. Law firm management
2. Lawyer management
3. Location management

### Phase 5: Media Library
1. Upload functionality
2. Media browser
3. Integration with Supabase Storage

### Phase 6: Update Frontend
1. Update homepage to fetch from database
2. Add fallbacks for missing content
3. Implement caching strategy

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth
- **UI Components**: Custom components with Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Rich Text Editor**: TBD (consider TipTap or similar)
- **Image Upload**: Supabase Storage with image optimization

## Security Considerations

1. **Authentication**: Supabase Auth with role-based access
2. **RLS Policies**: Row-level security for admin access
3. **File Upload**: Validation and virus scanning
4. **API Rate Limiting**: Prevent abuse
5. **Audit Logging**: Track all admin actions

## Next Steps

1. Review and approve this plan
2. Create database migrations
3. Set up admin authentication
4. Build admin panel foundation
5. Implement content management pages incrementally

