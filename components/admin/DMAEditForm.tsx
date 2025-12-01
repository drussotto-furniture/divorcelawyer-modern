'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DMAEditFormProps {
  dma: any | null
}

interface ZipCode {
  id: string
  zip_code: string
  cities?: {
    name: string
    states?: {
      abbreviation: string
    }
  } | null
}

export default function DMAEditForm({ dma }: DMAEditFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const isNew = !dma

  const [formData, setFormData] = useState({
    code: dma?.code?.toString() || '',
    name: dma?.name || '',
    slug: dma?.slug || '',
    description: dma?.description || '',
  })

  const [assignedZipCodes, setAssignedZipCodes] = useState<ZipCode[]>([])
  const [loadingZipCodes, setLoadingZipCodes] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ZipCode[]>([])
  const [searching, setSearching] = useState(false)

  // Load assigned zip codes
  useEffect(() => {
    if (!isNew && dma?.id) {
      loadAssignedZipCodes()
    }
  }, [dma?.id, isNew])

  const loadAssignedZipCodes = async () => {
    if (!dma?.id) return
    
    setLoadingZipCodes(true)
    try {
      const { data, error } = await supabase
        .from('zip_code_dmas')
        .select(`
          zip_code_id,
          zip_codes!inner(
            id,
            zip_code,
            cities(name, states(abbreviation))
          )
        `)
        .eq('dma_id', dma.id)

      if (error) throw error

      const zipCodes = (data || []).map((item: any) => item.zip_codes).filter(Boolean)
      setAssignedZipCodes(zipCodes)
    } catch (err: any) {
      console.error('Error loading zip codes:', err)
      setError(`Failed to load zip codes: ${err.message}`)
    } finally {
      setLoadingZipCodes(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const dataToSave: any = {
        code: parseInt(formData.code),
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: formData.description || null,
      }

      let result
      if (isNew) {
        result = await supabase
          .from('dmas')
          .insert(dataToSave)
          .select()
          .single()
      } else {
        result = await supabase
          .from('dmas')
          .update(dataToSave)
          .eq('id', dma.id)
      }

      if (result.error) {
        // Provide more descriptive error messages
        let errorMessage = result.error.message || 'An error occurred while saving.'
        
        if (result.error.message?.includes('duplicate key') || result.error.message?.includes('unique constraint')) {
          if (result.error.message?.includes('code')) {
            errorMessage = 'A DMA with this code already exists. Please use a different code.'
          } else if (result.error.message?.includes('slug')) {
            errorMessage = 'A DMA with this slug already exists. Please change the slug to a unique value.'
          }
        }
        
        setError(errorMessage)
        setLoading(false)
        return
      }

      // Success - redirect to DMAs grid
      router.push('/admin/directory/locations/dmas')
    } catch (err: any) {
      const errorMessage = err?.message || 'An unexpected error occurred. Please try again.'
      setError(errorMessage)
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const searchZipCodes = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('zip_codes')
        .select(`
          id,
          zip_code,
          cities(name, states(abbreviation))
        `)
        .ilike('zip_code', `%${searchQuery.trim()}%`)
        .limit(20)

      if (error) throw error

      // Filter out already assigned zip codes
      const assignedIds = new Set(assignedZipCodes.map(z => z.id))
      const filtered = (data || []).filter((zip: ZipCode) => !assignedIds.has(zip.id))
      
      setSearchResults(filtered)
    } catch (err: any) {
      console.error('Error searching zip codes:', err)
      setError(`Failed to search zip codes: ${err.message}`)
    } finally {
      setSearching(false)
    }
  }

  const addZipCode = async (zipCode: ZipCode) => {
    if (!dma?.id) {
      setError('Please save the DMA first before adding zip codes.')
      return
    }

    try {
      // Remove any existing mapping for this zip code
      await supabase
        .from('zip_code_dmas')
        .delete()
        .eq('zip_code_id', zipCode.id)

      // Add new mapping
      const { error } = await supabase
        .from('zip_code_dmas')
        .insert({
          zip_code_id: zipCode.id,
          dma_id: dma.id,
        })

      if (error) throw error

      // Reload assigned zip codes
      await loadAssignedZipCodes()
      setSearchQuery('')
      setSearchResults([])
      setSuccess(`Added zip code ${zipCode.zip_code} to this DMA`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error adding zip code:', err)
      setError(`Failed to add zip code: ${err.message}`)
    }
  }

  const removeZipCode = async (zipCodeId: string) => {
    if (!dma?.id) return

    try {
      const { error } = await supabase
        .from('zip_code_dmas')
        .delete()
        .eq('zip_code_id', zipCodeId)
        .eq('dma_id', dma.id)

      if (error) throw error

      // Reload assigned zip codes
      await loadAssignedZipCodes()
      setSuccess('Zip code removed successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error removing zip code:', err)
      setError(`Failed to remove zip code: ${err.message}`)
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

      {/* Basic DMA Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">DMA Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              DMA Code *
            </label>
            <input
              type="number"
              id="code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="523"
            />
          </div>

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
                if (!formData.slug || formData.slug === dma?.slug) {
                  setFormData(prev => ({
                    ...prev,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  }))
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="BURLINGTON-PLATTSBURGH"
            />
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
              placeholder="burlington-plattsburgh"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="DMA description..."
            />
          </div>
        </div>
      </div>

      {/* Zip Code Mapping - Only show for existing DMAs */}
      {!isNew && dma?.id && (
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900">Zip Code Mapping</h2>
          
          {/* Search and Add Zip Codes */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label htmlFor="zip-search" className="block text-sm font-medium text-gray-700 mb-2">
              Search and Add Zip Codes
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="zip-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    searchZipCodes()
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Enter zip code to search..."
              />
              <button
                type="button"
                onClick={searchZipCodes}
                disabled={searching || !searchQuery.trim()}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Search Results:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((zip) => (
                    <div
                      key={zip.id}
                      className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded"
                    >
                      <div>
                        <span className="font-medium">{zip.zip_code}</span>
                        {zip.cities && (
                          <span className="text-sm text-gray-500 ml-2">
                            - {zip.cities.name}
                            {zip.cities.states?.abbreviation && `, ${zip.cities.states.abbreviation}`}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addZipCode(zip)}
                        className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Assigned Zip Codes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">
                Assigned Zip Codes ({assignedZipCodes.length})
              </p>
            </div>
            
            {loadingZipCodes ? (
              <div className="text-center py-4 text-gray-500">Loading zip codes...</div>
            ) : assignedZipCodes.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Zip Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Location
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assignedZipCodes.map((zip) => (
                        <tr key={zip.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {zip.zip_code}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {zip.cities?.name || '—'}
                            {zip.cities?.states?.abbreviation && `, ${zip.cities.states.abbreviation}`}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => removeZipCode(zip.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                No zip codes assigned to this DMA yet. Use the search above to add zip codes.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={() => router.push('/admin/directory/locations/dmas')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Saving...' : isNew ? 'Create DMA' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}


