'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { stripHtml } from '@/lib/utils/strip-html'

interface Video {
  id: string
  title: string
  slug: string
  description: string | null
  video_url: string
  video_provider: string | null
  video_id: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
  transcript: string | null
  status: string
  published_at: string | null
}

interface VideoEditFormProps {
  video: Video | null
}

export default function VideoEditForm({ video }: VideoEditFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    title: video?.title || '',
    slug: video?.slug || '',
    // Use main field if it exists (should have plain text after migration), otherwise strip from _html
    description: video?.description || stripHtml(video?.description_html || ''),
    video_url: video?.video_url || '',
    video_provider: video?.video_provider || 'youtube',
    video_id: video?.video_id || '',
    thumbnail_url: video?.thumbnail_url || '',
    duration_seconds: video?.duration_seconds || null,
    // Use main field if it exists (should have plain text after migration), otherwise strip from _html
    transcript: video?.transcript || stripHtml(video?.transcript_html || ''),
    status: video?.status || 'draft',
    published_at: video?.published_at ? new Date(video.published_at).toISOString().split('T')[0] : '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const dataToSave = {
        ...formData,
        published_at: formData.published_at ? new Date(formData.published_at).toISOString() : null,
        duration_seconds: formData.duration_seconds ? parseInt(formData.duration_seconds.toString()) : null,
        // Preserve existing HTML if it exists, otherwise set to null
        description_html: video?.description_html || null,
        transcript_html: video?.transcript_html || null,
      }

      if (video) {
        const { error } = await supabase
          .from('videos')
          .update(dataToSave)
          .eq('id', video.id)

        if (error) throw error
        setMessage({ type: 'success', text: 'Video updated successfully!' })
      } else {
        const { data, error } = await supabase
          .from('videos')
          .insert(dataToSave)
          .select()
          .single()

        if (error) throw error
        setMessage({ type: 'success', text: 'Video created successfully!' })
        router.push(`/admin/content/videos/${data.id}`)
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setFormData({
      ...formData,
      title,
      slug: formData.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    })
  }

  // Extract video ID from URL
  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    let provider = 'youtube'
    let videoId = ''

    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      provider = 'youtube'
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
      videoId = match ? match[1] : ''
    } else if (url.includes('vimeo.com/')) {
      provider = 'vimeo'
      const match = url.match(/vimeo\.com\/(\d+)/)
      videoId = match ? match[1] : ''
    }

    setFormData({
      ...formData,
      video_url: url,
      video_provider: provider,
      video_id: videoId,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
              <select
                value={formData.video_provider}
                onChange={(e) => setFormData({ ...formData, video_provider: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video URL *
              </label>
              <input
                type="url"
                required
                value={formData.video_url}
                onChange={handleVideoUrlChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              {formData.video_id && (
                <p className="mt-1 text-sm text-gray-500">Video ID: {formData.video_id}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail URL
              </label>
              <input
                type="text"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (seconds)
              </label>
              <input
                type="number"
                value={formData.duration_seconds || ''}
                onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Published Date
              </label>
              <input
                type="date"
                value={formData.published_at}
                onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transcript
              </label>
              <textarea
                value={formData.transcript}
                onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href="/admin/content/videos"
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : video ? 'Update Video' : 'Create Video'}
        </button>
      </div>
    </form>
  )
}

