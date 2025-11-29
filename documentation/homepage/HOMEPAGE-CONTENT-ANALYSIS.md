# Homepage Content Analysis

## Overview
This document details all hardcoded content on the homepage that should be moved to the database for admin management.

## Section-by-Section Breakdown

### 1. Hero Section (Lines 83-139)
**Location**: `app/page.tsx` lines 83-139

**Hardcoded Content**:
- **Title**: "The Best Divorce Lawyers and Expert Resources" (line 89)
- **Subtitle**: "Go your <span>own</span> way" (line 93)
- **Description**: "We're your go-to source for all things divorce..." (line 97)
- **Mobile Image**: `/media/NewLife-DivorceLawyer.webp` (line 114)
- **Desktop Image**: `/media/home-1.webp` (line 128)
- **CTA Buttons**:
  - "Find a Lawyer" → `/connect-with-lawyer` (line 101)
  - "Learn" → `/learning-center` (line 104)

**Database Table**: `homepage_content`
**Section Key**: `hero`

### 2. Discover Slider (Lines 47-76, 142)
**Location**: `app/page.tsx` lines 47-76, 142

**Hardcoded Content**: Array of 4 slides (lines 47-76)
1. **Slide 1**:
   - Image: `/media/DL-Site-Tour-Slide-1.png`
   - Subtitle: "Discover the Site"
   - Description: "Explore and access all the educational resources..."
   - Caption: "DISCOVER THE SITE"
   - Link: "Learn About Us" → `/about`

2. **Slide 2**:
   - Image: `/media/pick-a-journey.png`
   - Subtitle: "Pick a Journey"
   - Description: "Choose to explore a journey..."
   - Caption: "PICK A JOURNEY"
   - Link: "Explore Stages of Divorce" → `/stages`

3. **Slide 3**:
   - Image: `/media/explore-all-content-for-divorce.png`
   - Subtitle: "Learn And Explore"
   - Description: "Access the site's learning portal..."
   - Caption: "LEARN AND EXPLORE"
   - Link: "Explore Divorce Resources" → `/learning-center`

4. **Slide 4**:
   - Image: `/media/connect-with-vetted-lawyer.png`
   - Subtitle: "Connect with a Vetted Lawyer"
   - Description: "Ready to take the next step?..."
   - Caption: "CONNECT WITH A VETTED LAWYER"
   - Link: "Find a Lawyer" → `/find-lawyer`

**Database Table**: `homepage_content`
**Section Key**: `discover_slider`
**Note**: Each slide should be a separate row with `order_index`

### 3. Three Pack Component (Lines 144-150)
**Status**: ✅ Already database-driven
- Uses `lawFirms` from database
- Uses `defaultCityDisplay` and `defaultStateCode` (hardcoded, should use site_settings)

### 4. Most Popular Reads (Lines 152-158)
**Status**: ✅ Already database-driven
- Uses `articles` from database

### 5. Stages of Divorce (Lines 160-229)
**Status**: ✅ Already database-driven
- Uses `stages` from database
- **Hardcoded**: Section title and description (lines 167, 171)

**Hardcoded Content**:
- **Title**: "Stages of Divorce" (line 167)
- **Description**: "Divorce can feel like a rollercoaster ride..." (line 171)
- **Button Text**: "Learn More about the Stages of Divorce" (line 224)

**Database Table**: `homepage_content`
**Section Key**: `stages_section`

### 6. Emotional Path (Lines 231-269)
**Status**: ✅ Already database-driven
- Uses `emotions` from database
- **Hardcoded**: Section title and description (lines 237, 241)

**Hardcoded Content**:
- **Title**: "The Emotional Path Through Divorce" (line 237)
- **Description**: "A divorce is a major life change..." (line 241)
- **Button Text**: "Explore Emotions Along the Process" (line 264)

**Database Table**: `homepage_content`
**Section Key**: `emotions_section`

### 7. Real Voices (Lines 271-302)
**Status**: ❌ Completely hardcoded

**Hardcoded Content**:
- **Title**: "Real Voices: Coffee Talk" (line 276)
- **Description**: "A safe space where real people..." (line 280)
- **Stories Array** (lines 284-290):
  1. "I wish I had taken alimony" - Anonymous
  2. "Who to trust?" - Tiffany G.
  3. "Legal jargon is overwhelming" - Carrie R.
  4. "It was never the last time" - Anonymous
  5. "Am I a failure because I'm getting divorced?" - Jeri E.
- **Button Text**: "Explore Real Voices" (line 298)

**Database Table**: 
- Section metadata: `homepage_content` (section: `real_voices_section`)
- Stories: `real_voices_stories`

### 8. Categories Section (Lines 304-352)
**Status**: ❌ Completely hardcoded

**Hardcoded Content**:
- **Title**: "Get Informed. Get Empowered." (line 311)
- **Description**: "Read up on essential divorce topics..." (line 315)
- **Categories Array** (lines 321-329):
  1. "Child Custody"
  2. "Spousal Support"
  3. "Finances"
  4. "Business Interests"
  5. "Separation"
  6. "Behavioral Issues"
  7. "The Divorce Process"
- **Button Text**: "Browse Categories" (line 347)

**Database Table**: 
- Section metadata: `homepage_content` (section: `categories_section`)
- Categories: `content_categories`

### 9. Connect CTA (Lines 354-399)
**Status**: ❌ Completely hardcoded

**Hardcoded Content**:
- **Title**: "Introductions, no pressure" (line 360)
- **Subtitle**: "Connect with a Top Divorce Attorney" (line 364)
- **Description**: "Are you in a different location?..." (line 368)
- **Image**: `/media/connect-with-vetted-lawyer.png` (line 389)
- **Form Placeholder**: "Type your city or zipcode." (line 375)
- **Button Text**: "Find a Lawyer" (line 381)

**Database Table**: `homepage_content`
**Section Key**: `connect_cta`

### 10. FAQ Section (Lines 401-427)
**Status**: ✅ Already database-driven
- Uses `questions` from database
- **Hardcoded**: Section title and description (lines 406, 410)

**Hardcoded Content**:
- **Title**: "Common Questions" (line 406)
- **Description**: "Here are some of the most commonly asked questions..." (line 411)
- **Subtitle**: "Seeking More Answers?" (line 418)
- **Button Text**: "Visit Top Questions" (line 423)

**Database Table**: `homepage_content`
**Section Key**: `faq_section`

### 11. Default Location (Lines 23-25)
**Status**: ❌ Hardcoded

**Hardcoded Content**:
- `defaultCity = 'atlanta'`
- `defaultCityDisplay = 'Atlanta'`
- `defaultStateCode = 'GA'`

**Database Table**: `site_settings`
**Keys**: `default_city`, `default_city_display`, `default_state_code`

## Summary

### Database-Driven ✅
- Law Firms (ThreePackComponent)
- Articles (MostPopularReads)
- Stages (data)
- Emotions (data)
- Questions/FAQ (data)

### Needs Database Migration ❌
1. Hero Section (title, subtitle, description, images, CTAs)
2. Discover Slider (all 4 slides)
3. Real Voices (section metadata + all stories)
4. Categories Section (section metadata + category list)
5. Connect CTA (all content)
6. Section titles/descriptions for:
   - Stages section
   - Emotions section
   - FAQ section
7. Default location settings

## Migration Priority

### High Priority (User-Facing Content)
1. Hero Section
2. Discover Slider
3. Real Voices Stories
4. Categories

### Medium Priority (Settings)
5. Default Location
6. Section Titles/Descriptions

### Low Priority (Can be done later)
7. Connect CTA (less frequently changed)

## Implementation Notes

1. All content should have fallback values in case database is empty
2. Images should be stored in Supabase Storage, not hardcoded paths
3. Order/indexing should be managed in database
4. Active/inactive status for content management
5. Rich text support for descriptions (HTML allowed)
6. SEO metadata should be included for each section

