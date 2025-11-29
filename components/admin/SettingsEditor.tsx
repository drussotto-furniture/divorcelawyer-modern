'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SiteSetting {
  id: string
  key: string
  value: string | null
  value_json: any
  description: string | null
  category: string
}

interface SettingsEditorProps {
  settings: SiteSetting[]
}

export default function SettingsEditor({ settings: initialSettings }: SettingsEditorProps) {
  const supabase = createClient()
  const [settings, setSettings] = useState(initialSettings)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleUpdate = async (id: string, value: string) => {
    try {
      const { error } = await supabase
        .from('site_settings' as any)
        .update({ value })
        .eq('id', id)

      if (error) throw error

      setSettings((prev) =>
        prev.map((s) => (s.id === id ? { ...s, value } : s))
      )
      setMessage({ type: 'success', text: 'Setting updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Update failed' })
    }
  }

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push(setting)
    return acc
  }, {} as Record<string, SiteSetting[]>)

  const categories = ['general', 'homepage', 'defaults', 'seo']

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {categories.map((category) => {
        const categorySettings = groupedSettings[category] || []
        if (categorySettings.length === 0) return null

        return (
          <div key={category} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
              {category} Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categorySettings.map((setting) => (
                <div key={setting.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {setting.description || setting.key}
                  </label>
                  <input
                    type="text"
                    defaultValue={setting.value || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    onBlur={(e) => handleUpdate(setting.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

