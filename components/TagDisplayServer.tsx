import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Tag {
  id: string
  name: string
  slug: string
}

interface TagDisplayServerProps {
  contentType: string
  contentId: string
}

export default async function TagDisplayServer({ contentType, contentId }: TagDisplayServerProps) {
  const supabase = await createClient()

  try {
    const { data, error } = await (supabase as any)
      .from('page_tags')
      .select('tag_id, tags(id, name, slug)')
      .eq('content_type', contentType)
      .eq('content_id', contentId)

    if (error) {
      console.error('Error loading tags:', error)
      return null
    }

    const tags = (data || [])
      .map((item: any) => item.tags)
      .filter(Boolean) as Tag[]

    if (tags.length === 0) {
      return null
    }

    return (
      <div className="bg-warmbeige py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white text-teal-700 hover:bg-teal-50 transition-colors border border-teal-200"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in TagDisplayServer:', error)
    return null
  }
}

