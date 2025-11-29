/**
 * Get the full URL for a media file in Supabase Storage
 */
export function getMediaUrl(filename: string): string {
  if (!filename) return ''
  
  // If it's already a full URL, return as is
  if (filename.startsWith('http')) {
    return filename
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/media/${filename}`
}

/**
 * Extract filename from WordPress URL
 */
export function extractFilenameFromUrl(url: string): string {
  if (!url) return ''
  
  const parts = url.split('/')
  return parts[parts.length - 1]
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Truncate text to specific length
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Clean HTML content (remove HTML tags for excerpts)
 */
export function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Generate meta tags for SEO
 */
export function generateMetaTags({
  title,
  description,
  url,
  image,
}: {
  title: string
  description?: string
  url?: string
  image?: string
}) {
  return {
    title,
    description: description || '',
    openGraph: {
      title,
      description: description || '',
      url: url || '',
      images: image ? [{ url: image }] : [],
      siteName: 'DivorceLawyer.com',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || '',
      images: image ? [image] : [],
    },
  }
}

