# Supabase Setup Complete! ✅

Your Next.js app is now fully connected to Supabase with TypeScript types and helper functions.

---

## 📁 Files Created

### Core Supabase Files
- `lib/supabase/client.ts` - Browser/client-side Supabase client
- `lib/supabase/server.ts` - Server-side Supabase client for Server Components
- `lib/supabase/queries.ts` - Pre-built query functions for common operations
- `lib/supabase/index.ts` - Exports for easy imports
- `types/database.types.ts` - Auto-generated TypeScript types from your database
- `types/index.ts` - Type exports

### Utility Files
- `lib/utils.ts` - Helper functions (media URLs, date formatting, meta tags)
- `lib/constants.ts` - Site-wide constants

### Test Page
- `app/test/page.tsx` - Test page to verify Supabase connection

---

## 🎯 How to Use

### In Server Components (Recommended)
```tsx
import { getArticles, getStates } from '@/lib/supabase'

export default async function Page() {
  const articles = await getArticles(10)
  const states = await getStates()
  
  return (
    <div>
      {articles.map(article => (
        <div key={article.id}>{article.title}</div>
      ))}
    </div>
  )
}
```

### In Client Components
```tsx
'use client'

import { createBrowserClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function Component() {
  const [data, setData] = useState([])
  const supabase = createBrowserClient()
  
  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('articles').select('*')
      setData(data || [])
    }
    loadData()
  }, [])
  
  return <div>...</div>
}
```

### Using Media URLs
```tsx
import { getMediaUrl } from '@/lib/utils'
import Image from 'next/image'

export default function Component({ article }) {
  return (
    <Image
      src={getMediaUrl('some-image.jpg')}
      alt="Article image"
      width={800}
      height={600}
    />
  )
}
```

---

## 📚 Available Query Functions

All functions are in `lib/supabase/queries.ts`:

### Articles
- `getArticles(limit?)` - Get published articles
- `getArticleBySlug(slug)` - Get single article with category

### Locations
- `getStates()` - Get all states
- `getStateBySlug(slug)` - Get single state
- `getCitiesByState(stateId, limit?)` - Get cities in a state
- `getCityBySlug(stateSlug, citySlug)` - Get single city with state data

### Lawyers
- `getLawyers(limit?)` - Get all lawyers
- `getLawyerBySlug(slug)` - Get single lawyer with law firm
- `getLawyersByCity(cityId)` - Get lawyers for a specific city

### Content
- `getQuestions()` - Get all FAQs
- `getVideos(limit?)` - Get published videos
- `getStages()` - Get divorce stages
- `getEmotions()` - Get emotions content

---

## 🔧 Helper Functions

Available in `lib/utils.ts`:

- `getMediaUrl(filename)` - Convert filename to full Supabase Storage URL
- `extractFilenameFromUrl(url)` - Extract filename from WordPress URL
- `formatDate(date)` - Format date for display
- `truncateText(text, maxLength)` - Truncate long text
- `stripHtml(html)` - Remove HTML tags
- `generateMetaTags({...})` - Generate SEO meta tags

---

## 🧪 Test the Connection

Visit http://localhost:3000/test to verify everything works!

You should see:
- List of states
- List of articles
- ✅ Connection success message

---

## 📝 TypeScript Types

All database types are auto-generated in `types/database.types.ts`. Import them like:

```typescript
import type { Database } from '@/types/database.types'

type Article = Database['public']['Tables']['articles']['Row']
type State = Database['public']['Tables']['states']['Row']
```

---

## 🔄 Regenerate Types (When Schema Changes)

When you update your database schema, regenerate types:

```bash
supabase gen types typescript --project-id fdkbpedvibbblvrmwaeg > types/database.types.ts
```

Or add to package.json:
```json
"scripts": {
  "gen:types": "supabase gen types typescript --project-id fdkbpedvibbblvrmwaeg > types/database.types.ts"
}
```

---

## ✅ What's Ready

You now have:
- ✅ Supabase client configured for browser & server
- ✅ TypeScript types generated from your database
- ✅ Helper query functions for all content types
- ✅ Utility functions for common tasks
- ✅ Test page to verify connection
- ✅ Constants for site-wide configuration

**You're ready to start building pages!** 🚀

---

## 🚀 Next Steps

Ready to build:
1. Homepage with hero and featured content
2. Article listing and detail pages
3. State and city directory pages
4. Lawyer directory and profiles
5. Video gallery
6. FAQ page

Which would you like to start with?

