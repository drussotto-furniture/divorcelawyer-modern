/**
 * Utility functions for handling HTML entities
 * Used to decode entities that may have been incorrectly stored during migration
 */

/**
 * Decode common HTML entities to their actual characters
 * This ensures data loaded from the database displays correctly
 */
export function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text) return ''
  
  return text
    // Common HTML entities (order matters - do &amp; last among & entities)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&') // Must be last to avoid double replacement
    
    // Numeric entities (common ones)
    .replace(/&#38;/g, '&')
    .replace(/&#60;/g, '<')
    .replace(/&#62;/g, '>')
    .replace(/&#34;/g, '"')
    .replace(/&#160;/g, ' ')
    
    // Hex entities
    .replace(/&#x26;/g, '&')
    .replace(/&#x3C;/g, '<')
    .replace(/&#x3E;/g, '>')
    .replace(/&#x22;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#xA0;/g, ' ')
}

/**
 * Encode special characters to HTML entities (if needed for display)
 * Note: We generally want to store data WITHOUT entities in the database
 * This is only for cases where we need to display HTML safely
 */
export function encodeHtmlEntities(text: string | null | undefined): string {
  if (!text) return ''
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}



