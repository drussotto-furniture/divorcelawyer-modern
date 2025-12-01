'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SubscriptionType {
  id: string
  name: 'free' | 'basic' | 'enhanced' | 'premium'
  display_name: string
  description: string | null
  sort_order: number
  is_active: boolean
}

export default function SubscriptionTypesClient() {
  const supabase = createClient()
  const [types, setTypes] = useState<SubscriptionType[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [edits, setEdits] = useState<Partial<SubscriptionType>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadTypes()
  }, [])

  const loadTypes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('subscription_types')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      setTypes(data || [])
    } catch (error: any) {
      console.error('Error loading subscription types:', error)
      setMessage({ type: 'error', text: `Failed to load subscription types: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (type: SubscriptionType) => {
    setEditing(type.id)
    setEdits({
      display_name: type.display_name,
      description: type.description || '',
      sort_order: type.sort_order,
      is_active: type.is_active,
    })
  }

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subscription_types')
        .update(edits)
        .eq('id', id)

      if (error) throw error
      setMessage({ type: 'success', text: 'Subscription type updated successfully' })
      setEditing(null)
      setEdits({})
      loadTypes()
    } catch (error: any) {
      console.error('Error updating subscription type:', error)
      setMessage({ type: 'error', text: `Failed to update: ${error.message}` })
    }
  }

  const handleCancel = () => {
    setEditing(null)
    setEdits({})
  }

  if (loading) {
    return <div className="text-center py-10">Loading subscription types...</div>
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {types.map((type) => (
              <tr key={type.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                  {type.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editing === type.id ? (
                    <input
                      type="text"
                      value={edits.display_name || ''}
                      onChange={(e) => setEdits({ ...edits, display_name: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{type.display_name}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editing === type.id ? (
                    <textarea
                      value={edits.description || ''}
                      onChange={(e) => setEdits({ ...edits, description: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      rows={2}
                    />
                  ) : (
                    <span className="text-sm text-gray-500">{type.description || '—'}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editing === type.id ? (
                    <input
                      type="number"
                      value={edits.sort_order || 0}
                      onChange={(e) => setEdits({ ...edits, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{type.sort_order}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editing === type.id ? (
                    <input
                      type="checkbox"
                      checked={edits.is_active ?? true}
                      onChange={(e) => setEdits({ ...edits, is_active: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                  ) : (
                    <span className={`text-sm ${type.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {type.is_active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editing === type.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(type.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(type)}
                      className="text-primary hover:text-primary/80"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


