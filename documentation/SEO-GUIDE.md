# SEO Implementation Guide

This document outlines the SEO strategy and implementation approach for DivorceLawyer.com. Use this as a reference when creating or updating pages.

## 📋 Table of Contents

1. [Core SEO Requirements](#core-seo-requirements)
2. [Next.js Metadata API](#nextjs-metadata-api)
3. [Structured Data (Schema.org)](#structured-data-schemaorg)
4. [Page-Specific Implementation](#page-specific-implementation)
5. [Best Practices](#best-practices)
6. [Checklist](#checklist)

---

## Core SEO Requirements

Every public-facing page must include:

### 1. **Meta Tags**
- ✅ **Title** (50-60 characters, unique per page)
- ✅ **Description** (150-160 characters, compelling and unique)
- ✅ **Keywords** (relevant, comma-separated)
- ✅ **Canonical URL** (prevents duplicate content)
- ✅ **Robots meta** (index, follow)

### 2. **Open Graph Tags** (Social Media)
- ✅ `og:title`
- ✅ `og:description`
- ✅ `og:image` (1200x630px recommended)
- ✅ `og:url`
- ✅ `og:type` (usually "website" or "article")
- ✅ `og:site_name`

### 3. **Twitter Card Tags**
- ✅ `twitter:card` (summary_large_image)
- ✅ `twitter:title`
- ✅ `twitter:description`
- ✅ `twitter:image`

### 4. **Structured Data (JSON-LD)**
- ✅ Organization schema (site-wide)
- ✅ WebSite schema (homepage)
- ✅ Page-specific schemas (Article, FAQPage, LocalBusiness, etc.)

### 5. **Semantic HTML**
- ✅ Proper heading hierarchy (h1 → h2 → h3)
- ✅ One `<h1>` per page
- ✅ Semantic elements (`<article>`, `<section>`, `<nav>`, etc.)
- ✅ Alt text for all images

---

## Next.js Metadata API

Next.js 13+ uses the `Metadata` type for SEO. Export a `metadata` object from your page component.

### Basic Example

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title | DivorceLawyer.com',
  description: 'Compelling 150-160 character description that includes keywords and a call to action.',
  keywords: ['keyword1', 'keyword2', 'keyword3'],
  openGraph: {
    title: 'Page Title | DivorceLawyer.com',
    description: 'OG description (can be same as meta description)',
    url: 'https://divorcelawyer.com/your-page',
    siteName: 'DivorceLawyer.com',
    images: [
      {
        url: 'https://divorcelawyer.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Descriptive alt text',
      },
    ],
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

### Dynamic Metadata (for dynamic routes)

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  // Fetch data for this specific page
  const pageData = await getPageData(params.id)
  
  return {
    title: `${pageData.title} | DivorceLawyer.com`,
    description: pageData.description,
    // ... rest of metadata
  }
}
```

---

## Structured Data (Schema.org)

Structured data helps search engines understand your content better. Add JSON-LD scripts to your pages.

### Organization Schema (Site-Wide)

Add to every page:

```typescript
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'DivorceLawyer.com',
  url: 'https://divorcelawyer.com',
  logo: 'https://divorcelawyer.com/images/HeaderWhte-logo.svg',
  description: 'Your organization description',
  sameAs: [
    'https://www.facebook.com/divorcelawyer',
    'https://twitter.com/divorcelawyerhq',
  ],
}
```

### WebSite Schema (Homepage)

```typescript
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'DivorceLawyer.com',
  url: 'https://divorcelawyer.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://divorcelawyer.com/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}
```

### FAQPage Schema

For pages with FAQs:

```typescript
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: questions.map((q) => ({
    '@type': 'Question',
    name: q.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: q.answer,
    },
  })),
}
```

### Article Schema

For blog posts/articles:

```typescript
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: article.excerpt,
  image: article.featured_image_url,
  datePublished: article.published_at,
  dateModified: article.updated_at,
  author: {
    '@type': 'Person',
    name: article.author_name,
  },
  publisher: {
    '@type': 'Organization',
    name: 'DivorceLawyer.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://divorcelawyer.com/images/HeaderWhte-logo.svg',
    },
  },
}
```

### LocalBusiness Schema

For location/lawyer pages:

```typescript
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LegalService',
  name: 'Law Firm Name',
  description: 'Law firm description',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '123 Main St',
    addressLocality: 'City',
    addressRegion: 'State',
    postalCode: '12345',
    addressCountry: 'US',
  },
  telephone: '+1-555-123-4567',
  url: 'https://divorcelawyer.com/law-firm/slug',
  image: 'https://divorcelawyer.com/firm-image.jpg',
  priceRange: '$$',
  areaServed: {
    '@type': 'City',
    name: 'City Name',
  },
}
```

### BreadcrumbList Schema

For navigation breadcrumbs:

```typescript
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://divorcelawyer.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Category',
      item: 'https://divorcelawyer.com/category',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Current Page',
      item: 'https://divorcelawyer.com/current-page',
    },
  ],
}
```

### Rendering Structured Data

Add to your page component:

```tsx
return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(organizationSchema),
      }}
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(pageSpecificSchema),
      }}
    />
    {/* Your page content */}
  </>
)
```

---

## Page-Specific Implementation

### Homepage (`app/page.tsx`)

**Required:**
- ✅ Organization schema
- ✅ WebSite schema
- ✅ FAQPage schema (if FAQs exist)
- ✅ Comprehensive metadata with keywords

**Example:**
```typescript
export const metadata: Metadata = {
  title: 'DivorceLawyer.com - The Best Divorce Lawyers and Expert Resources',
  description: 'Connect with vetted divorce lawyers in your area. Access expert resources, articles, and guidance to navigate your divorce journey with confidence.',
  keywords: ['divorce lawyer', 'divorce attorney', 'family law attorney', ...],
  // ... full metadata object
}
```

### Article Pages (`app/articles/[slug]/page.tsx`)

**Required:**
- ✅ Article schema
- ✅ BreadcrumbList schema
- ✅ Dynamic metadata based on article data
- ✅ Author information

### Location Pages (`app/locations/[state]/[city]/page.tsx`)

**Required:**
- ✅ LocalBusiness schema (for each law firm)
- ✅ BreadcrumbList schema
- ✅ Location-specific keywords
- ✅ Geographic metadata

### Lawyer Profile Pages (`app/lawyers/[slug]/page.tsx`)

**Required:**
- ✅ Person schema
- ✅ LocalBusiness schema (law firm)
- ✅ Professional credentials
- ✅ Service area information

---

## Best Practices

### Title Tags
- ✅ **Length:** 50-60 characters (including site name)
- ✅ **Format:** `Primary Keyword | DivorceLawyer.com`
- ✅ **Unique:** Every page must have a unique title
- ✅ **Keywords:** Include primary keyword near the beginning
- ✅ **Brand:** Include "DivorceLawyer.com" at the end

**Examples:**
- ✅ `Divorce Lawyers in Atlanta, GA | DivorceLawyer.com`
- ✅ `Child Custody Laws by State | DivorceLawyer.com`
- ❌ `Page 1` (too generic)
- ❌ `Divorce Lawyer Divorce Attorney Family Law Attorney Divorce Help Divorce Resources` (too long, keyword stuffing)

### Meta Descriptions
- ✅ **Length:** 150-160 characters
- ✅ **Compelling:** Include a call to action
- ✅ **Keywords:** Naturally include primary keywords
- ✅ **Unique:** Every page must have a unique description
- ✅ **Value:** Explain what the user will find on the page

**Examples:**
- ✅ `Find experienced divorce lawyers in Atlanta, GA. Connect with vetted family law attorneys specializing in child custody, alimony, and property division. Get expert guidance today.`
- ❌ `Divorce lawyers.` (too short, no value)
- ❌ `This page contains information about divorce lawyers and divorce attorneys and family law and child custody and alimony and property division and...` (keyword stuffing)

### Keywords
- ✅ **Relevant:** Only include keywords relevant to the page
- ✅ **Natural:** Use natural language, avoid stuffing
- ✅ **Location-based:** Include location keywords for location pages
- ✅ **Long-tail:** Include long-tail keywords when relevant

### Images
- ✅ **Alt text:** Every image must have descriptive alt text
- ✅ **File names:** Use descriptive file names (e.g., `divorce-lawyer-atlanta.jpg`)
- ✅ **OG images:** 1200x630px for social sharing
- ✅ **Optimization:** Compress images, use WebP format when possible

### URLs
- ✅ **Canonical:** Always include canonical URL
- ✅ **Clean:** Use readable URLs (e.g., `/divorce-lawyers/atlanta-ga`)
- ✅ **HTTPS:** Always use HTTPS
- ✅ **Trailing slash:** Be consistent (we use no trailing slash)

### Content
- ✅ **H1:** One H1 per page with primary keyword
- ✅ **Headings:** Use proper hierarchy (H1 → H2 → H3)
- ✅ **Keywords:** Use keywords naturally in content
- ✅ **Internal links:** Link to related pages
- ✅ **External links:** Link to authoritative sources
- ✅ **Fresh content:** Update content regularly

---

## Checklist

Use this checklist for every new page:

### Meta Tags
- [ ] Unique title (50-60 chars)
- [ ] Unique description (150-160 chars)
- [ ] Relevant keywords
- [ ] Canonical URL
- [ ] Robots meta (index, follow)

### Open Graph
- [ ] og:title
- [ ] og:description
- [ ] og:image (1200x630px)
- [ ] og:url
- [ ] og:type
- [ ] og:site_name

### Twitter Card
- [ ] twitter:card
- [ ] twitter:title
- [ ] twitter:description
- [ ] twitter:image

### Structured Data
- [ ] Organization schema
- [ ] Page-specific schema (Article, FAQPage, LocalBusiness, etc.)
- [ ] BreadcrumbList schema (if applicable)

### Content
- [ ] One H1 with primary keyword
- [ ] Proper heading hierarchy
- [ ] Alt text on all images
- [ ] Internal links to related pages
- [ ] Semantic HTML elements

### Technical
- [ ] Page loads quickly (< 3 seconds)
- [ ] Mobile-responsive
- [ ] Valid HTML
- [ ] No broken links
- [ ] HTTPS enabled

---

## Testing & Validation

### Tools to Use

1. **Google Rich Results Test**
   - https://search.google.com/test/rich-results
   - Validates structured data

2. **Google Search Console**
   - Monitor indexing, performance, and issues

3. **PageSpeed Insights**
   - https://pagespeed.web.dev/
   - Check page speed and Core Web Vitals

4. **Schema Markup Validator**
   - https://validator.schema.org/
   - Validates JSON-LD structured data

5. **Facebook Sharing Debugger**
   - https://developers.facebook.com/tools/debug/
   - Preview how pages appear when shared

6. **Twitter Card Validator**
   - https://cards-dev.twitter.com/validator
   - Preview Twitter card appearance

### Common Issues to Avoid

- ❌ **Duplicate content:** Always use canonical URLs
- ❌ **Missing alt text:** Every image needs alt text
- ❌ **Keyword stuffing:** Use keywords naturally
- ❌ **Broken links:** Regularly check for 404s
- ❌ **Slow loading:** Optimize images and code
- ❌ **Missing structured data:** Add relevant schemas
- ❌ **Generic titles:** Make titles specific and unique

---

## Quick Reference

### Homepage Template

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title | DivorceLawyer.com',
  description: '150-160 character description',
  keywords: ['keyword1', 'keyword2'],
  openGraph: { /* ... */ },
  twitter: { /* ... */ },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://divorcelawyer.com/page' },
}

export default function Page() {
  // Structured data
  const organizationSchema = { /* ... */ }
  const pageSchema = { /* ... */ }
  
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      {/* Page content */}
    </>
  )
}
```

---

## Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Schema.org Documentation](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

---

**Last Updated:** 2025-01-27
**Maintained by:** Development Team



