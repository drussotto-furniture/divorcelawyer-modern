/**
 * Helper functions for organizing homepage content from database
 */

interface HomepageContentItem {
  section: string
  key: string
  title: string | null
  subtitle: string | null
  description: string | null
  image_url: string | null
  link_url: string | null
  link_text: string | null
  order_index: number
}

/**
 * Organize homepage content by section and key
 */
export function organizeHomepageContent(content: HomepageContentItem[]) {
  const organized: Record<string, Record<string, HomepageContentItem>> = {}
  
  content.forEach((item) => {
    if (!organized[item.section]) {
      organized[item.section] = {}
    }
    organized[item.section][item.key] = item
  })
  
  return organized
}

/**
 * Get a specific content item
 */
export function getContentItem(
  organized: Record<string, Record<string, HomepageContentItem>>,
  section: string,
  key: string
): HomepageContentItem | null {
  return organized[section]?.[key] || null
}

/**
 * Get all items for a section, sorted by order_index
 */
export function getSectionItems(
  organized: Record<string, Record<string, HomepageContentItem>>,
  section: string
): HomepageContentItem[] {
  const items = organized[section] || {}
  return Object.values(items).sort((a, b) => a.order_index - b.order_index)
}

