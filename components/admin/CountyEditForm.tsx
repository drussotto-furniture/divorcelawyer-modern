'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface CountyEditFormProps {
  county: any | null
}

export default function CountyEditForm({ county }: CountyEditFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const isNew = !county

  const [states, setStates] = useState<Array<{ id: string; name: string; abbreviation: string }>>([])
  const [loadingStates, setLoadingStates] = useState(false)

  useEffect(() => {
    const loadStates = async () => {
      setLoadingStates(true)
      const { data } = await supabase
        .from('states')
        .select('id, name, abbreviation')
        .order('name')
      if (data) {
        setStates(data)
      }
      setLoadingStates(false)
    }
    loadStates()
  }, [])

  const [formData, setFormData] = useState({
    name: county?.name || '',
    slug: county?.slug || '',
    state_id: county?.state_id || '',
    content: county?.content || '',
    meta_title: county?.meta_title || '',
    meta_description: county?.meta_description || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const dataToSave: any = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        state_id: formData.state_id || null,
        content: formData.content || null,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
      }

      let result
      if (isNew) {
        result = await supabase
          .from('counties')
          .insert(dataToSave)
          .select()
          .single()
      } else {
        result = await supabase
          .from('counties')
          .update(dataToSave)
          .eq('id', county.id)
      }

      if (result.error) {
        setError(result.error.message)
        setLoading(false)
        return
      }

      setSuccess(isNew ? 'County created successfully!' : 'County updated successfully!')
      if (isNew && result.data) {
        router.push(`/admin/directory/locations/counties/${result.data.id}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value })
              if (!formData.slug || formData.slug === county?.slug) {
                setFormData(prev => ({
                  ...prev,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                }))
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="Los Angeles County"
          />
        </div>

        <div>
          <label htmlFor="state_id" className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <select
            id="state_id"
            required
            value={formData.state_id}
            onChange={(e) => setFormData({ ...formData, state_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            disabled={loadingStates}
          >
            <option value="">Select a state...</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name} ({state.abbreviation})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug *
          </label>
          <input
            type="text"
            id="slug"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/(^-|-$)/g, '') })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="los-angeles-county"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            id="content"
            rows={5}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="County description or content..."
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 mb-1">
            Meta Title (SEO)
          </label>
          <input
            type="text"
            id="meta_title"
            value={formData.meta_title}
            onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="Los Angeles County Divorce Lawyers | [Site Name]"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description (SEO)
          </label>
          <textarea
            id="meta_description"
            rows={2}
            value={formData.meta_description}
            onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="Find experienced divorce lawyers in Los Angeles County..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Saving...' : isNew ? 'Create County' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

