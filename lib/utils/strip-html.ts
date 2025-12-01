/**
 * Utility functions for stripping HTML from text
 * Used to extract plain text from HTML content for admin forms
 */

/**
 * Strip HTML tags and decode entities to get plain text
 * This is used to show clean text in admin forms
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  
  let text = html
  
  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '')
  
  // Remove script and style tags and their content
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '')
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ')
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&') // Must be last
  
  // Normalize whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim()
  
  return text
}

/**
 * Check if a string contains HTML tags
 */
export function containsHtml(text: string | null | undefined): boolean {
  if (!text) return false
  return /<[^>]+>/.test(text) || /&[a-z]+;|&#\d+;|&#x[0-9a-f]+;/i.test(text)
}



