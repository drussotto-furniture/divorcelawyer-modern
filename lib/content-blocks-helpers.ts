/**
 * Helper functions for organizing content blocks by component type
 */

interface ContentBlock {
  id: string
  name: string
  slug: string
  component_type: string
  title: string | null
  subtitle: string | null
  description: string | null
  image_url: string | null
  link_url: string | null
  link_text: string | null
  order_index: number
}

/**
 * Organize content blocks by component type and slug
 */
export function organizeContentBlocks(blocks: ContentBlock[]) {
  const organized: Record<string, Record<string, ContentBlock>> = {}
  
  blocks.forEach((block) => {
    if (!organized[block.component_type]) {
      organized[block.component_type] = {}
    }
    organized[block.component_type][block.slug] = block
  })
  
  return organized
}

/**
 * Get a specific content block
 */
export function getContentBlock(
  organized: Record<string, Record<string, ContentBlock>>,
  componentType: string,
  slug: string
): ContentBlock | null {
  return organized[componentType]?.[slug] || null
}

/**
 * Get all blocks for a component type, sorted by order_index
 */
export function getComponentBlocks(
  organized: Record<string, Record<string, ContentBlock>>,
  componentType: string
): ContentBlock[] {
  const blocks = organized[componentType] || {}
  return Object.values(blocks).sort((a, b) => a.order_index - b.order_index)
}

