# Page Building Guide - Learnings & Best Practices

This comprehensive guide documents all learnings from building the DivorceLawyer.com homepage, combining insights from Figma designs, WordPress exports, and development best practices. Use this as your reference when building new pages.

---

## 📋 Table of Contents

1. [Design System & Tokens](#design-system--tokens)
2. [Component Architecture](#component-architecture)
3. [Data Management](#data-management)
4. [SEO Implementation](#seo-implementation)
5. [Mobile Optimization](#mobile-optimization)
6. [WordPress Migration Patterns](#wordpress-migration-patterns)
7. [Page Structure Rules](#page-structure-rules)
8. [Common Patterns](#common-patterns)
9. [Checklist for New Pages](#checklist-for-new-pages)

---

## Design System & Tokens

### Color Palette

#### Primary Colors
```css
/* Primary Orange - CTAs, buttons, accents */
--primary-orange: #FC9445;

/* Secondary Brown - Links, text accents */
--secondary-brown: #B6572E;

/* Secondary Dark - Headings, text */
--secondary-dark: #604B30;
```

#### Background Colors
```css
/* Light backgrounds for sections */
--subtle-sand: #F4F2EC;      /* Section backgrounds */
--seashell: #F5F1ED;          /* Card backgrounds */
--peach-cream: #F8F1EA;       /* Article cards */
--soft-white: #FBFAF9;        /* Section backgrounds */
--warm-beige: #EFE8DF;        /* Backgrounds, borders */
--ivory-tint: #EDEAE1;        /* Backgrounds */
```

#### Dark/Teal Colors (Hero, Sections)
```css
/* Primary dark backgrounds */
--bluish: #163B46;            /* Hero, main sections */
--bluish-light: #235561;      /* Navigation, accents */
--dark-bluish: #18414D;       /* Search bar, dark sections */
--teal-haze: #6191A3;         /* Borders, text, dividers */
--dark-cyan: #2F778C;         /* Borders, accents */
```

#### Text Colors
```css
--text-black: #000000;
--text-dark-gray: #1A1A1A;
--text-charcoal: #3F3F3F;
--text-gray: #7A7474;         /* Placeholder text */
--text-beige-muted: #D4CDBB;  /* Hero subtitle */
--text-white: #FFFFFF;
```

**Tailwind Config**: These colors are defined in `tailwind.config.js` as:
- `primary` → `#FC9445`
- `bluish` → `#163B46`
- `bluishlight` → `#235561`
- etc.

### Typography

#### Font Families
```css
/* Primary Sans-Serif - Body text, buttons, navigation */
font-family: 'Proxima Nova', sans-serif;

/* Serif - Headings, large text */
font-family: 'Libre Bodoni', serif;

/* Fallbacks */
font-family: 'Helvetica', 'Roboto', sans-serif;
```

#### Heading Hierarchy

**H1 (Hero Title)**
- Font: Libre Bodoni
- Size: 90px (desktop) / 48px (mobile)
- Line Height: 84px (93%)
- Weight: 400
- Letter Spacing: -0.03em
- Color: #FFFFFF

**H2 (Section Titles)**
- Font: Libre Bodoni
- Size: 64px (desktop) / 36px (mobile)
- Line Height: 68px (106%)
- Weight: 400
- Letter Spacing: -0.03em
- Color: Varies (#000000, #FFFFFF, #B6572E, #3F3F3F)

**H3 (Subsection Titles)**
- Font: Libre Bodoni
- Size: 48px (desktop) / 32px (mobile)
- Line Height: 55px (115%)
- Weight: 400

**H4 (Card Titles)**
- Font: Libre Bodoni
- Size: 32px (desktop) / 24px (mobile)
- Line Height: 32px (100%)
- Weight: 400

#### Body Text

**Large Body**
- Font: Proxima Nova
- Size: 20px
- Line Height: 26px (130%)
- Weight: 300 or 400

**Regular Body**
- Font: Proxima Nova
- Size: 16px
- Line Height: 24px (150%)
- Weight: 400

**Small Text**
- Font: Proxima Nova
- Size: 14px
- Line Height: 18px (129%)
- Weight: 400-800

#### Buttons
- Font: Proxima Nova or Helvetica
- Size: 15px (Proxima) or 14px (Helvetica)
- Line Height: 32px
- Weight: 700
- Letter Spacing: 0.1em
- Text Transform: uppercase
- Color: #000000 (on orange buttons)

### Spacing System

#### Padding
```css
/* Buttons */
padding: 12px 18px;

/* Cards */
padding: 24px 20px;  /* or 24px 32px */

/* Sections */
padding: 60px 0;     /* or 80px 0 for large sections */
```

#### Gaps (Auto Layout)
```css
--gap-small: 4px;
--gap-medium: 8px;
--gap-default: 12px;
--gap-large: 16px;
--gap-xl: 24px;
--gap-xxl: 32px;
--gap-xxxl: 42px;
```

#### Border Radius
```css
/* Buttons - Fully rounded */
border-radius: 100px;

/* Cards */
border-radius: 10px, 12px, 15px, or 20px;

/* Input Fields - Fully rounded */
border-radius: 1000px;
```

### Component Specifications

#### Primary Button (Orange)
```css
background: #FC9445;
border-radius: 100px;
padding: 12px 18px;
font: Proxima Nova, 15px, 700;
color: #000000;
text-transform: uppercase;
letter-spacing: 0.1em;
```

#### Secondary Button (Outlined)
```css
border: 3px solid #FFFFFF;
border-radius: 100px;
padding: 12px 18px;
font: Proxima Nova, 15px, 700;
color: #FFFFFF;
text-transform: uppercase;
```

#### Cards
```css
/* Article Cards */
background: #F8F1EA;
border-radius: 10px;
padding: 24px 20px;

/* Category Cards */
background: #F4F2EC;
border-radius: 12px;
```

---

## Component Architecture

### Component Structure Pattern

```typescript
// components/YourComponent.tsx
'use client' // Only if using hooks/interactivity

import Image from 'next/image'
import Link from 'next/link'

interface YourComponentProps {
  // Define props with TypeScript
  title: string
  items: Array<{ id: string; name: string }>
  className?: string
}

export default function YourComponent({ 
  title, 
  items, 
  className = '' 
}: YourComponentProps) {
  return (
    <section className={`your-section ${className}`}>
      <h2 className="section-title">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="card">
            {/* Card content */}
          </div>
        ))}
      </div>
    </section>
  )
}
```

### Component Organization

```
components/
├── Header.tsx              # Site-wide header
├── Footer.tsx              # Site-wide footer
├── YourComponent.tsx        # Page-specific components
└── admin/                  # Admin-only components
    └── YourAdminForm.tsx
```

### Reusable Component Patterns

#### 1. **Card Components**
- Use consistent padding: `p-6` or `p-8`
- Background: `bg-peach-cream` or `bg-subtle-sand`
- Border radius: `rounded-lg` or `rounded-xl`
- Hover effects: `hover:shadow-lg transition-shadow`

#### 2. **Button Components**
- Primary: `bg-primary text-black font-bold uppercase`
- Secondary: `border-3 border-white text-white`
- Always use `rounded-full` for buttons
- Include proper spacing: `px-6 py-3`

#### 3. **Section Wrappers**
```typescript
<section className="py-16 lg:py-24 bg-subtle-sand">
  <div className="container mx-auto px-4">
    {/* Section content */}
  </div>
</section>
```

---

## Data Management

### Database-Driven Content

**Always prefer database-driven content over hardcoded values.**

#### Pattern for Fetching Data

```typescript
// app/your-page/page.tsx
import { getYourData } from '@/lib/supabase'

export default async function YourPage() {
  // Fetch data at the page level (Server Component)
  const data = await getYourData()
  
  // Handle empty states
  if (!data || data.length === 0) {
    return <EmptyState />
  }
  
  return (
    <div>
      <YourComponent items={data} />
    </div>
  )
}
```

#### Content That Should Be Database-Driven

✅ **Always Database-Driven:**
- Articles, Videos, Questions
- Lawyers, Law Firms
- Stages, Emotions
- Categories
- Locations (States, Cities, Counties, Zip Codes)

❌ **Currently Hardcoded (Should Migrate):**
- Hero section content
- Discover slider slides
- Real Voices stories
- Section titles/descriptions
- Default location settings
- CTA section content

### Content Management Pattern

```typescript
// Use homepage_content table for section metadata
const { data: heroContent } = await supabase
  .from('homepage_content')
  .select('*')
  .eq('section', 'hero')
  .single()

// Use specific tables for data
const { data: articles } = await supabase
  .from('articles')
  .select('*')
  .eq('status', 'published')
  .order('created_at', { ascending: false })
  .limit(6)
```

### Fallback Values

**Always provide fallbacks for database content:**

```typescript
const title = heroContent?.title || 'Default Title'
const description = heroContent?.description || 'Default description'
const items = data || [] // Empty array fallback
```

---

## SEO Implementation

### Required Metadata for Every Page

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title | DivorceLawyer.com',
  description: 'Compelling 150-160 character description with keywords.',
  keywords: ['keyword1', 'keyword2', 'keyword3'],
  openGraph: {
    title: 'Page Title | DivorceLawyer.com',
    description: 'OG description',
    url: 'https://divorcelawyer.com/your-page',
    siteName: 'DivorceLawyer.com',
    images: [{
      url: 'https://divorcelawyer.com/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Descriptive alt text',
    }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Page Title',
    description: 'Twitter description',
    images: ['https://divorcelawyer.com/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://divorcelawyer.com/your-page',
  },
}
```

### Structured Data (JSON-LD)

**Always include relevant structured data:**

```typescript
// Organization schema (site-wide)
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'DivorceLawyer.com',
  url: 'https://divorcelawyer.com',
  logo: 'https://divorcelawyer.com/logo.png',
  // ... more fields
}

// Page-specific schema
const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage', // or Article, FAQPage, etc.
  // ... page-specific fields
}

// Render in page
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
/>
```

### Semantic HTML

**Always use semantic HTML:**
- One `<h1>` per page
- Proper heading hierarchy (h1 → h2 → h3)
- Use `<article>`, `<section>`, `<nav>`, `<aside>`
- Alt text for all images
- Proper form labels

---

## Mobile Optimization

### Responsive Design Rules

#### 1. **Mobile-First Approach**
```css
/* Start with mobile styles, then add desktop */
.class {
  /* Mobile styles */
  padding: 1rem;
  font-size: 16px;
}

@media (min-width: 768px) {
  .class {
    /* Tablet styles */
    padding: 2rem;
    font-size: 18px;
  }
}

@media (min-width: 1024px) {
  .class {
    /* Desktop styles */
    padding: 3rem;
    font-size: 20px;
  }
}
```

#### 2. **Tailwind Responsive Classes**
```typescript
// Use Tailwind's responsive prefixes
<div className="
  text-sm md:text-base lg:text-lg
  p-4 md:p-6 lg:p-8
  grid-cols-1 md:grid-cols-2 lg:grid-cols-3
">
```

#### 3. **Typography Scaling**
```typescript
// Hero titles
<h1 className="text-4xl md:text-6xl lg:text-8xl">

// Section titles
<h2 className="text-3xl md:text-4xl lg:text-6xl">

// Body text
<p className="text-base md:text-lg lg:text-xl">
```

#### 4. **Image Optimization**
```typescript
// Always use Next.js Image component
<Image
  src="/path/to/image.webp"
  alt="Descriptive alt text"
  width={1200}
  height={630}
  className="w-full h-auto"
  priority={isAboveFold} // For hero images
/>
```

#### 5. **Touch Targets**
- Minimum 44x44px for interactive elements
- Adequate spacing between buttons/links
- Use `py-3 px-6` minimum for buttons

#### 6. **Mobile Navigation**
- Hamburger menu for mobile
- Overlay menu pattern
- Smooth transitions
- Close on outside click

### Common Mobile Patterns

#### Horizontal Scrolling Cards
```typescript
<div className="overflow-x-auto scrollbar-hide">
  <div className="flex gap-4 min-w-max">
    {items.map(item => (
      <Card key={item.id} className="w-80 flex-shrink-0" />
    ))}
  </div>
</div>
```

#### Stack on Mobile, Grid on Desktop
```typescript
<div className="flex flex-col md:flex-row gap-6">
  <div className="w-full md:w-1/2">Content 1</div>
  <div className="w-full md:w-1/2">Content 2</div>
</div>
```

---

## WordPress Migration Patterns

### Extracting Content from WordPress

#### 1. **ACF Blocks Pattern**
WordPress used ACF (Advanced Custom Fields) blocks. When migrating:

```typescript
// WordPress structure
{
  "acf": {
    "section_title": "Title",
    "section_description": "Description",
    "items": [...]
  }
}

// Next.js structure
{
  title: "Title",
  description: "Description",
  items: [...]
}
```

#### 2. **Image Path Migration**
```typescript
// WordPress paths
/wp-content/uploads/2024/01/image.jpg

// Next.js paths (after migration)
/media/image.webp

// Always convert to WebP format
// Store in Supabase Storage or /public/media/
```

#### 3. **Content Blocks Pattern**
WordPress used reusable content blocks. Replicate with:

```typescript
// Database: content_blocks table
// Component: ContentBlock component
// Admin: ContentBlockEditForm

const blocks = await getContentBlocks('homepage')
blocks.map(block => <ContentBlock key={block.id} block={block} />)
```

### Migration Checklist

- [ ] Extract all ACF field data
- [ ] Convert image paths to Next.js format
- [ ] Migrate to appropriate database tables
- [ ] Create admin forms for content management
- [ ] Verify all links and routes
- [ ] Test responsive design
- [ ] Verify SEO metadata

---

## Page Structure Rules

### Standard Page Template

```typescript
// app/your-page/page.tsx
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getYourData } from '@/lib/supabase'

// 1. SEO Metadata (required)
export const metadata: Metadata = {
  // ... metadata object
}

// 2. Page Component (Server Component)
export default async function YourPage() {
  // 3. Fetch data
  const data = await getYourData()
  
  // 4. Structured data
  const structuredData = { /* ... */ }
  
  return (
    <>
      {/* 5. Structured data script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* 6. Header */}
      <Header />
      
      {/* 7. Main content */}
      <main>
        {/* Hero section */}
        <section className="hero">
          <h1>Page Title</h1>
        </section>
        
        {/* Content sections */}
        <section className="content">
          {/* Your components */}
        </section>
      </main>
      
      {/* 8. Footer */}
      <Footer />
    </>
  )
}
```

### Section Order Pattern

1. **Hero Section** (above the fold)
2. **Primary Content** (main value proposition)
3. **Supporting Content** (related items, CTAs)
4. **FAQ/Questions** (if applicable)
5. **Final CTA** (conversion focus)

---

## Common Patterns

### 1. **Hero Section Pattern**

```typescript
<section className="hero bg-bluish text-white py-24 lg:py-32">
  <div className="container mx-auto px-4">
    <div className="max-w-3xl">
      <h1 className="text-4xl md:text-6xl lg:text-8xl font-serif mb-6">
        {title}
      </h1>
      <p className="text-xl md:text-2xl mb-8">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/cta-1" className="btn-primary">
          Primary CTA
        </Link>
        <Link href="/cta-2" className="btn-secondary">
          Secondary CTA
        </Link>
      </div>
    </div>
  </div>
</section>
```

### 2. **Card Grid Pattern**

```typescript
<section className="py-16 lg:py-24">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif mb-8">
      {sectionTitle}
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(item => (
        <Card key={item.id} item={item} />
      ))}
    </div>
  </div>
</section>
```

### 3. **Two-Column Layout Pattern**

```typescript
<section className="py-16 lg:py-24">
  <div className="container mx-auto px-4">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div>
        <Image src={image} alt={alt} />
      </div>
    </div>
  </div>
</section>
```

### 4. **CTA Section Pattern**

```typescript
<section className="bg-bluish text-white py-16 lg:py-24">
  <div className="container mx-auto px-4 text-center">
    <h2 className="text-3xl md:text-5xl font-serif mb-6">
      {ctaTitle}
    </h2>
    <p className="text-xl mb-8 max-w-2xl mx-auto">
      {ctaDescription}
    </p>
    <Link href="/action" className="btn-primary">
      {ctaButtonText}
    </Link>
  </div>
</section>
```

---

## Checklist for New Pages

### Pre-Development

- [ ] Review Figma designs (if available)
- [ ] Extract design tokens (colors, typography, spacing)
- [ ] Identify WordPress content (if migrating)
- [ ] Plan database structure
- [ ] Define component architecture

### Development

- [ ] Create page file with SEO metadata
- [ ] Implement responsive design (mobile-first)
- [ ] Use semantic HTML
- [ ] Add structured data (JSON-LD)
- [ ] Create reusable components
- [ ] Fetch data from database (not hardcoded)
- [ ] Add error handling and loading states
- [ ] Implement proper image optimization

### Post-Development

- [ ] Test on mobile devices
- [ ] Test on tablet devices
- [ ] Test on desktop
- [ ] Verify SEO metadata
- [ ] Check structured data validity
- [ ] Test all links and navigation
- [ ] Verify accessibility (alt text, semantic HTML)
- [ ] Performance check (Lighthouse)
- [ ] Cross-browser testing

### Content Management

- [ ] Create admin forms for editable content
- [ ] Document hardcoded vs database-driven content
- [ ] Set up fallback values
- [ ] Test content updates through admin panel

---

## Key Takeaways

### ✅ DO

1. **Always use database-driven content** when possible
2. **Mobile-first responsive design** - test on mobile first
3. **Semantic HTML** - proper heading hierarchy, semantic elements
4. **SEO metadata** - every page needs complete metadata
5. **Structured data** - include relevant JSON-LD schemas
6. **Reusable components** - build once, use everywhere
7. **Design tokens** - use consistent colors, typography, spacing
8. **Error handling** - graceful fallbacks for missing data
9. **Image optimization** - use Next.js Image component, WebP format
10. **Accessibility** - alt text, proper labels, keyboard navigation

### ❌ DON'T

1. **Don't hardcode content** - use database or environment variables
2. **Don't skip mobile optimization** - always test responsive design
3. **Don't forget SEO** - metadata is required for every page
4. **Don't use inline styles** - use Tailwind classes or SCSS
5. **Don't skip error handling** - always handle empty states
6. **Don't ignore accessibility** - semantic HTML, alt text, etc.
7. **Don't use large images** - optimize and use WebP
8. **Don't create one-off components** - make them reusable
9. **Don't skip structured data** - helps with SEO
10. **Don't forget to test** - mobile, tablet, desktop, browsers

---

## Resources

### Documentation Files
- `documentation/SEO-GUIDE.md` - Complete SEO implementation guide
- `documentation/styling-design/FIGMA-DESIGN-TOKENS.md` - Design system details
- `documentation/homepage/HOMEPAGE-CONTENT-ANALYSIS.md` - Content migration guide
- `documentation/EMAIL-SETUP.md` - Email service setup

### Code References
- `app/page.tsx` - Homepage implementation (reference)
- `components/` - Reusable component library
- `lib/supabase/queries.ts` - Database query patterns
- `tailwind.config.js` - Design tokens configuration

---

**Last Updated**: December 2024  
**Maintained By**: Development Team

---

## Quick Reference

### Color Classes (Tailwind)
```typescript
bg-primary        // #FC9445
bg-bluish         // #163B46
bg-bluishlight    // #235561
text-primary      // #FC9445
text-bluish       // #163B46
```

### Typography Classes
```typescript
font-serif        // Libre Bodoni
font-sans         // Proxima Nova
text-4xl          // 36px
text-6xl          // 60px
text-8xl          // 90px
```

### Spacing Classes
```typescript
py-16 lg:py-24    // Section padding
p-6               // Card padding
gap-6             // Grid gap
```

### Button Classes
```typescript
btn-primary       // Orange button
btn-secondary     // Outlined button
rounded-full      // Fully rounded
```

---

**Remember**: When in doubt, reference the homepage (`app/page.tsx`) as it follows all these patterns and best practices!

