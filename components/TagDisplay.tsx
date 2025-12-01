'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Tag {
  id: string
  name: string
  slug: string
}

interface TagDisplayProps {
  contentType: string
  contentId: string
}

export default function TagDisplay({ contentType, contentId }: TagDisplayProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadTags()
  }, [contentType, contentId])

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('page_tags')
        .select('tag_id, tags(id, name, slug)')
        .eq('content_type', contentType)
        .eq('content_id', contentId)

      if (error) throw error

      const loadedTags = (data || [])
        .map((item: any) => item.tags)
        .filter(Boolean) as Tag[]

      setTags(loadedTags)
    } catch (err) {
      console.error('Error loading tags:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || tags.length === 0) {
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
}


