'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AuthUser } from '@/lib/auth/server'
import { FIRM_SIZES, PRACTICE_AREAS } from '@/lib/constants/lawyer-fields'

interface LawFirmEditFormProps {
  firm: any
  auth: AuthUser
  isNew?: boolean
}

// Helper function to normalize array data from database
const normalizeArray = (value: any): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    // Handle comma-separated strings
    return value.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
}

export default function LawFirmEditForm({ firm, auth, isNew = false }: LawFirmEditFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeSection, setActiveSection] = useState<string>('basic')

  // Normalize firm data on mount
  const normalizedFirm = {
    ...firm,
    practice_areas: normalizeArray(firm?.practice_areas),
  }

  const [formData, setFormData] = useState({
    name: normalizedFirm.name || '',
    slug: normalizedFirm.slug || '',
    description: normalizedFirm.description || '',
    content: normalizedFirm.content || '',
    address: normalizedFirm.address || '',
    city_id: normalizedFirm.city_id || '',
    phone: normalizedFirm.phone || '',
    email: normalizedFirm.email || '',
    website: normalizedFirm.website || '',
    logo_url: normalizedFirm.logo_url || '',
    linkedin_url: normalizedFirm.linkedin_url || '',
    facebook_url: normalizedFirm.facebook_url || '',
    twitter_url: normalizedFirm.twitter_url || '',
    founded_year: normalizedFirm.founded_year || '',
    firm_size: normalizedFirm.firm_size || '',
    practice_areas: normalizedFirm.practice_areas,
    rating: firm.rating || '',
    review_count: firm.review_count || 0,
    verified: firm.verified ?? false,
    featured: firm.featured ?? false,
    meta_title: firm.meta_title || '',
    meta_description: firm.meta_description || '',
  })
  
  const [cities, setCities] = useState<Array<{ id: string; name: string; states: { abbreviation: string } }>>([])
  const [loadingCities, setLoadingCities] = useState(false)

  // Load cities on mount
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const dataToSave: any = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: formData.description || null,
        content: formData.content || null,
        address: formData.address || null,
        city_id: formData.city_id || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        logo_url: formData.logo_url || null,
        linkedin_url: formData.linkedin_url || null,
        facebook_url: formData.facebook_url || null,
        twitter_url: formData.twitter_url || null,
        founded_year: formData.founded_year ? parseInt(formData.founded_year.toString()) : null,
        firm_size: formData.firm_size || null,
        practice_areas: formData.practice_areas && formData.practice_areas.length > 0 ? formData.practice_areas : null,
        rating: formData.rating ? parseFloat(formData.rating.toString()) : null,
        review_count: formData.review_count ? parseInt(formData.review_count.toString()) : 0,
        verified: formData.verified,
        featured: formData.featured,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
      }

      let error: any = null

      if (isNew) {
        const { data, error: insertError } = await supabase
          .from('law_firms')
          .insert(dataToSave)
          .select()
          .single()
        
        error = insertError
        if (!error && data) {
          router.push(`/admin/directory/law-firms/${data.id}`)
          return
        }
      } else {
        dataToSave.updated_at = new Date().toISOString()
        const { error: updateError } = await supabase
          .from('law_firms')
          .update(dataToSave)
          .eq('id', firm.id)
        
        error = updateError
      }

      if (error) {
        setError(error.message)
      } else {
        setSuccess(isNew ? 'Law firm created successfully!' : 'Law firm updated successfully!')
        if (!isNew) {
          router.refresh()
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleArrayItem = (field: string, value: string) => {
    const current = formData[field as keyof typeof formData] as string[]
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value]
    setFormData({ ...formData, [field]: updated })
  }

  const SectionHeader = ({ id, title, icon }: { id: string; title: string; icon: string }) => (
    <button
      type="button"
      onClick={() => setActiveSection(activeSection === id ? '' : id)}
      className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <span className="text-gray-500">{activeSection === id ? '−' : '+'}</span>
    </button>
  )

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

      {/* Basic Information */}
      <div>
        <SectionHeader id="basic" title="Basic Information" icon="🏢" />
        {activeSection === 'basic' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Firm Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value
                  setFormData({ 
                    ...formData, 
                    name,
                    slug: formData.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL-friendly name) *
              </label>
              <input
                type="text"
                id="slug"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="firm-name"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Plain Text)
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Brief description of the firm (plain text, not HTML)..."
              />
            </div>

            {auth.isSuperAdmin && (
              <div className="md:col-span-2">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Content (HTML - Super Admin Only)
                </label>
                <textarea
                  id="content"
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary font-mono text-sm"
                  placeholder="Full HTML content..."
                />
              </div>
            )}

            <div>
              <label htmlFor="founded_year" className="block text-sm font-medium text-gray-700 mb-1">
                Founded Year
              </label>
              <input
                type="number"
                id="founded_year"
                min="1800"
                max={new Date().getFullYear()}
                value={formData.founded_year}
                onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="1990"
              />
            </div>

            <div>
              <label htmlFor="firm_size" className="block text-sm font-medium text-gray-700 mb-1">
                Firm Size
              </label>
              <select
                id="firm_size"
                value={formData.firm_size}
                onChange={(e) => setFormData({ ...formData, firm_size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="">Select size...</option>
                {FIRM_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Practice Areas (Select from list)
              </label>
              <div className="mb-2 text-xs text-gray-500">
                Current selections: {formData.practice_areas.length > 0 ? formData.practice_areas.join(', ') : 'None'}
                {formData.practice_areas.length === 0 && (
                  <span className="ml-2 text-orange-600">
                    (No data in database. Run: <code className="bg-gray-100 px-1 rounded">npm run check-and-update-all-data</code>)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                {PRACTICE_AREAS.map((area) => {
                  // Case-insensitive comparison to handle slight variations
                  const isChecked = formData.practice_areas.some(
                    p => p.toLowerCase().trim() === area.toLowerCase().trim()
                  )
                  return (
                    <label key={area} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleArrayItem('practice_areas', area)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>{area}</span>
                    </label>
                  )
                })}
              </div>
              {formData.practice_areas.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  <strong>Note:</strong> Some practice areas in the database may not match the predefined list.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div>
        <SectionHeader id="contact" title="Contact Information" icon="📞" />
        {activeSection === 'contact' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
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

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://..."
              />
            </div>

            <div>
              <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <input
                type="url"
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Social Media */}
      <div>
        <SectionHeader id="social" title="Social Media" icon="🌐" />
        {activeSection === 'social' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                id="linkedin_url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://linkedin.com/company/..."
              />
            </div>

            <div>
              <label htmlFor="facebook_url" className="block text-sm font-medium text-gray-700 mb-1">
                Facebook URL
              </label>
              <input
                type="url"
                id="facebook_url"
                value={formData.facebook_url}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://facebook.com/..."
              />
            </div>

            <div>
              <label htmlFor="twitter_url" className="block text-sm font-medium text-gray-700 mb-1">
                Twitter/X URL
              </label>
              <input
                type="url"
                id="twitter_url"
                value={formData.twitter_url}
                onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://twitter.com/..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Ratings & Status */}
      <div>
        <SectionHeader id="ratings" title="Ratings & Status" icon="⭐" />
        {activeSection === 'ratings' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                Rating (0-5)
              </label>
              <input
                type="number"
                id="rating"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="review_count" className="block text-sm font-medium text-gray-700 mb-1">
                Review Count
              </label>
              <input
                type="number"
                id="review_count"
                min="0"
                value={formData.review_count}
                onChange={(e) => setFormData({ ...formData, review_count: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            {auth.isSuperAdmin && (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="verified"
                    checked={formData.verified}
                    onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="verified" className="text-sm font-medium text-gray-700">
                    Verified
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    Featured
                  </label>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* SEO */}
      <div>
        <SectionHeader id="seo" title="SEO & Meta Information" icon="🔍" />
        {activeSection === 'seo' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                placeholder="SEO title for search engines"
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
                placeholder="SEO description for search engines"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
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
          {loading ? 'Saving...' : (isNew ? 'Create Law Firm' : 'Save Changes')}
        </button>
      </div>
    </form>
  )
}
