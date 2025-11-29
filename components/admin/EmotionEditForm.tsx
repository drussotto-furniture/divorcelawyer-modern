'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Emotion {
  id: string
  name: string
  slug: string
  description: string | null
  content: string | null
  coping_strategies: string[] | null
  related_resources: string[] | null
  icon_name: string | null
  color_hex: string | null
  meta_title: string | null
  meta_description: string | null
}

interface EmotionEditFormProps {
  emotion: Emotion | null
}

export default function EmotionEditForm({ emotion }: EmotionEditFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    name: emotion?.name || '',
    slug: emotion?.slug || '',
    description: emotion?.description || '',
    content: emotion?.content || '',
    coping_strategies: emotion?.coping_strategies?.join(', ') || '',
    related_resources: emotion?.related_resources?.join(', ') || '',
    icon_name: emotion?.icon_name || '',
    color_hex: emotion?.color_hex || '',
    meta_title: emotion?.meta_title || '',
    meta_description: emotion?.meta_description || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const dataToSave = {
        ...formData,
        coping_strategies: formData.coping_strategies
          ? formData.coping_strategies.split(',').map((s) => s.trim()).filter(Boolean)
          : null,
        related_resources: formData.related_resources
          ? formData.related_resources.split(',').map((s) => s.trim()).filter(Boolean)
          : null,
      }

      if (emotion) {
        const { error } = await supabase
          .from('emotions')
          .update(dataToSave)
          .eq('id', emotion.id)

        if (error) throw error
        setMessage({ type: 'success', text: 'Emotion updated successfully!' })
      } else {
        const { data, error } = await supabase
          .from('emotions')
          .insert(dataToSave)
          .select()
          .single()

        if (error) throw error
        setMessage({ type: 'success', text: 'Emotion created successfully!' })
        router.push(`/admin/resources/emotions/${data.id}`)
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData({
      ...formData,
      name,
      slug: formData.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
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
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
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
                Color (Hex)
              </label>
              <input
                type="text"
                value={formData.color_hex}
                onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="#FF5733"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon Name
              </label>
              <input
                type="text"
                value={formData.icon_name}
                onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="e.g., heart, shield, etc."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary font-mono text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">HTML content is supported</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coping Strategies (comma-separated)
              </label>
              <input
                type="text"
                value={formData.coping_strategies}
                onChange={(e) => setFormData({ ...formData, coping_strategies: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="Strategy 1, Strategy 2, Strategy 3"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Resources (comma-separated)
              </label>
              <input
                type="text"
                value={formData.related_resources}
                onChange={(e) => setFormData({ ...formData, related_resources: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="Resource 1, Resource 2, Resource 3"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">SEO Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Title
              </label>
              <input
                type="text"
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
              </label>
              <textarea
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href="/admin/resources/emotions"
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : emotion ? 'Update Emotion' : 'Create Emotion'}
        </button>
      </div>
    </form>
  )
}

