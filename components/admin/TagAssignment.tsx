'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Tag {
  id: string
  name: string
  slug: string
}

interface TagAssignmentProps {
  contentType: string // 'article', 'post', 'page', etc.
  contentId: string
  initialTags?: Tag[]
}

export default function TagAssignment({ contentType, contentId, initialTags = [] }: TagAssignmentProps) {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [assignedTags, setAssignedTags] = useState<Tag[]>(initialTags)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadTags()
    loadAssignedTags()
  }, [contentType, contentId])

  const loadTags = async () => {
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('tags')
        .select('id, name, slug')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError
      setAllTags(data || [])
    } catch (err: any) {
      console.error('Error loading tags:', err)
    }
  }

  const loadAssignedTags = async () => {
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('page_tags')
        .select('tag_id, tags(id, name, slug)')
        .eq('content_type', contentType)
        .eq('content_id', String(contentId)) // Ensure it's a string

      if (fetchError) {
        // If error mentions UUID, suggest running migration
        if (fetchError.message?.includes('uuid') || fetchError.message?.includes('UUID')) {
          setError('Database schema issue: Please run migration 042 to fix the content_id column type.')
          return
        }
        throw fetchError
      }

      const tags = (data || [])
        .map((item: any) => item.tags)
        .filter(Boolean) as Tag[]

      setAssignedTags(tags)
    } catch (err: any) {
      console.error('Error loading assigned tags:', err)
    }
  }

  const handleToggleTag = async (tag: Tag) => {
    const isAssigned = assignedTags.some(t => t.id === tag.id)
    setLoading(true)
    setError(null)

    try {
      if (isAssigned) {
        // Remove tag
        const { error: deleteError } = await (supabase as any)
          .from('page_tags')
          .delete()
          .eq('content_type', contentType)
          .eq('content_id', String(contentId)) // Ensure it's a string
          .eq('tag_id', tag.id)

        if (deleteError) {
          // If error mentions UUID, suggest running migration
          if (deleteError.message?.includes('uuid') || deleteError.message?.includes('UUID')) {
            throw new Error('Database schema issue: Please run migration 042 to fix the content_id column type.')
          }
          throw deleteError
        }

        setAssignedTags(prev => prev.filter(t => t.id !== tag.id))
      } else {
        // Add tag - ensure contentId is a string
        const { error: insertError } = await (supabase as any)
          .from('page_tags')
          .insert({
            content_type: contentType,
            content_id: String(contentId), // Ensure it's a string, not UUID
            tag_id: tag.id,
          } as any)

        if (insertError) {
          // If error mentions UUID, suggest running migration
          if (insertError.message?.includes('uuid') || insertError.message?.includes('UUID')) {
            throw new Error('Database schema issue: Please run migration 042 to fix the content_id column type.')
          }
          throw insertError
        }

        setAssignedTags(prev => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        {error && (
          <div className="mb-2 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}
        <div className="border border-gray-300 rounded-md p-4 bg-gray-50 max-h-64 overflow-y-auto">
          {allTags.length === 0 ? (
            <p className="text-sm text-gray-500">No tags available. <a href="/admin/tags" className="text-primary hover:underline">Create tags first</a>.</p>
          ) : (
            <div className="space-y-2">
              {allTags.map((tag) => {
                const isAssigned = assignedTags.some(t => t.id === tag.id)
                return (
                  <label
                    key={tag.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      onChange={() => handleToggleTag(tag)}
                      disabled={loading}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{tag.name}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
        {assignedTags.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Assigned tags:</p>
            <div className="flex flex-wrap gap-2">
              {assignedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

