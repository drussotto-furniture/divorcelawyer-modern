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
import LawFirmSelector from './LawFirmSelector'
import { MediaUpload } from './MediaUpload'
import { decodeHtmlEntities } from '@/lib/utils/html-entities'
import { stripHtml } from '@/lib/utils/strip-html'

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

  const sections = [
    { id: 'basic', title: 'Basic Information', icon: '👤' },
    { id: 'professional', title: 'Professional Information', icon: '⚖️' },
    { id: 'practice', title: 'Practice & Approach', icon: '🎯' },
    { id: 'recognition', title: 'Recognition & Media', icon: '🏆' },
    { id: 'contact', title: 'Contact & Office Information', icon: '📞' },
    { id: 'ratings', title: 'Ratings & Status', icon: '⭐' },
    { id: 'seo', title: 'SEO & Meta Information', icon: '🔍' },
    { id: 'subscription', title: 'Subscription', icon: '💳' },
  ]

  // Update active section based on scroll position
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id.replace('section-', '')
          setActiveSection(sectionId)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    // Observe all section headers
    sections.forEach((section) => {
      const element = document.getElementById(`section-${section.id}`)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      sections.forEach((section) => {
        const element = document.getElementById(`section-${section.id}`)
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [sections])
  const [subscriptionLimitCheck, setSubscriptionLimitCheck] = useState<{
    checking: boolean
    canUpgrade: boolean
    message: string
    targetSubscription: string | null
  }>({
    checking: false,
    canUpgrade: true,
    message: '',
    targetSubscription: null,
  })

  // Normalize lawyer data on mount and decode HTML entities
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
    // Decode HTML entities from database and strip HTML from bio
    first_name: decodeHtmlEntities(lawyer?.first_name),
    last_name: decodeHtmlEntities(lawyer?.last_name),
    title: decodeHtmlEntities(lawyer?.title),
    // Strip HTML from main field if it exists, or use _html field as fallback
    bio: lawyer?.bio ? stripHtml(lawyer.bio) : stripHtml(lawyer?.bio_html || ''),
    office_address: decodeHtmlEntities(lawyer?.office_address),
    office_street_address: decodeHtmlEntities(lawyer?.office_street_address),
    office_address_line_2: decodeHtmlEntities(lawyer?.office_address_line_2),
    credentials_summary: decodeHtmlEntities(lawyer?.credentials_summary),
    practice_focus: decodeHtmlEntities(lawyer?.practice_focus),
    approach: decodeHtmlEntities(lawyer?.approach),
    meta_title: decodeHtmlEntities(lawyer?.meta_title),
    meta_description: decodeHtmlEntities(lawyer?.meta_description),
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
    photo_storage_id: (normalizedLawyer as any).photo_storage_id || '',
    video_url: (normalizedLawyer as any).video_url || '',
    video_storage_id: (normalizedLawyer as any).video_storage_id || '',
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
    office_street_address: normalizedLawyer.office_street_address || '',
    office_address_line_2: normalizedLawyer.office_address_line_2 || '',
    office_city_id: normalizedLawyer.office_city_id || '',
    office_state_id: normalizedLawyer.office_state_id || '',
    office_zip_code: normalizedLawyer.office_zip_code || '',
    office_hours: normalizedLawyer.office_hours || '',
    credentials_summary: normalizedLawyer.credentials_summary || '',
    media_mentions: normalizedLawyer.media_mentions,
    speaking_engagements: normalizedLawyer.speaking_engagements,
    rating: normalizedLawyer.rating || '',
    review_count: normalizedLawyer.review_count || 0,
    verified: normalizedLawyer.verified ?? false,
    featured: normalizedLawyer.featured ?? false,
    subscription_type: normalizedLawyer.subscription_type || 'free',
    meta_title: normalizedLawyer.meta_title || '',
    meta_description: normalizedLawyer.meta_description || '',
  })

  // Check subscription limits when subscription type changes
  const checkSubscriptionLimit = async (targetSubscription: string, currentSubscription: string): Promise<{ canUpgrade: boolean; message: string }> => {
    if (targetSubscription === currentSubscription) {
      setSubscriptionLimitCheck({
        checking: false,
        canUpgrade: true,
        message: '',
        targetSubscription: null,
      })
      return { canUpgrade: true, message: '' }
    }

    setSubscriptionLimitCheck({
      checking: true,
      canUpgrade: true,
      message: '',
      targetSubscription,
    })

    try {
      // Get the lawyer's law firm to find their DMA
      const firmId = formData.law_firm_id || lawyer?.law_firm_id
      const firm = firmId ? await supabase
        .from('law_firms')
        .select(`
          id,
          city_id,
          cities (
            id,
            zip_codes (
              id,
              zip_code_dmas (
                dma_id
              )
            )
          )
        `)
        .eq('id', firmId)
        .maybeSingle() : null

      let dmaId: string | null = null

      if (firm?.data?.cities?.zip_codes) {
        for (const zipCode of firm.data.cities.zip_codes) {
          if (zipCode.zip_code_dmas && zipCode.zip_code_dmas.length > 0) {
            dmaId = (zipCode.zip_code_dmas[0] as any).dma_id
            break
          }
        }
      }

      if (!dmaId) {
        // If no DMA found, check global limits only
        const { data: globalLimit } = await (supabase as any)
          .from('subscription_limits')
          .select('max_lawyers')
          .eq('location_type', 'global')
          .eq('location_value', 'default')
          .eq('subscription_type', targetSubscription)
          .maybeSingle()

        if (globalLimit?.max_lawyers !== null) {
          // Check current count globally (excluding this lawyer if editing)
          const { count } = await supabase
            .from('lawyers')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_type', targetSubscription)
            .neq('id', lawyer?.id || '')

          const currentCount = count || 0
          const maxAllowed = globalLimit.max_lawyers

          if (currentCount >= maxAllowed) {
            const result = {
              canUpgrade: false,
              message: `The ${targetSubscription} subscription is currently at capacity (${currentCount}/${maxAllowed}). Please contact support to be added to a waitlist.`,
            }
            setSubscriptionLimitCheck({
              checking: false,
              ...result,
              targetSubscription,
            })
            return result
          }
        }
      } else {
        // Check DMA-specific limits
        const { data: dmaLimit } = await (supabase as any)
          .from('subscription_limits')
          .select('max_lawyers')
          .eq('location_type', 'dma')
          .eq('location_value', String(dmaId))
          .eq('subscription_type', targetSubscription)
          .maybeSingle()

        let maxAllowed: number | null = null
        if (dmaLimit?.max_lawyers !== null) {
          maxAllowed = dmaLimit.max_lawyers
        } else {
          // Fall back to global limit
          const { data: globalLimit } = await supabase
            .from('subscription_limits')
            .select('max_lawyers')
            .eq('location_type', 'global')
            .eq('location_value', 'default')
            .eq('subscription_type', targetSubscription)
            .maybeSingle()
          maxAllowed = globalLimit?.max_lawyers ?? null
        }

        if (maxAllowed !== null) {
          // Count lawyers in this DMA with target subscription (excluding this lawyer if editing)
          const { data: lawyersInDMA } = await supabase
            .from('lawyers')
            .select(`
              id,
              law_firms (
                city_id,
                cities (
                  zip_codes (
                    zip_code_dmas (
                      dma_id
                    )
                  )
                )
              )
            `)
            .eq('subscription_type', targetSubscription)
            .neq('id', lawyer?.id || '')

          const lawyersInTargetDMA = (lawyersInDMA || []).filter(l => {
            const firm = l.law_firms as any
            if (firm?.cities?.zip_codes) {
              for (const zipCode of firm.cities.zip_codes) {
                if (zipCode.zip_code_dmas && zipCode.zip_code_dmas.length > 0) {
                  const zipDma = zipCode.zip_code_dmas[0] as any
                  if (zipDma.dma_id === dmaId) {
                    return true
                  }
                }
              }
            }
            return false
          })

          const currentCount = lawyersInTargetDMA.length

          if (currentCount >= maxAllowed) {
            const result = {
              canUpgrade: false,
              message: `The ${targetSubscription} subscription is currently at capacity in your market area (${currentCount}/${maxAllowed}). Please contact support to be added to a waitlist.`,
            }
            setSubscriptionLimitCheck({
              checking: false,
              ...result,
              targetSubscription,
            })
            return result
          }
        }
      }

      const result = {
        canUpgrade: true,
        message: `You can upgrade to ${targetSubscription}.`,
      }
      setSubscriptionLimitCheck({
        checking: false,
        ...result,
        targetSubscription,
      })
      return result
    } catch (err: any) {
      console.error('Error checking subscription limit:', err)
      const result = {
        canUpgrade: true,
        message: 'Unable to verify subscription availability. Please contact support.',
      }
      setSubscriptionLimitCheck({
        checking: false,
        ...result,
        targetSubscription,
      })
      return result
    }
  }

  const handleUpgradeClick = async () => {
    // Determine next subscription tier
    const subscriptionOrder = ['free', 'basic', 'enhanced', 'premium']
    const currentIndex = subscriptionOrder.indexOf(formData.subscription_type)
    const nextIndex = currentIndex + 1

    if (nextIndex >= subscriptionOrder.length) {
      alert('You are already on the highest subscription tier.')
      return
    }

    const targetSubscription = subscriptionOrder[nextIndex]
    
    // Check limits first
    const result = await checkSubscriptionLimit(targetSubscription, formData.subscription_type)
    
    if (result.canUpgrade) {
      // Allow the upgrade
      setFormData({ ...formData, subscription_type: targetSubscription as any })
      setSuccess(`Subscription upgraded to ${targetSubscription}`)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

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
  const [states, setStates] = useState<Array<{ id: string; name: string; abbreviation: string }>>([])
  const [dmas, setDmas] = useState<Array<{ id: string; name: string; code: number }>>([])
  const [serviceAreas, setServiceAreas] = useState<Array<{ dma_id: string; subscription_type?: string }>>([])
  const [subscriptionTypes, setSubscriptionTypes] = useState<Array<{ name: string; display_name: string; sort_order: number }>>([])
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingDmas, setLoadingDmas] = useState(false)
  const [selectedFirm, setSelectedFirm] = useState<any>(null)

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

  // Load cities on mount (still needed for address fields)
  useEffect(() => {
    const loadCities = async () => {
      setLoadingCities(true)
      const { data } = await supabase
        .from('cities')
        .select('id, name, state_id, states(abbreviation)')
        .order('name')
        .limit(500)
      if (data) {
        setCities(data as any)
      }
      setLoadingCities(false)
    }
    loadCities()
  }, [])

  // Load DMAs on mount
  useEffect(() => {
    const loadDmas = async () => {
      setLoadingDmas(true)
      const { data } = await (supabase as any)
        .from('dmas')
        .select('id, name, code')
        .order('name')
      if (data) {
        setDmas(data as any)
      }
      setLoadingDmas(false)
    }
    loadDmas()
  }, [])

  // Load states on mount
  useEffect(() => {
    const loadStates = async () => {
      const { data } = await supabase
        .from('states')
        .select('id, name, abbreviation')
        .order('name')
      if (data) {
        setStates(data)
      }
    }
    loadStates()
  }, [])

  // Auto-populate address when law firm is selected
  useEffect(() => {
    if (selectedFirm) {
      // Fetch full firm details including address
      const loadFirmDetails = async () => {
        const { data } = await supabase
          .from('law_firms')
          .select(`
            street_address,
            address_line_2,
            city_id,
            state_id,
            zip_code,
            cities (
              id,
              name,
              state_id,
              states (
                id,
                abbreviation
              )
            )
          `)
          .eq('id', selectedFirm.id)
          .single()

        if (data) {
          setFormData(prev => ({
            ...prev,
            office_street_address: data.street_address || prev.office_street_address || '',
            office_address_line_2: data.address_line_2 || prev.office_address_line_2 || '',
            office_city_id: data.city_id || prev.office_city_id || '',
            office_state_id: data.state_id || prev.office_state_id || '',
            office_zip_code: data.zip_code || prev.office_zip_code || '',
          }))
        }
      }
      loadFirmDetails()
    }
  }, [selectedFirm, supabase])

  // Auto-populate first service area from lawyer's zip code
  const autoPopulateServiceAreaFromZip = async () => {
    const zipCode = formData.office_zip_code || normalizedLawyer.office_zip_code
    if (!zipCode) return

    try {
      // Get zip code ID
      const { data: zipCodeData } = await supabase
        .from('zip_codes')
        .select('id')
        .eq('zip_code', zipCode)
        .maybeSingle()

      if (!zipCodeData) return

      // Get DMA for this zip code
      const { data: dmaMapping } = await (supabase as any)
        .from('zip_code_dmas')
        .select(`
          dma_id,
          dmas (
            id,
            name,
            code
          )
        `)
        .eq('zip_code_id', zipCodeData.id)
        .maybeSingle()

      if (dmaMapping && (dmaMapping as any).dmas) {
        const dma = (dmaMapping as any).dmas
        // Only auto-populate if no service areas exist
        setServiceAreas(prev => {
          if (prev.length === 0 || !prev.some(sa => sa.dma_id === dma.id)) {
            return [{ dma_id: dma.id }]
          }
          return prev
        })
        console.log(`[LawyerEditForm] Auto-populated service area with DMA: ${dma.name} (${dma.code})`)
      }
    } catch (err) {
      console.error('[LawyerEditForm] Error auto-populating service area:', err)
    }
  }

  // Load subscription types
  useEffect(() => {
    const loadSubscriptionTypes = async () => {
      const { data } = await (supabase as any)
        .from('subscription_types')
        .select('name, display_name, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (data) {
        setSubscriptionTypes(data)
      }
    }
    loadSubscriptionTypes()
  }, [supabase])

  // Load service areas and their subscriptions if editing existing lawyer
  useEffect(() => {
    if (!isNew && lawyer?.id) {
      console.log('[LawyerEditForm] Loading service areas for lawyer:', lawyer.id)
      const loadServiceAreas = async () => {
        try {
          // Load service areas
          const { data: serviceAreasData, error: saError } = await supabase
            .from('lawyer_service_areas')
            .select('dma_id')
            .eq('lawyer_id', lawyer.id)
          
          if (saError) {
            console.error('[LawyerEditForm] Error loading service areas:', saError)
            return
          }

          if (serviceAreasData && serviceAreasData.length > 0) {
            console.log('[LawyerEditForm] Loaded service areas:', serviceAreasData)
            
            // Load subscriptions for each DMA
            const dmaIds = serviceAreasData.map(sa => sa.dma_id).filter((id): id is string => !!id)
            const { data: subscriptionsData } = await (supabase as any)
              .from('lawyer_dma_subscriptions')
              .select('dma_id, subscription_type')
              .eq('lawyer_id', lawyer.id)
              .in('dma_id', dmaIds)
            
            // Create map of dma_id -> subscription_type
            const subscriptionMap = new Map<string, string>()
            if (subscriptionsData) {
              subscriptionsData.forEach(sub => {
                subscriptionMap.set(sub.dma_id, sub.subscription_type)
              })
            }
            
            // Combine service areas with their subscriptions
            const serviceAreasWithSubs = serviceAreasData.map(sa => ({
              dma_id: sa.dma_id || '',
              subscription_type: subscriptionMap.get(sa.dma_id || '') || 'free'
            }))
            
            setServiceAreas(serviceAreasWithSubs)
          } else {
            console.log('[LawyerEditForm] No service areas found for lawyer:', lawyer.id)
            // Auto-populate from zip code if available
            await autoPopulateServiceAreaFromZip()
          }
        } catch (err) {
          console.error('[LawyerEditForm] Exception loading service areas:', err)
        }
      }
      loadServiceAreas()
    }
  }, [lawyer?.id, isNew, supabase, formData.subscription_type])

  // Auto-populate service area when zip code changes (for new lawyers or when updating)
  useEffect(() => {
    if (formData.office_zip_code) {
      // Only auto-populate if no service areas exist or if the zip code changed
      const currentZip = formData.office_zip_code
      const timer = setTimeout(() => {
        autoPopulateServiceAreaFromZip()
      }, 500) // Debounce to avoid too many calls
      return () => clearTimeout(timer)
    }
  }, [formData.office_zip_code])

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
        // Save plain text to main bio field (HTML is stored separately in bio_html field)
        bio: formData.bio || null,
        // Preserve existing HTML if it exists, otherwise set to null
        bio_html: lawyer?.bio_html || null,
        email: formData.email || null,
        phone: formData.phone || null,
        photo_url: formData.photo_url || null,
        photo_storage_id: formData.photo_storage_id || null,
        video_url: formData.video_url || null,
        video_storage_id: formData.video_storage_id || null,
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
        office_street_address: formData.office_street_address || null,
        office_address_line_2: formData.office_address_line_2 || null,
        office_city_id: formData.office_city_id || null,
        office_state_id: formData.office_state_id || null,
        office_zip_code: formData.office_zip_code || null,
        office_hours: formData.office_hours || null,
        credentials_summary: formData.credentials_summary || null,
        media_mentions: formData.media_mentions && formData.media_mentions.length > 0 ? formData.media_mentions : null,
        speaking_engagements: formData.speaking_engagements && formData.speaking_engagements.length > 0 ? formData.speaking_engagements : null,
        rating: formData.rating ? parseFloat(formData.rating.toString()) : null,
        review_count: formData.review_count ? parseInt(formData.review_count.toString()) : 0,
        verified: formData.verified,
        featured: formData.featured,
        subscription_type: formData.subscription_type,
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
        // Provide more descriptive error messages
        let errorMessage = error.message || 'An error occurred while saving.'
        
        // Common error patterns and user-friendly messages
        if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
          if (error.message?.includes('slug')) {
            errorMessage = 'A lawyer with this slug already exists. Please change the slug to a unique value.'
          } else if (error.message?.includes('email')) {
            errorMessage = 'A lawyer with this email already exists. Please use a different email address.'
          } else {
            errorMessage = 'This record already exists. Please check for duplicate entries.'
          }
        } else if (error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
          errorMessage = 'Invalid reference selected. Please check the law firm, city, or state selections.'
        } else if (error.message?.includes('null value') || error.message?.includes('not null')) {
          errorMessage = 'Required fields are missing. Please fill in all required fields.'
        } else if (error.message?.includes('invalid input')) {
          errorMessage = 'Invalid data format. Please check your input and try again.'
        }
        
        setError(errorMessage)
        setLoading(false)
        return
      }

      // Save service areas (using DMAs)
      if (lawyerId) {
        // Delete existing service areas
        await supabase
          .from('lawyer_service_areas')
          .delete()
          .eq('lawyer_id', lawyerId)

        // Delete existing DMA subscriptions
        await (supabase as any)
          .from('lawyer_dma_subscriptions')
          .delete()
          .eq('lawyer_id', lawyerId)

        // Insert new service areas (filter out empty dma_id and deduplicate)
        const validServiceAreas = serviceAreas.filter(sa => sa.dma_id)
        
        // Deduplicate by dma_id (in case user added same DMA twice)
        const uniqueServiceAreas = Array.from(
          new Map(validServiceAreas.map(sa => [sa.dma_id, sa])).values()
        )
        
        if (uniqueServiceAreas.length > 0) {
          // Save service areas
          const { error: serviceAreaError } = await supabase
            .from('lawyer_service_areas')
            .insert(uniqueServiceAreas.map(sa => ({ lawyer_id: lawyerId, dma_id: sa.dma_id })))
          
          if (serviceAreaError) {
            console.error('Error saving service areas:', serviceAreaError)
            setError(`Error saving service areas: ${serviceAreaError.message}`)
            setLoading(false)
            return
          }

          // Save DMA subscriptions (use upsert to handle any edge cases)
          const subscriptionsToSave = uniqueServiceAreas.map(sa => ({
            lawyer_id: lawyerId,
            dma_id: sa.dma_id,
            subscription_type: sa.subscription_type || 'free'
          }))

          // Use upsert instead of insert to handle any race conditions or duplicates
          const { error: subsError } = await (supabase as any)
            .from('lawyer_dma_subscriptions')
            .upsert(subscriptionsToSave, {
              onConflict: 'lawyer_id,dma_id'
            })
          
          if (subsError) {
            console.error('Error saving DMA subscriptions:', subsError)
            setError(`Error saving DMA subscriptions: ${subsError.message}`)
            setLoading(false)
            return
          }
        }
      }

      // Success - redirect to lawyers grid
      router.push('/admin/directory/lawyers')
    } catch (err: any) {
      // Handle unexpected errors
      const errorMessage = err?.message || 'An unexpected error occurred. Please try again.'
      setError(errorMessage)
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const addServiceArea = () => {
    setServiceAreas([...serviceAreas, { dma_id: '', subscription_type: 'free' }])
  }

  const removeServiceArea = (index: number) => {
    setServiceAreas(serviceAreas.filter((_, i) => i !== index))
  }

  const updateServiceArea = (index: number, dma_id: string) => {
    const updated = [...serviceAreas]
    updated[index] = { ...updated[index], dma_id, subscription_type: updated[index].subscription_type || 'free' }
    setServiceAreas(updated)
  }

  const updateServiceAreaSubscription = (index: number, subscription_type: string) => {
    const updated = [...serviceAreas]
    updated[index] = { ...updated[index], subscription_type }
    setServiceAreas(updated)
  }

  const toggleArrayItem = (field: string, value: string) => {
    const current = formData[field as keyof typeof formData] as string[]
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value]
    setFormData({ ...formData, [field]: updated })
  }

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const element = document.getElementById(`section-${sectionId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const SectionHeader = ({ id, title, icon }: { id: string; title: string; icon: string }) => (
    <div
      id={`section-${id}`}
      className="w-full flex items-center p-4 bg-gray-50 rounded-lg border-b-2 border-primary"
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
      {/* Tabs Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 space-y-8">
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


        {/* Basic Information Section */}
        <div>
          <SectionHeader id="basic" title="Basic Information" icon="👤" />
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
              <LawFirmSelector
                value={formData.law_firm_id}
                onChange={(firmId) => {
                  setFormData({ ...formData, law_firm_id: firmId })
                }}
                onFirmChange={(firm) => {
                  setSelectedFirm(firm)
                }}
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

            {/* Media Uploads */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <MediaUpload
                accept="image/*"
                bucket="lawyer-images"
                label="Profile Photo"
                currentUrl={formData.photo_url}
                onUpload={(url, storageId) => {
                  setFormData({ ...formData, photo_url: url, photo_storage_id: storageId })
                }}
              />

              <MediaUpload
                accept="video/*"
                bucket="lawyer-videos"
                label="Introduction Video"
                currentUrl={formData.video_url}
                onUpload={(url, storageId) => {
                  setFormData({ ...formData, video_url: url, video_storage_id: storageId })
                }}
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
                placeholder="Enter lawyer biography (plain text only, no HTML)..."
              />
              <p className="mt-1 text-xs text-gray-500">
                HTML has been removed from this field. Original HTML is preserved separately for display purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Professional Information Section */}
        <div>
          <SectionHeader id="professional" title="Professional Information" icon="⚖️" />
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
                    (s: string) => s.toLowerCase().trim() === specialty.toLowerCase().trim()
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
                  const isChecked = formData.bar_admissions.some((s: string) => {
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
                  const isChecked = formData.professional_memberships.some((m: string) => {
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
                    (c: string) => c.toLowerCase().trim() === cert.toLowerCase().trim()
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
        </div>

        {/* Practice & Approach Section */}
        <div>
          <SectionHeader id="practice" title="Practice & Approach" icon="🎯" />
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
                    (l: string) => l.toLowerCase().trim() === lang.toLowerCase().trim()
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

          </div>
        </div>

        {/* Recognition & Media Section */}
        <div>
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
        </div>

        {/* Contact & Office Information Section */}
        <div>
          <SectionHeader id="contact" title="Contact & Office Information" icon="📞" />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="office_street_address" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                id="office_street_address"
                value={formData.office_street_address}
                onChange={(e) => setFormData({ ...formData, office_street_address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g., 123 Main Street"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="office_address_line_2" className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                id="office_address_line_2"
                value={formData.office_address_line_2}
                onChange={(e) => setFormData({ ...formData, office_address_line_2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g., Suite 100"
              />
            </div>

            <div>
              <label htmlFor="office_state_id" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                id="office_state_id"
                value={formData.office_state_id}
                onChange={(e) => {
                  setFormData({ ...formData, office_state_id: e.target.value, office_city_id: '' })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="">Select a state...</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name} ({state.abbreviation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="office_city_id" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <select
                id="office_city_id"
                value={formData.office_city_id}
                onChange={(e) => setFormData({ ...formData, office_city_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                disabled={loadingCities || !formData.office_state_id}
              >
                <option value="">Select a city...</option>
                {cities
                  .filter(city => {
                    const cityStateId = (city as any).state_id
                    return !formData.office_state_id || cityStateId === formData.office_state_id
                  })
                  .map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}, {(city.states as any)?.abbreviation || ''}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label htmlFor="office_zip_code" className="block text-sm font-medium text-gray-700 mb-1">
                Zip Code
              </label>
              <input
                type="text"
                id="office_zip_code"
                value={formData.office_zip_code}
                onChange={(e) => setFormData({ ...formData, office_zip_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g., 30309"
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
        </div>

        {/* Ratings & Status Section */}
        <div>
          <SectionHeader id="ratings" title="Ratings & Status" icon="⭐" />
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
        </div>

        {/* SEO Section */}
        <div>
          <SectionHeader id="seo" title="SEO & Meta Information" icon="🔍" />
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
        </div>

        {/* Subscription Section */}
        <div>
          <SectionHeader id="subscription" title="Subscription" icon="💳" />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 font-medium mb-2">📌 Subscription Management</p>
                <p className="text-sm text-blue-700">
                  Subscriptions are managed per DMA (Designated Market Area). Each DMA can have its own subscription level. 
                  New service areas default to "Free" subscription and can be upgraded per DMA.
                </p>
              </div>
              
              {/* Service Areas with DMA Subscriptions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Areas (DMAs where lawyer practices)
                </label>
                <div className="mb-2 text-xs text-gray-500">
                  Current service areas: {serviceAreas.filter(sa => sa.dma_id).length > 0 ? `${serviceAreas.filter(sa => sa.dma_id).length} DMAs` : 'None'}
                  {serviceAreas.length === 0 && formData.office_zip_code && (
                    <span className="ml-2 text-blue-600">
                      (Will auto-populate from zip code: {formData.office_zip_code})
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {serviceAreas.length === 0 ? (
                    <div>
                      <p className="text-sm text-gray-500 italic mb-2">No service areas configured. The first service area will be auto-populated from your zip code, or click "+ Add Service Area" to add DMAs manually.</p>
                    </div>
                  ) : (
                    serviceAreas.map((sa, index) => {
                      const selectedDma = dmas.find(d => d.id === sa.dma_id)
                      return (
                        <div key={`sa-${index}-${sa.dma_id || 'new'}`} className="border border-gray-200 rounded-lg p-4 space-y-3">
                          <div className="flex gap-2 items-center">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-600 mb-1">DMA</label>
                              <select
                                value={sa.dma_id || ''}
                                onChange={(e) => updateServiceArea(index, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                                disabled={loadingDmas}
                              >
                                <option value="">Select a DMA...</option>
                                {dmas.map((dma) => (
                                  <option key={dma.id} value={dma.id}>
                                    {dma.name} (DMA {dma.code})
                                  </option>
                                ))}
                              </select>
                            </div>
                            {selectedDma && (
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Subscription</label>
                                <select
                                  value={sa.subscription_type || 'free'}
                                  onChange={(e) => updateServiceAreaSubscription(index, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                                  disabled={!auth.isSuperAdmin}
                                >
                                  {subscriptionTypes.map((st) => (
                                    <option key={st.name} value={st.name}>
                                      {st.display_name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <div className="pt-6">
                              <button
                                type="button"
                                onClick={() => removeServiceArea(index)}
                                className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {selectedDma && (
                            <div className="text-xs text-gray-500">
                              {selectedDma.name} (DMA {selectedDma.code}) - Subscription: {subscriptionTypes.find(st => st.name === (sa.subscription_type || 'free'))?.display_name || 'Free'}
                            </div>
                          )}
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
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-4 shadow-lg">
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
