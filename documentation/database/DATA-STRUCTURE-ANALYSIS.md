# WordPress Data Structure Analysis
## divorcelawyer.com Export Analysis

Export File: `divorcelawyercom.WordPress.2025-11-27.xml`
Export Date: November 27, 2025
Total Items: 74,563

---

## Executive Summary

The DivorceLawyer.com WordPress site is primarily a **location-based lawyer directory** with extensive geographical coverage across the United States. The site contains:

- **74,756 location records** (states, counties, cities, zip codes)
- **75 educational articles** about divorce topics
- **40 video resources**
- **16 FAQ questions**
- **5 law firms and 5 lawyer profiles**
- **29 team member profiles**
- **23 published pages** and only 4 blog posts

The vast majority of content (99%+) consists of location pages for SEO and local search optimization.

---

## Content Type Breakdown

### 1. Location Data (74,808 items - 99.3% of content)

This is the core of the site's architecture - a comprehensive US location directory.

#### States: 52 items
- All 50 US states + DC + territories
- **Status**: 52 published
- **URL Pattern**: `/[state-slug]/`
- **Purpose**: State landing pages with divorce information

#### Counties: 3,217 items
- Complete US county coverage
- **Status**: 3,217 published
- **URL Pattern**: `/[state-slug]/[county-slug]/` (likely)
- **Relationships**: Each county belongs to a state

#### Cities: 29,585 items
- Major and minor cities across the US
- **Status**: 29,585 published
- **URL Pattern**: `/[state-slug]/[city-slug]/`
- **Relationships**: Each city belongs to a state and county
- **Purpose**: City landing pages for local lawyer searches

#### Zip Codes: 40,954 items
- Comprehensive US zip code coverage
- **Status**: 40,954 published
- **Relationships**: Each zip code belongs to a city
- **Purpose**: Granular location targeting for SEO

#### Markets: 1 item
- Market definition (possibly for targeting specific regions)

**Migration Priority**: HIGH - This is the foundation of the site's SEO strategy

---

### 2. Educational Content (91 items)

#### Articles: 75 items
- **Status**: 75 published
- **Purpose**: Educational content about divorce topics
- **Content Structure**:
  - Uses Gutenberg blocks (wp:acf/...)
  - Custom ACF (Advanced Custom Fields) components
  - Table of contents
  - Author attribution to lawyers/team members
  - Related articles
  - Newsletter signup forms
- **SEO**: Rich meta descriptions, titles, Open Graph tags
- **Sample Topics**:
  - "Prenuptial Agreements and Divorce"
  - Divorce process guides
  - Financial considerations
  - Child custody information

#### Questions: 16 items
- **Status**: 16 published
- **Purpose**: FAQ/Q&A content
- **Integration**: Referenced in other pages' FAQ sections
- **Format**: Question/Answer pairs

**Migration Priority**: HIGH - Key content for SEO and user education

---

### 3. Video Content (40 items)

- **Status**: 36 published, 3 drafts, 1 private
- **Purpose**: Video education and resources
- **Integration**: Embedded in articles and standalone pages

**Migration Priority**: MEDIUM - Valuable content but fewer items

---

### 4. Taxonomy/Categories (7 items)

#### Article Categories: 7 items
- **Status**: 7 published
- **Purpose**: Organize articles by topic
- **Structure**: Custom post type with hero sections, CTAs, related content
- **Examples**:
  - Child Custody
  - Spousal Support
  - Property Division
  - Divorce Process
- **Features**:
  - Custom hero images
  - Category descriptions
  - "Most Popular Reads" sections
  - Three-pack lawyer components
  - FAQ sections

**Migration Priority**: HIGH - Required for article organization

---

### 5. Business Directory (10 items)

#### Law Firms: 5 items
- **Status**: 5 published
- **Purpose**: Featured law firm profiles
- **Fields** (expected):
  - Firm name
  - Address and location data
  - Phone, email, website
  - Description
  - Team members

#### Lawyers: 5 items
- **Status**: 5 published
- **Purpose**: Individual lawyer profiles
- **Fields** (expected):
  - Name, title
  - Bio and photo
  - Firm affiliation
  - Contact information
  - Practice areas
  - Service locations

**Migration Priority**: HIGH - Key business value proposition

---

### 6. Process & Support Content (12 items)

#### Stages: 6 items
- **Status**: 6 published
- **Purpose**: Divorce process stages/journey
- **Examples** (from taxonomy):
  - Disillusionment
  - Dissatisfaction
  - Decision
  - Action
  - Acceptance
  - Freedom

#### Emotions: 6 items
- **Status**: 6 published
- **Purpose**: Emotional support content
- **Examples** (from taxonomy):
  - Grief
  - Guilt
  - Anger
  - Fear
  - Relief
  - Hope

**Migration Priority**: MEDIUM - Supporting content for user journey

---

### 7. Team (29 items)

#### Team Members: 29 items
- **Status**: 29 published
- **Purpose**: DivorceLawyer.com team profiles
- **Integration**: Referenced in articles as authors/experts

**Migration Priority**: MEDIUM - Important for credibility

---

### 8. Standard WordPress Content

#### Pages: 29 items
- **Status**: 23 published, 6 drafts
- **Purpose**: Standard site pages
- **Expected Pages**:
  - Homepage
  - About
  - Contact
  - Learning Center
  - Resources
  - Privacy Policy, Terms
  - etc.

#### Posts: 6 items
- **Status**: 4 published, 2 drafts
- **Note**: Very few blog posts - site focuses on articles instead

#### Navigation Menus: 75 menu items
- Multiple menus: About, Connect, Learn, Mobile Menu, Header Top Menu, Copyright Menu, Categories Menu, etc.

#### Contact Forms: 12 items
- Contact Form 7 forms for lead capture and inquiries

#### Media/Attachments: 440 items
- Images, PDFs, and other media files
- Requires download and migration to new media storage

---

## Data Structure Observations

### WordPress Structure (Current)

1. **Heavy use of Advanced Custom Fields (ACF)**
   - Custom Gutenberg blocks: `acf/hero-component-secondary`, `acf/intro`, `acf/categories`, etc.
   - Complex field groups with nested data
   - All stored as serialized PHP data in post meta

2. **Post Meta Structure**
   - Extensive custom fields per post type
   - Yoast SEO meta (titles, descriptions, Open Graph)
   - City/location flags: `_city_top_city`, `_city_top_city_us`
   - Custom taxonomy meta

3. **Content Encoding**
   - Content stored as HTML/Gutenberg blocks
   - CDATA sections throughout
   - Serialized PHP arrays in meta values

4. **Relationships**
   - Articles → Article Categories
   - Lawyers → Law Firms
   - Cities → Counties → States
   - Zip Codes → Cities
   - Articles → Authors (Team Members/Lawyers)

### Challenges for Migration

1. **Scale**: 74,563 items to migrate
2. **Custom Fields**: Need to parse ACF field data from serialized PHP
3. **Gutenberg Blocks**: Need to convert to MDX or similar format
4. **Relationships**: Must maintain location hierarchies and associations
5. **URLs**: 74,000+ pages need proper 301 redirects
6. **SEO**: Critical to preserve meta data and structured data

---

## Recommended Migration Approach

### Phase 1: Location Data (Priority 1)
- Parse and import States → Counties → Cities → Zip Codes hierarchy
- Create proper foreign key relationships in Supabase
- Generate slugs and maintain WordPress IDs for redirect mapping

### Phase 2: Business Data (Priority 1)
- Import Law Firms
- Import Lawyers with firm relationships
- Map lawyers to service locations

### Phase 3: Content (Priority 1)
- Import Article Categories
- Import Articles with category relationships
- Convert Gutenberg blocks to React components or MDX
- Parse ACF fields into structured JSON
- Maintain author relationships

### Phase 4: Supporting Content (Priority 2)
- Import Questions (FAQs)
- Import Videos
- Import Stages and Emotions
- Import Team Members

### Phase 5: Standard Pages (Priority 2)
- Import and convert Pages
- Import Posts (minimal)
- Recreate navigation menus in Next.js
- Recreate contact forms

### Phase 6: Media (Priority 3)
- Download all 440 media files
- Upload to Supabase Storage or Cloudinary
- Update all image references in content

---

## Database Schema Recommendations

Based on this analysis, the Supabase schema in the MIGRATION-PLAN.md is accurate and appropriate. Key additions to consider:

### Additional Tables

```sql
-- Team members (for article authors)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  bio TEXT,
  photo_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add author reference to articles
ALTER TABLE articles
ADD COLUMN author_id UUID REFERENCES team_members(id);

-- Article tags/relationships
CREATE TABLE article_stages (
  article_id UUID REFERENCES articles(id),
  stage_id UUID REFERENCES stages(id),
  PRIMARY KEY (article_id, stage_id)
);

CREATE TABLE article_emotions (
  article_id UUID REFERENCES articles(id),
  emotion_id UUID REFERENCES emotions(id),
  PRIMARY KEY (article_id, emotion_id)
);
```

### Content Storage Strategy

**Option 1: Store Gutenberg Blocks as JSON**
- Store block structure in JSONB column
- Render on frontend with custom React components matching ACF blocks

**Option 2: Convert to MDX**
- Parse Gutenberg content to MDX
- Store as text with frontmatter
- Use Next.js MDX support for rendering

**Recommendation**: Option 2 (MDX) for better portability and developer experience

---

## URL Mapping Strategy

### Critical URLs to Preserve

1. **Location Pages** (~74,000 pages):
   - `/[state]/[city]/`
   - Analyze actual URL structure from sample pages

2. **Article Pages** (75):
   - Current: `/learning-center/[slug]/` or similar
   - New: `/articles/[slug]/` or `/learning-center/[slug]/`

3. **Category Pages** (7):
   - Current: `/learning-center/categories/[slug]/`
   - New: Keep same structure

4. **Video Pages** (36):
   - Analyze current structure

5. **Lawyer/Firm Pages** (10):
   - Current: `/dl-member/[firm-slug]/[lawyer-slug]/`
   - New: `/lawyers/[lawyer-slug]/`, `/law-firms/[firm-slug]/`

### Redirect Strategy

1. Create redirect map CSV: `old_url,new_url,status_code`
2. Implement in `next.config.js` or middleware
3. Test with redirect testing tool
4. Monitor 404s in production

---

## Next Steps

1. ✅ Complete content analysis
2. ⏳ Sample actual URL structure from live site or XML
3. ⏳ Create parsing scripts for each content type
4. ⏳ Test migration on sample data (e.g., 1 state → counties → cities)
5. ⏳ Validate relationships and data integrity
6. ⏳ Create content conversion pipeline (Gutenberg → MDX)
7. ⏳ Build redirect mapping file
8. ⏳ Begin full data migration

---

## Appendix: Sample Data Structures

### Sample Article Structure (from XML)

```xml
<item>
  <title>Prenuptial Agreements and Divorce</title>
  <wp:post_type>articles</wp:post_type>
  <wp:post_name>prenuptial-agreements-and-divorce-do-they-hold-up</wp:post_name>
  <wp:status>publish</wp:status>
  <content:encoded>
    <!-- Gutenberg blocks with ACF components -->
    <!-- wp:acf/simple-hero-component -->
    <!-- wp:acf/generic-content-template -->
    <!-- wp:acf/related-articles-card -->
    <!-- wp:acf/categories -->
    <!-- wp:acf/connect-with-lawyer -->
  </content:encoded>
  <wp:postmeta>
    <!-- Yoast SEO meta -->
    <!-- ACF field data -->
    <!-- Custom meta -->
  </wp:postmeta>
</item>
```

### Custom ACF Components to Rebuild

1. `acf/hero-component-secondary` - Hero sections
2. `acf/simple-hero-component` - Simpler hero with author
3. `acf/intro` - Introduction sections
4. `acf/generic-content-template` - Main content area
5. `acf/most-popular-reads` - Featured articles
6. `acf/categories` - Category listings
7. `acf/three-pack-component` - Lawyer directory widget
8. `acf/common-questions` - FAQ sections
9. `acf/connect-with-lawyer` - CTA sections
10. `acf/related-articles-card` - Related content

---

*Last Updated: 2025-11-26*
