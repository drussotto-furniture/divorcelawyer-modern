'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface HomepageContent {
  id: string
  section: string
  key: string
  title: string | null
  subtitle: string | null
  description: string | null
  content: any
  image_url: string | null
  link_url: string | null
  link_text: string | null
  order_index: number
  active: boolean
}

interface SiteSetting {
  id: string
  key: string
  value: string | null
  value_json: any
  description: string | null
  category: string
}

interface RealVoicesStory {
  id: string
  title: string
  description: string
  author: string | null
  author_display_name: string | null
  featured: boolean
  order_index: number
  status: string
}

interface ContentCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon_url: string | null
  order_index: number
  featured: boolean
  active: boolean
}

interface HomepageContentEditorProps {
  homepageContent: HomepageContent[]
  siteSettings: SiteSetting[]
  stories: RealVoicesStory[]
  categories: ContentCategory[]
}

export default function HomepageContentEditor({
  homepageContent,
  siteSettings,
  stories,
  categories,
}: HomepageContentEditorProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; id?: string } | null>(null)

  // Group content by section
  const contentBySection = homepageContent.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = []
    }
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, HomepageContent[]>)

  const sections = [
    { key: 'hero', name: 'Hero Section', icon: '🏠' },
    { key: 'discover_slider', name: 'Discover Slider', icon: '🎠' },
    { key: 'stages_section', name: 'Stages Section', icon: '📊' },
    { key: 'emotions_section', name: 'Emotions Section', icon: '💭' },
    { key: 'real_voices_section', name: 'Real Voices Section', icon: '🗣️' },
    { key: 'categories_section', name: 'Categories Section', icon: '📁' },
    { key: 'connect_cta', name: 'Connect CTA', icon: '📞' },
    { key: 'faq_section', name: 'FAQ Section', icon: '❓' },
  ]

  const handleSettingUpdate = async (id: string, value: string, key: string) => {
    setSaving(prev => ({ ...prev, [id]: true }))
    try {
      const { error } = await supabase
        .from('site_settings' as any)
        .update({ value })
        .eq('id', id)
      
      if (error) throw error
      
      setMessage({ type: 'success', text: `${key} updated successfully!`, id })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update setting', id })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleContentUpdate = async (id: string, field: string, value: any, itemKey: string) => {
    setSaving(prev => ({ ...prev, [id]: true }))
    try {
      const { error } = await supabase
        .from('homepage_content' as any)
        .update({ [field]: value })
        .eq('id', id)
      
      if (error) throw error
      
      setMessage({ type: 'success', text: `${itemKey} updated successfully!`, id })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update content', id })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleStoryUpdate = async (id: string, field: string, value: any) => {
    setSaving(prev => ({ ...prev, [`story-${id}`]: true }))
    try {
      const { error } = await supabase
        .from('real_voices_stories' as any)
        .update({ [field]: value })
        .eq('id', id)
      
      if (error) throw error
      
      setMessage({ type: 'success', text: 'Story updated successfully!', id: `story-${id}` })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update story', id: `story-${id}` })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setSaving(prev => ({ ...prev, [`story-${id}`]: false }))
    }
  }

  const handleCategoryUpdate = async (id: string, field: string, value: any) => {
    setSaving(prev => ({ ...prev, [`category-${id}`]: true }))
    try {
      const { error } = await supabase
        .from('content_categories' as any)
        .update({ [field]: value })
        .eq('id', id)
      
      if (error) throw error
      
      setMessage({ type: 'success', text: 'Category updated successfully!', id: `category-${id}` })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update category', id: `category-${id}` })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setSaving(prev => ({ ...prev, [`category-${id}`]: false }))
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Site Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Default Location Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {siteSettings.map((setting) => (
            <div key={setting.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {setting.description || setting.key}
              </label>
              <div className="relative">
                <input
                  type="text"
                  defaultValue={setting.value || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  onBlur={(e) => handleSettingUpdate(setting.id, e.target.value, setting.key)}
                  disabled={saving[setting.id]}
                />
                {saving[setting.id] && (
                  <span className="absolute right-3 top-2.5 text-gray-400 text-sm">Saving...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Homepage Sections */}
      {sections.map((section) => (
        <div key={section.key} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>{section.icon}</span>
            {section.name}
          </h2>
          {contentBySection[section.key]?.length > 0 ? (
            <div className="space-y-4">
              {contentBySection[section.key].map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <div className="relative">
                        <input
                          type="text"
                          defaultValue={item.title || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                          onBlur={(e) => handleContentUpdate(item.id, 'title', e.target.value, item.key)}
                          disabled={saving[item.id]}
                        />
                        {saving[item.id] && (
                          <span className="absolute right-3 top-2.5 text-gray-400 text-xs">Saving...</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                      <div className="relative">
                        <input
                          type="text"
                          defaultValue={item.subtitle || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                          onBlur={(e) => handleContentUpdate(item.id, 'subtitle', e.target.value, item.key)}
                          disabled={saving[item.id]}
                        />
                        {saving[item.id] && (
                          <span className="absolute right-3 top-2.5 text-gray-400 text-xs">Saving...</span>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <div className="relative">
                        <textarea
                          defaultValue={item.description || ''}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                          onBlur={(e) => handleContentUpdate(item.id, 'description', e.target.value, item.key)}
                          disabled={saving[item.id]}
                        />
                        {saving[item.id] && (
                          <span className="absolute right-3 top-2.5 text-gray-400 text-xs">Saving...</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                      <div className="relative">
                        <input
                          type="text"
                          defaultValue={item.image_url || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                          onBlur={(e) => handleContentUpdate(item.id, 'image_url', e.target.value, item.key)}
                          disabled={saving[item.id]}
                        />
                        {saving[item.id] && (
                          <span className="absolute right-3 top-2.5 text-gray-400 text-xs">Saving...</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                      <div className="relative">
                        <input
                          type="text"
                          defaultValue={item.link_url || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                          onBlur={(e) => handleContentUpdate(item.id, 'link_url', e.target.value, item.key)}
                          disabled={saving[item.id]}
                        />
                        {saving[item.id] && (
                          <span className="absolute right-3 top-2.5 text-gray-400 text-xs">Saving...</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked={item.active}
                          onChange={(e) => handleContentUpdate(item.id, 'active', e.target.checked, item.key)}
                          disabled={saving[item.id]}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No content configured for this section yet.</p>
          )}
        </div>
      ))}

      {/* Real Voices Stories */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Real Voices Stories</h2>
        <div className="space-y-4">
          {stories.map((story) => (
            <div key={story.id} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <div className="relative">
                    <input
                      type="text"
                      defaultValue={story.title}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      onBlur={(e) => handleStoryUpdate(story.id, 'title', e.target.value)}
                      disabled={saving[`story-${story.id}`]}
                    />
                    {saving[`story-${story.id}`] && (
                      <span className="absolute right-3 top-2.5 text-gray-400 text-xs">Saving...</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <div className="relative">
                    <input
                      type="text"
                      defaultValue={story.author_display_name || story.author || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      onBlur={(e) => handleStoryUpdate(story.id, 'author_display_name', e.target.value)}
                      disabled={saving[`story-${story.id}`]}
                    />
                    {saving[`story-${story.id}`] && (
                      <span className="absolute right-3 top-2.5 text-gray-400 text-xs">Saving...</span>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <div className="relative">
                    <textarea
                      defaultValue={story.description}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      onBlur={(e) => handleStoryUpdate(story.id, 'description', e.target.value)}
                      disabled={saving[`story-${story.id}`]}
                    />
                    {saving[`story-${story.id}`] && (
                      <span className="absolute right-3 top-2.5 text-gray-400 text-xs">Saving...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Categories */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Categories</h2>
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      defaultValue={category.name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      onBlur={(e) => handleCategoryUpdate(category.id, 'name', e.target.value)}
                      disabled={saving[`category-${category.id}`]}
                    />
                    {saving[`category-${category.id}`] && (
                      <span className="absolute right-3 top-2.5 text-gray-400 text-xs">Saving...</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked={category.active}
                      onChange={(e) => handleCategoryUpdate(category.id, 'active', e.target.checked)}
                      disabled={saving[`category-${category.id}`]}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

