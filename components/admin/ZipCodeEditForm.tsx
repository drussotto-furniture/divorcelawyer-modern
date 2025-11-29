'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ZipCodeEditFormProps {
  zipCode: any | null
}

export default function ZipCodeEditForm({ zipCode }: ZipCodeEditFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const isNew = !zipCode

  const [cities, setCities] = useState<Array<{ id: string; name: string; states: { abbreviation: string } }>>([])
  const [loadingCities, setLoadingCities] = useState(false)

  useEffect(() => {
    const loadCities = async () => {
      setLoadingCities(true)
      const { data } = await supabase
        .from('cities')
        .select('id, name, states(abbreviation)')
        .order('name')
        .limit(500)
      if (data) {
        setCities(data as any)
      }
      setLoadingCities(false)
    }
    loadCities()
  }, [])

  const [formData, setFormData] = useState({
    zip_code: zipCode?.zip_code || '',
    city_id: zipCode?.city_id || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const dataToSave: any = {
        zip_code: formData.zip_code,
        city_id: formData.city_id || null,
      }

      let result
      if (isNew) {
        result = await supabase
          .from('zip_codes')
          .insert(dataToSave)
          .select()
          .single()
      } else {
        result = await supabase
          .from('zip_codes')
          .update(dataToSave)
          .eq('id', zipCode.id)
      }

      if (result.error) {
        setError(result.error.message)
        setLoading(false)
        return
      }

      setSuccess(isNew ? 'Zip code created successfully!' : 'Zip code updated successfully!')
      if (isNew && result.data) {
        router.push(`/admin/directory/locations/zip-codes/${result.data.id}`)
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
          <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-1">
            Zip Code *
          </label>
          <input
            type="text"
            id="zip_code"
            required
            maxLength={10}
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value.replace(/[^0-9-]/g, '') })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="90210"
          />
        </div>

        <div>
          <label htmlFor="city_id" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <select
            id="city_id"
            value={formData.city_id}
            onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            disabled={loadingCities}
          >
            <option value="">Select a city...</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}, {city.states?.abbreviation || ''}
              </option>
            ))}
          </select>
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
          {loading ? 'Saving...' : isNew ? 'Create Zip Code' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

