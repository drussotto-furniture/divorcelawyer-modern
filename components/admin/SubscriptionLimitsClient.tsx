'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SubscriptionLimit {
  id: string
  location_type: 'global' | 'dma'
  location_value: string
  subscription_type: 'free' | 'basic' | 'enhanced' | 'premium'
  max_lawyers: number | null
}

interface DMA {
  id: string
  name: string
  code: number
  slug: string
}

export default function SubscriptionLimitsClient() {
  const supabase = createClient()
  const [limits, setLimits] = useState<SubscriptionLimit[]>([])
  const [dmas, setDmas] = useState<DMA[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLimit, setEditingLimit] = useState<SubscriptionLimit | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'global' | 'dma'>('all')

  useEffect(() => {
    loadLimits()
    loadDMAs()
  }, [])

  const loadLimits = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('subscription_limits')
        .select('*')
        .order('location_type', { ascending: true })
        .order('location_value', { ascending: true })
        .order('subscription_type', { ascending: true })

      if (error) throw error
      setLimits(data || [])
    } catch (error: any) {
      console.error('Error loading subscription limits:', error)
      alert(`Error loading limits: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadDMAs = async () => {
    try {
      const { data, error } = await supabase
        .from('dmas')
        .select('id, name, code, slug')
        .order('name')
      if (error) throw error
      setDmas(data || [])
    } catch (error) {
      console.error('Error loading DMAs:', error)
    }
  }

  // Helper function to get DMA name from UUID
  const getDMAName = (dmaId: string): string => {
    const dma = dmas.find(d => d.id === dmaId)
    return dma ? dma.name : dmaId
  }

  const handleDelete = async (limit: SubscriptionLimit) => {
    if (limit.location_type === 'global') {
      alert('Cannot delete global default limits')
      return
    }

    const locationName = limit.location_type === 'dma' 
      ? getDMAName(limit.location_value)
      : limit.location_value

    if (!confirm(`Delete subscription limit for ${locationName} (${limit.subscription_type})?`)) return

    try {
      const { error } = await supabase
        .from('subscription_limits')
        .delete()
        .eq('id', limit.id)

      if (error) throw error
      alert('Subscription limit deleted successfully')
      loadLimits()
    } catch (error: any) {
      console.error('Error deleting limit:', error)
      alert(`Failed to delete: ${error.message}`)
    }
  }

  const filteredLimits = limits.filter(
    (l) => filterType === 'all' || l.location_type === filterType
  )

  // Group limits by location for better display
  const groupedLimits = filteredLimits.reduce((acc, limit) => {
    const key = `${limit.location_type}-${limit.location_value}`
    if (!acc[key]) {
      acc[key] = {
        location_type: limit.location_type,
        location_value: limit.location_value,
        limits: {} as Record<string, SubscriptionLimit>
      }
    }
    acc[key].limits[limit.subscription_type] = limit
    return acc
  }, {} as Record<string, { location_type: string; location_value: string; limits: Record<string, SubscriptionLimit> }>)

  return (
    <>
      <div className="space-y-6">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How Subscription Limits Work</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li><strong>Global Default:</strong> Premium = 3, Enhanced = 8, Basic = Unlimited, Free = Unlimited</li>
            <li><strong>Add Exceptions:</strong> Create DMA-specific limits when you want different rules for a Designated Market Area</li>
            <li><strong>Automatic Fallback:</strong> Any DMA not configured uses the global default</li>
            <li><strong>Hierarchy:</strong> DMA limits override global defaults</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            + Add Subscription Limit
          </button>
          <button
            onClick={loadLimits}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Location Type:
          </label>
          <div className="flex gap-2">
            {['all', 'global', 'dma'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-primary text-black'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'dma' ? 'DMA' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Limits Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading subscription limits...</p>
          </div>
        ) : Object.keys(groupedLimits).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">No subscription limits found. Add your first limit!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enhanced</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Free</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.values(groupedLimits).map((group, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          group.location_type === 'global'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {group.location_type === 'dma' ? 'DMA' : 'GLOBAL'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {group.location_type === 'dma' 
                          ? getDMAName(group.location_value)
                          : group.location_value}
                      </td>
                      {['premium', 'enhanced', 'basic', 'free'].map((subType) => {
                        const limit = group.limits[subType]
                        return (
                          <td key={subType} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {limit ? (limit.max_lawyers === null ? 'Unlimited' : limit.max_lawyers) : '—'}
                          </td>
                        )
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            // Find the first limit to edit (we'll edit all for this location)
                            const firstLimit = Object.values(group.limits)[0]
                            if (firstLimit) {
                              setEditingLimit(firstLimit)
                            }
                          }}
                          className="text-primary hover:text-primary/80"
                        >
                          Edit
                        </button>
                        {group.location_type !== 'global' && (
                          <button
                            onClick={() => {
                              // Delete all limits for this location
                              Object.values(group.limits).forEach(limit => handleDelete(limit))
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingLimit) && (
        <SubscriptionLimitModal
          limit={editingLimit}
          dmas={dmas}
          onClose={() => {
            setShowAddModal(false)
            setEditingLimit(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingLimit(null)
            loadLimits()
          }}
        />
      )}
    </>
  )
}

interface SubscriptionLimitModalProps {
  limit: SubscriptionLimit | null
  dmas: DMA[]
  onClose: () => void
  onSuccess: () => void
}

function SubscriptionLimitModal({ limit, dmas, onClose, onSuccess }: SubscriptionLimitModalProps) {
  const supabase = createClient()
  const [formData, setFormData] = useState({
    locationType: limit?.location_type || 'dma',
    locationValue: limit?.location_value || '',
    premiumLimit: limit?.subscription_type === 'premium' ? (limit.max_lawyers?.toString() || '') : '',
    enhancedLimit: limit?.subscription_type === 'enhanced' ? (limit.max_lawyers?.toString() || '') : '',
    basicLimit: '',
    freeLimit: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // If editing, load all limits for this location
  useEffect(() => {
    if (limit) {
      const loadAllLimits = async () => {
        const { data } = await supabase
          .from('subscription_limits')
          .select('*')
          .eq('location_type', limit.location_type)
          .eq('location_value', limit.location_value)

        if (data) {
          const limitsByType = data.reduce((acc, l) => {
            acc[l.subscription_type] = l.max_lawyers
            return acc
          }, {} as Record<string, number | null>)

          setFormData({
            locationType: limit.location_type,
            locationValue: limit.location_value,
            premiumLimit: limitsByType.premium?.toString() || '',
            enhancedLimit: limitsByType.enhanced?.toString() || '',
            basicLimit: limitsByType.basic?.toString() || '',
            freeLimit: limitsByType.free?.toString() || '',
          })
        }
      }
      loadAllLimits()
    }
  }, [limit, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const subscriptionTypes: Array<'premium' | 'enhanced' | 'basic' | 'free'> = ['premium', 'enhanced', 'basic', 'free']
      const limitsToSave = subscriptionTypes.map(type => ({
        location_type: formData.locationType,
        location_value: formData.locationValue,
        subscription_type: type,
        max_lawyers: (() => {
          const value = formData[`${type}Limit` as keyof typeof formData] as string
          return value === '' ? null : parseInt(value) || null
        })(),
      }))

      if (limit) {
        // Delete existing limits for this location
        await supabase
          .from('subscription_limits')
          .delete()
          .eq('location_type', limit.location_type)
          .eq('location_value', limit.location_value)
      }

      // Insert new limits
      const { error } = await supabase
        .from('subscription_limits')
        .insert(limitsToSave)

      if (error) throw error
      alert('Subscription limits saved successfully!')
      onSuccess()
    } catch (error: any) {
      console.error('Error saving subscription limits:', error)
      alert(`Failed to save: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {limit ? 'Edit Subscription Limits' : 'Add Subscription Limits'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Location Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Type *
            </label>
            <select
              required
              disabled={limit?.location_type === 'global'}
              value={formData.locationType}
              onChange={(e) => setFormData({ ...formData, locationType: e.target.value as any, locationValue: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
            >
              <option value="dma">DMA (Designated Market Area)</option>
              {limit?.location_type === 'global' && <option value="global">Global (Default)</option>}
            </select>
          </div>

          {/* Location Value - DMA Selection */}
          {formData.locationType === 'dma' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DMA (Designated Market Area) *
              </label>
              <select
                required
                value={formData.locationValue}
                onChange={(e) => setFormData({ ...formData, locationValue: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a DMA</option>
                {dmas.map(dma => (
                  <option key={dma.id} value={dma.id}>{dma.name} (Code: {dma.code})</option>
                ))}
              </select>
            </div>
          )}

          {/* Subscription Limits */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Max Lawyers per Subscription Type</h3>
            
            {['premium', 'enhanced', 'basic', 'free'].map((type) => (
              <div key={type}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {type} Limit (leave empty for unlimited)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData[`${type}Limit` as keyof typeof formData] as string}
                  onChange={(e) => setFormData({ ...formData, [`${type}Limit`]: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Unlimited"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
            >
              {isSubmitting ? 'Saving...' : 'Save Limits'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

