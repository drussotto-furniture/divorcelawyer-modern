'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AuthUser } from '@/lib/auth/server'
import {
  LAW_SPECIALTIES,
  US_STATES,
  LANGUAGES,
  PROFESSIONAL_MEMBERSHIPS,
  CERTIFICATIONS,
} from '@/lib/constants/lawyer-fields'

interface LawyerEditFormProps {
  lawyer: any
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

export default function LawyerEditForm({ lawyer, auth, isNew = false }: LawyerEditFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeSection, setActiveSection] = useState<string>('basic')

  // Normalize lawyer data on mount
  const normalizedLawyer = {
    ...lawyer,
    specializations: normalizeArray(lawyer?.specializations),
    education: normalizeArray(lawyer?.education),
    awards: normalizeArray(lawyer?.awards),
    bar_admissions: normalizeArray(lawyer?.bar_admissions),
    publications: normalizeArray(lawyer?.publications),
    professional_memberships: normalizeArray(lawyer?.professional_memberships),
    certifications: normalizeArray(lawyer?.certifications),
    languages: normalizeArray(lawyer?.languages),
    media_mentions: normalizeArray(lawyer?.media_mentions),
    speaking_engagements: normalizeArray(lawyer?.speaking_engagements),
  }

  const [formData, setFormData] = useState({
    first_name: normalizedLawyer.first_name || '',
    last_name: normalizedLawyer.last_name || '',
    slug: normalizedLawyer.slug || '',
    title: normalizedLawyer.title || '',
    bio: normalizedLawyer.bio || '',
    email: normalizedLawyer.email || '',
    phone: normalizedLawyer.phone || '',
    photo_url: normalizedLawyer.photo_url || '',
    bar_number: normalizedLawyer.bar_number || '',
    years_experience: normalizedLawyer.years_experience ? String(normalizedLawyer.years_experience) : '',
    law_firm_id: normalizedLawyer.law_firm_id || '',
    specializations: normalizedLawyer.specializations,
    education: normalizedLawyer.education,
    awards: normalizedLawyer.awards,
    bar_admissions: normalizedLawyer.bar_admissions,
    publications: normalizedLawyer.publications,
    professional_memberships: normalizedLawyer.professional_memberships,
    certifications: normalizedLawyer.certifications,
    languages: normalizedLawyer.languages,
    linkedin_url: normalizedLawyer.linkedin_url || '',
    twitter_url: normalizedLawyer.twitter_url || '',
    practice_focus: normalizedLawyer.practice_focus || '',
    approach: normalizedLawyer.approach || '',
    consultation_fee: normalizedLawyer.consultation_fee || '',
    accepts_new_clients: normalizedLawyer.accepts_new_clients ?? true,
    consultation_available: normalizedLawyer.consultation_available ?? true,
    office_address: normalizedLawyer.office_address || '',
    office_hours: normalizedLawyer.office_hours || '',
    credentials_summary: normalizedLawyer.credentials_summary || '',
    media_mentions: normalizedLawyer.media_mentions,
    speaking_engagements: normalizedLawyer.speaking_engagements,
    rating: normalizedLawyer.rating || '',
    review_count: normalizedLawyer.review_count || 0,
    verified: normalizedLawyer.verified ?? false,
    featured: normalizedLawyer.featured ?? false,
    meta_title: normalizedLawyer.meta_title || '',
    meta_description: normalizedLawyer.meta_description || '',
  })

  // Debug: Log the data when component mounts
  useEffect(() => {
    if (!isNew && lawyer) {
      console.log('=== LAWYER DATA DEBUG ===')
      console.log('Lawyer ID:', lawyer.id)
      console.log('Name:', `${lawyer.first_name} ${lawyer.last_name}`)
      console.log('\n--- Professional Information Fields ---')
      console.log('years_experience:', lawyer.years_experience, '→ formData:', formData.years_experience)
      console.log('bar_number:', lawyer.bar_number, '→ formData:', formData.bar_number)
      console.log('Raw specializations from DB:', lawyer.specializations)
      console.log('Normalized specializations:', formData.specializations, `(${formData.specializations.length} items)`)
      console.log('Raw bar_admissions from DB:', lawyer.bar_admissions)
      console.log('Normalized bar_admissions:', formData.bar_admissions, `(${formData.bar_admissions.length} items)`)
      console.log('Raw education from DB:', lawyer.education)
      console.log('Normalized education:', formData.education, `(${formData.education.length} items)`)
      console.log('Raw awards from DB:', lawyer.awards)
      console.log('Normalized awards:', formData.awards, `(${formData.awards.length} items)`)
      console.log('Raw publications from DB:', lawyer.publications)
      console.log('Normalized publications:', formData.publications, `(${formData.publications.length} items)`)
      console.log('Raw professional_memberships from DB:', lawyer.professional_memberships)
      console.log('Normalized professional_memberships:', formData.professional_memberships, `(${formData.professional_memberships.length} items)`)
      console.log('Raw certifications from DB:', lawyer.certifications)
      console.log('Normalized certifications:', formData.certifications, `(${formData.certifications.length} items)`)
      console.log('credentials_summary:', lawyer.credentials_summary ? `Present (${lawyer.credentials_summary.length} chars)` : 'NULL', '→ formData:', formData.credentials_summary ? `Present (${formData.credentials_summary.length} chars)` : 'empty')
      console.log('========================')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount
  
  const [lawFirms, setLawFirms] = useState<Array<{ id: string; name: string }>>([])
  const [loadingFirms, setLoadingFirms] = useState(false)
  const [cities, setCities] = useState<Array<{ id: string; name: string; states: { abbreviation: string } }>>([])
  const [serviceAreas, setServiceAreas] = useState<Array<{ city_id: string }>>([])
  const [loadingCities, setLoadingCities] = useState(false)

  // Load law firms on mount
  useEffect(() => {
    const loadFirms = async () => {
      setLoadingFirms(true)
      const { data } = await supabase
        .from('law_firms')
        .select('id, name')
        .order('name')
      if (data) {
        setLawFirms(data)
      }
      setLoadingFirms(false)
    }
    loadFirms()
  }, [])

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

  // Load service areas if editing existing lawyer
  useEffect(() => {
    if (!isNew && lawyer?.id) {
      console.log('[LawyerEditForm] Loading service areas for lawyer:', lawyer.id)
      const loadServiceAreas = async () => {
        try {
          const { data, error } = await supabase
            .from('lawyer_service_areas')
            .select('city_id')
            .eq('lawyer_id', lawyer.id)
          
          if (error) {
            console.error('[LawyerEditForm] Error loading service areas:', error)
            console.error('[LawyerEditForm] Error details:', JSON.stringify(error, null, 2))
          }
          if (data) {
            console.log('[LawyerEditForm] Loaded service areas:', data)
            console.log('[LawyerEditForm] Service areas count:', data.length)
            setServiceAreas(data)
          } else {
            console.log('[LawyerEditForm] No service areas found for lawyer:', lawyer.id)
          }
        } catch (err) {
          console.error('[LawyerEditForm] Exception loading service areas:', err)
        }
      }
      loadServiceAreas()
    } else {
      console.log('[LawyerEditForm] Skipping service area load - isNew:', isNew, 'lawyer.id:', lawyer?.id)
    }
  }, [lawyer?.id, isNew, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const dataToSave: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        slug: formData.slug || `${formData.first_name}-${formData.last_name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        title: formData.title || null,
        bio: formData.bio || null,
        email: formData.email || null,
        phone: formData.phone || null,
        photo_url: formData.photo_url || null,
        bar_number: formData.bar_number || null,
        years_experience: formData.years_experience ? parseInt(formData.years_experience.toString()) : null,
        law_firm_id: formData.law_firm_id || null,
        specializations: formData.specializations && formData.specializations.length > 0 ? formData.specializations : null,
        education: formData.education && formData.education.length > 0 ? formData.education : null,
        awards: formData.awards && formData.awards.length > 0 ? formData.awards : null,
        bar_admissions: formData.bar_admissions && formData.bar_admissions.length > 0 ? formData.bar_admissions : null,
        publications: formData.publications && formData.publications.length > 0 ? formData.publications : null,
        professional_memberships: formData.professional_memberships && formData.professional_memberships.length > 0 ? formData.professional_memberships : null,
        certifications: formData.certifications && formData.certifications.length > 0 ? formData.certifications : null,
        languages: formData.languages && formData.languages.length > 0 ? formData.languages : null,
        linkedin_url: formData.linkedin_url || null,
        twitter_url: formData.twitter_url || null,
        practice_focus: formData.practice_focus || null,
        approach: formData.approach || null,
        consultation_fee: formData.consultation_fee || null,
        accepts_new_clients: formData.accepts_new_clients,
        consultation_available: formData.consultation_available,
        office_address: formData.office_address || null,
        office_hours: formData.office_hours || null,
        credentials_summary: formData.credentials_summary || null,
        media_mentions: formData.media_mentions && formData.media_mentions.length > 0 ? formData.media_mentions : null,
        speaking_engagements: formData.speaking_engagements && formData.speaking_engagements.length > 0 ? formData.speaking_engagements : null,
        rating: formData.rating ? parseFloat(formData.rating.toString()) : null,
        review_count: formData.review_count ? parseInt(formData.review_count.toString()) : 0,
        verified: formData.verified,
        featured: formData.featured,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
      }

      let error: any = null
      let lawyerId = lawyer.id

      if (isNew) {
        const { data, error: insertError } = await supabase
          .from('lawyers')
          .insert(dataToSave)
          .select()
          .single()
        
        error = insertError
        if (!error && data) {
          lawyerId = data.id
        }
      } else {
        dataToSave.updated_at = new Date().toISOString()
        const { error: updateError } = await supabase
          .from('lawyers')
          .update(dataToSave)
          .eq('id', lawyer.id)
        
        error = updateError
      }

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Save service areas
      if (lawyerId) {
        // Delete existing service areas
        await supabase
          .from('lawyer_service_areas')
          .delete()
          .eq('lawyer_id', lawyerId)

        // Insert new service areas
        if (serviceAreas.length > 0) {
          const { error: serviceAreaError } = await supabase
            .from('lawyer_service_areas')
            .insert(serviceAreas.map(sa => ({ lawyer_id: lawyerId, city_id: sa.city_id })))
          
          if (serviceAreaError) {
            console.error('Error saving service areas:', serviceAreaError)
          }
        }
      }

      setSuccess(isNew ? 'Lawyer profile created successfully!' : 'Lawyer profile updated successfully!')
      if (isNew && lawyerId) {
        router.push(`/admin/directory/lawyers/${lawyerId}`)
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

  const addServiceArea = () => {
    setServiceAreas([...serviceAreas, { city_id: '' }])
  }

  const removeServiceArea = (index: number) => {
    setServiceAreas(serviceAreas.filter((_, i) => i !== index))
  }

  const updateServiceArea = (index: number, city_id: string) => {
    const updated = [...serviceAreas]
    updated[index] = { ...updated[index], city_id }
    setServiceAreas(updated)
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

      {/* Debug Info - Remove this after debugging */}
      {!isNew && (
        <details className="bg-yellow-50 border border-yellow-200 rounded p-4 text-xs">
          <summary className="cursor-pointer font-semibold text-yellow-800 mb-2">
            🔍 Debug Info (Click to expand)
          </summary>
          <div className="space-y-2 text-yellow-700">
            <div>
              <strong>Raw specializations from DB:</strong> {JSON.stringify(lawyer?.specializations)}
            </div>
            <div>
              <strong>Type:</strong> {typeof lawyer?.specializations} | 
              <strong> Is Array:</strong> {Array.isArray(lawyer?.specializations) ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Normalized specializations:</strong> {JSON.stringify(formData.specializations)}
            </div>
            <div>
              <strong>Raw bar_admissions:</strong> {JSON.stringify(lawyer?.bar_admissions)}
            </div>
            <div>
              <strong>Normalized bar_admissions:</strong> {JSON.stringify(formData.bar_admissions)}
            </div>
            <div>
              <strong>Raw education:</strong> {JSON.stringify(lawyer?.education)}
            </div>
            <div>
              <strong>Normalized education:</strong> {JSON.stringify(formData.education)}
            </div>
          </div>
        </details>
      )}

      {/* Basic Information */}
      <div>
        <SectionHeader id="basic" title="Basic Information" icon="👤" />
        {activeSection === 'basic' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                id="first_name"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                id="last_name"
                required
                value={formData.last_name}
                onChange={(e) => {
                  const last_name = e.target.value
                  setFormData({ 
                    ...formData, 
                    last_name,
                    slug: formData.slug || `${formData.first_name}-${last_name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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
                placeholder="first-name-last-name"
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Professional Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g., Partner, Associate Attorney"
              />
            </div>

            <div>
              <label htmlFor="law_firm_id" className="block text-sm font-medium text-gray-700 mb-1">
                Law Firm
              </label>
              <select
                id="law_firm_id"
                value={formData.law_firm_id}
                onChange={(e) => setFormData({ ...formData, law_firm_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                disabled={loadingFirms}
              >
                <option value="">No firm</option>
                {lawFirms.map((firm) => (
                  <option key={firm.id} value={firm.id}>
                    {firm.name}
                  </option>
                ))}
              </select>
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

            <div className="md:col-span-2">
              <label htmlFor="photo_url" className="block text-sm font-medium text-gray-700 mb-1">
                Photo URL
              </label>
              <input
                type="url"
                id="photo_url"
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio (Plain Text)
              </label>
              <textarea
                id="bio"
                rows={6}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Enter lawyer biography (plain text, not HTML)..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Professional Information */}
      <div>
        <SectionHeader id="professional" title="Professional Information" icon="⚖️" />
        {activeSection === 'professional' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="bar_number" className="block text-sm font-medium text-gray-700 mb-1">
                Bar Number
              </label>
              <input
                type="text"
                id="bar_number"
                value={formData.bar_number}
                onChange={(e) => setFormData({ ...formData, bar_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder={!formData.bar_number ? "Enter bar number (e.g., GA123456)" : ""}
              />
              {!formData.bar_number && (
                <p className="mt-1 text-xs text-gray-500">Bar number not found in database. Enter manually if available.</p>
              )}
            </div>

            <div>
              <label htmlFor="years_experience" className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                id="years_experience"
                min="0"
                value={formData.years_experience}
                onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder={!formData.years_experience ? "Enter years (e.g., 25)" : ""}
              />
              {!formData.years_experience && (
                <p className="mt-1 text-xs text-gray-500">
                  Years of experience not found. Run: <code className="bg-gray-100 px-1 rounded">npm run check-and-update-all-data</code> to extract from WordPress data.
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specializations (Select from list)
              </label>
              <div className="mb-2 text-xs text-gray-500">
                Current selections: {formData.specializations.length > 0 ? formData.specializations.join(', ') : 'None'}
                {formData.specializations.length === 0 && (
                  <span className="ml-2 text-orange-600">
                    (No data in database. Run: <code className="bg-gray-100 px-1 rounded">npm run check-and-update-all-data</code>)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                {LAW_SPECIALTIES.map((specialty) => {
                  // Case-insensitive comparison to handle slight variations
                  const isChecked = formData.specializations.some(
                    s => s.toLowerCase().trim() === specialty.toLowerCase().trim()
                  )
                  return (
                    <label key={specialty} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleArrayItem('specializations', specialty)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>{specialty}</span>
                    </label>
                  )
                })}
              </div>
              {formData.specializations.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  <strong>Note:</strong> Some specializations in the database may not match the predefined list. 
                  You can see them in the text fields below or update them to match the list.
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bar Admissions (Select states)
              </label>
              <div className="mb-2 text-xs text-gray-500">
                Current selections: {formData.bar_admissions.length > 0 ? formData.bar_admissions.join(', ') : 'None'}
                {formData.bar_admissions.length === 0 && (
                  <span className="ml-2 text-orange-600">
                    (No data in database. Run: <code className="bg-gray-100 px-1 rounded">npm run check-and-update-all-data</code>)
                  </span>
                )}
                {formData.bar_admissions.length > 0 && (
                  <div className="mt-1 text-xs text-gray-400">
                    Note: Checkboxes are checked if the state name or code appears in the admission text (e.g., "State Bar of Georgia" matches "Georgia").
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                {US_STATES.map((state) => {
                  // Match by state code (GA) or state name (Georgia) in the bar admission text
                  const isChecked = formData.bar_admissions.some(s => {
                    const normalized = s.toUpperCase().trim()
                    return normalized === state.value.toUpperCase().trim() || 
                           normalized.includes(state.label.toUpperCase()) ||
                           normalized.includes(state.value.toUpperCase())
                  })
                  return (
                    <label key={state.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleArrayItem('bar_admissions', state.value)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>{state.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1">
                Education (one per line)
              </label>
              <textarea
                id="education"
                rows={4}
                value={Array.isArray(formData.education) ? formData.education.join('\n') : formData.education || ''}
                onChange={(e) => {
                  const education = e.target.value.split('\n').map(s => s.trim()).filter(s => s)
                  setFormData({ ...formData, education })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="J.D., Harvard Law School, 2010&#10;B.A., Yale University, 2007"
              />
              {(!formData.education || (Array.isArray(formData.education) && formData.education.length === 0)) && (
                <p className="mt-1 text-xs text-gray-500">
                  Education not found. Run: <code className="bg-gray-100 px-1 rounded">npm run check-and-update-all-data</code> to extract from WordPress data.
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Memberships
              </label>
              <div className="mb-2 text-xs text-gray-500">
                Current selections: {formData.professional_memberships.length > 0 ? formData.professional_memberships.join(', ') : 'None'}
                {formData.professional_memberships.length === 0 && (
                  <span className="ml-2 text-orange-600">
                    (No data in database. Run: <code className="bg-gray-100 px-1 rounded">npm run check-and-update-all-data</code>)
                  </span>
                )}
                {formData.professional_memberships.length > 0 && (
                  <div className="mt-1 text-xs text-gray-400">
                    Note: Checkboxes are checked if the membership name appears in the text (e.g., "Fellow, American Academy of Matrimonial Lawyers" matches "American Academy of Matrimonial Lawyers").
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                {PROFESSIONAL_MEMBERSHIPS.map((membership) => {
                  // Match by exact name or if the membership text contains the predefined name
                  // (handles cases like "Fellow, American Academy of Matrimonial Lawyers")
                  const isChecked = formData.professional_memberships.some(m => {
                    const normalizedM = m.toLowerCase().trim()
                    const normalizedMembership = membership.toLowerCase().trim()
                    return normalizedM === normalizedMembership || 
                           normalizedM.includes(normalizedMembership) ||
                           normalizedMembership.includes(normalizedM)
                  })
                  return (
                    <label key={membership} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleArrayItem('professional_memberships', membership)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>{membership}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certifications
              </label>
              <div className="mb-2 text-xs text-gray-500">
                Current selections: {formData.certifications.length > 0 ? formData.certifications.join(', ') : 'None'}
                {formData.certifications.length === 0 && (
                  <span className="ml-2 text-orange-600">
                    (No data in database. Certifications may need to be entered manually.)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                {CERTIFICATIONS.map((cert) => {
                  const isChecked = formData.certifications.some(
                    c => c.toLowerCase().trim() === cert.toLowerCase().trim()
                  )
                  return (
                    <label key={cert} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleArrayItem('certifications', cert)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>{cert}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="credentials_summary" className="block text-sm font-medium text-gray-700 mb-1">
                Credentials Summary (Plain Text)
              </label>
              <textarea
                id="credentials_summary"
                rows={3}
                value={formData.credentials_summary}
                onChange={(e) => setFormData({ ...formData, credentials_summary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Brief summary of credentials..."
              />
              {!formData.credentials_summary && (
                <p className="mt-1 text-xs text-gray-500">Credentials summary not found in database. Enter manually if available.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Practice & Approach */}
      <div>
        <SectionHeader id="practice" title="Practice & Approach" icon="🎯" />
        {activeSection === 'practice' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="practice_focus" className="block text-sm font-medium text-gray-700 mb-1">
                Practice Focus (Plain Text)
              </label>
              <textarea
                id="practice_focus"
                rows={3}
                value={formData.practice_focus}
                onChange={(e) => setFormData({ ...formData, practice_focus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Brief statement about practice focus..."
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="approach" className="block text-sm font-medium text-gray-700 mb-1">
                Approach (Plain Text)
              </label>
              <textarea
                id="approach"
                rows={3}
                value={formData.approach}
                onChange={(e) => setFormData({ ...formData, approach: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Approach to cases (e.g., collaborative, aggressive, etc.)..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages Spoken
              </label>
              <div className="mb-2 text-xs text-gray-500">
                Current selections: {formData.languages.length > 0 ? formData.languages.join(', ') : 'None'}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                {LANGUAGES.map((lang) => {
                  const isChecked = formData.languages.some(
                    l => l.toLowerCase().trim() === lang.toLowerCase().trim()
                  )
                  return (
                    <label key={lang} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleArrayItem('languages', lang)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>{lang}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Areas (Cities where lawyer practices)
              </label>
              <div className="mb-2 text-xs text-gray-500">
                Current service areas: {serviceAreas.length > 0 ? `${serviceAreas.length} cities` : 'None'}
                {serviceAreas.length === 0 && (
                  <span className="ml-2 text-orange-600">
                    (No service areas found. Check console for errors.)
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {serviceAreas.length === 0 ? (
                  <div>
                    <p className="text-sm text-gray-500 italic mb-2">No service areas configured. Click "+ Add Service Area" to add cities.</p>
                    <p className="text-xs text-gray-400">Debug: serviceAreas state = {JSON.stringify(serviceAreas)}</p>
                  </div>
                ) : (
                  serviceAreas.map((sa, index) => {
                    const selectedCity = cities.find(c => c.id === sa.city_id)
                    return (
                      <div key={`sa-${index}-${sa.city_id || 'new'}`} className="flex gap-2">
                        <select
                          value={sa.city_id || ''}
                          onChange={(e) => updateServiceArea(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                          disabled={loadingCities}
                        >
                          <option value="">Select a city...</option>
                          {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.name}, {city.states?.abbreviation || ''}
                            </option>
                          ))}
                        </select>
                        {selectedCity && (
                          <span className="px-3 py-2 text-sm text-gray-600 self-center">
                            {selectedCity.name}, {selectedCity.states?.abbreviation || ''}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeServiceArea(index)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })
                )}
                <button
                  type="button"
                  onClick={addServiceArea}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  + Add Service Area
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recognition & Media */}
      <div>
        <SectionHeader id="recognition" title="Recognition & Media" icon="🏆" />
        {activeSection === 'recognition' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="awards" className="block text-sm font-medium text-gray-700 mb-1">
                Awards & Recognition (one per line)
              </label>
              <textarea
                id="awards"
                rows={4}
                value={Array.isArray(formData.awards) ? formData.awards.join('\n') : formData.awards || ''}
                onChange={(e) => {
                  const awards = e.target.value.split('\n').map(s => s.trim()).filter(s => s)
                  setFormData({ ...formData, awards })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Super Lawyers, 2020-2024&#10;Best Lawyers in America, 2021&#10;AV Preeminent Rating"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="publications" className="block text-sm font-medium text-gray-700 mb-1">
                Publications (one per line)
              </label>
              <textarea
                id="publications"
                rows={4}
                value={Array.isArray(formData.publications) ? formData.publications.join('\n') : formData.publications || ''}
                onChange={(e) => {
                  const publications = e.target.value.split('\n').map(s => s.trim()).filter(s => s)
                  setFormData({ ...formData, publications })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Article Title, Journal Name, 2023&#10;Book Title, Publisher, 2022"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="media_mentions" className="block text-sm font-medium text-gray-700 mb-1">
                Media Mentions (one per line)
              </label>
              <textarea
                id="media_mentions"
                rows={3}
                value={Array.isArray(formData.media_mentions) ? formData.media_mentions.join('\n') : formData.media_mentions || ''}
                onChange={(e) => {
                  const media_mentions = e.target.value.split('\n').map(s => s.trim()).filter(s => s)
                  setFormData({ ...formData, media_mentions })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Featured in The New York Times, 2023&#10;Interview on CNN, 2022"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="speaking_engagements" className="block text-sm font-medium text-gray-700 mb-1">
                Speaking Engagements (one per line)
              </label>
              <textarea
                id="speaking_engagements"
                rows={3}
                value={Array.isArray(formData.speaking_engagements) ? formData.speaking_engagements.join('\n') : formData.speaking_engagements || ''}
                onChange={(e) => {
                  const speaking_engagements = e.target.value.split('\n').map(s => s.trim()).filter(s => s)
                  setFormData({ ...formData, speaking_engagements })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Keynote Speaker, Family Law Conference, 2023&#10;Panelist, ABA Annual Meeting, 2022"
              />
            </div>
          </div>
        )}
      </div>

      {/* Contact & Office */}
      <div>
        <SectionHeader id="contact" title="Contact & Office Information" icon="📞" />
        {activeSection === 'contact' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="office_address" className="block text-sm font-medium text-gray-700 mb-1">
                Office Address
              </label>
              <input
                type="text"
                id="office_address"
                value={formData.office_address}
                onChange={(e) => setFormData({ ...formData, office_address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="office_hours" className="block text-sm font-medium text-gray-700 mb-1">
                Office Hours
              </label>
              <input
                type="text"
                id="office_hours"
                value={formData.office_hours}
                onChange={(e) => setFormData({ ...formData, office_hours: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Monday-Friday, 9am-5pm"
              />
            </div>

            <div>
              <label htmlFor="consultation_fee" className="block text-sm font-medium text-gray-700 mb-1">
                Consultation Fee
              </label>
              <input
                type="text"
                id="consultation_fee"
                value={formData.consultation_fee}
                onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Free, $150, etc."
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.accepts_new_clients}
                  onChange={(e) => setFormData({ ...formData, accepts_new_clients: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Accepts New Clients</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.consultation_available}
                  onChange={(e) => setFormData({ ...formData, consultation_available: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Consultation Available</span>
              </label>
            </div>

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
                placeholder="https://linkedin.com/in/..."
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
          {loading ? 'Saving...' : (isNew ? 'Create Lawyer' : 'Save Changes')}
        </button>
      </div>
    </form>
  )
}
