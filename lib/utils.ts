import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strip HTML tags from a string
 * Works on both server and client
 */
export function stripHtml(html: string): string {
  if (!html) return ''
  // Remove HTML tags and decode common entities
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Decode &amp;
    .replace(/&lt;/g, '<') // Decode &lt;
    .replace(/&gt;/g, '>') // Decode &gt;
    .replace(/&quot;/g, '"') // Decode &quot;
    .replace(/&#39;/g, "'") // Decode &#39;
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Truncate text to a maximum length, adding ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}
