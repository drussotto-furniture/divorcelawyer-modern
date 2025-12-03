'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { detectUserLocation } from '@/lib/location-detection'
import { calculateDistance } from '@/lib/geocoding'
// Note: Using API routes for client-side data fetching
interface Lawyer {
  id: string
  first_name: string
  last_name: string
  slug: string
  [key: string]: any
}
interface State {
  id: string
  name: string
  abbreviation: string
  slug: string
  [key: string]: any
}
import Image from 'next/image'
import Link from 'next/link'
import { LawyerImageWithBlur } from './LawyerImageWithBlur'

interface ConnectWithLawyerClientProps {
  states: State[]
}

export default function ConnectWithLawyerClient({ states }: ConnectWithLawyerClientProps) {
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [filteredLawyers, setFilteredLawyers] = useState<Lawyer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [location, setLocation] = useState<{ 
    city: string | null; 
    stateCode: string | null;
    zipCode: string | null;
  } | null>(null)
  const [locationDetectionComplete, setLocationDetectionComplete] = useState(false)
  const [groupedBySubscription, setGroupedBySubscription] = useState<Record<string, Lawyer[]>>({})
  const [subscriptionTypes, setSubscriptionTypes] = useState<Array<{ name: string; display_name: string; sort_order: number }>>([])
  const [dma, setDma] = useState<{ id: string; name: string; code: number } | null>(null)
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Array<{ value: string; label: string }>>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const autocompleteRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filters, setFilters] = useState({
    verified: undefined as boolean | undefined,
    featured: undefined as boolean | undefined,
    yearsExperienceMin: undefined as number | undefined,
    specializations: [] as string[],
    barAdmissions: [] as string[],
    languages: [] as string[],
    state: '' as string,
    distanceFromMe: undefined as { address?: string; miles: number; coordinates: { latitude: number; longitude: number } } | undefined,
  })

  // Auto-detect location on mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const detected = await detectUserLocation()
        console.log('📍 Location detection result:', detected)
        if (detected.detected && detected.zipCode) {
          console.log(`✅ Location detected: Zip Code ${detected.zipCode} (${detected.city}, ${detected.stateCode})`)
          setLocation({ 
            city: detected.city, 
            stateCode: detected.stateCode,
            zipCode: detected.zipCode 
          })
        } else if (detected.detected && detected.city && detected.stateCode) {
          // Fallback to city/state if zip not available
          console.log(`✅ Location detected (no zip): ${detected.city}, ${detected.stateCode}`)
          setLocation({ 
            city: detected.city, 
            stateCode: detected.stateCode,
            zipCode: null 
          })
        } else {
          console.log('❌ Location not detected - will use fallback lawyers')
        }
      } catch (error) {
        console.error('Error detecting location:', error)
      } finally {
        // Mark location detection as complete, whether it succeeded or failed
        setLocationDetectionComplete(true)
      }
    }
    detectLocation()
  }, [])

  // Load lawyers based on location or fallback
  const loadLawyers = useCallback(async () => {
    setIsLoading(true)
    try {
      let lawyersData: Lawyer[] = []
      let groupedData: Record<string, Lawyer[]> = {}
      let dmaData: { id: string; name: string; code: number } | null = null
      let subscriptionTypesData: Array<{ name: string; display_name: string; sort_order: number }> = []

      // Priority 1: If we have a zip code, use zip code search (which gets all lawyers in DMA)
      if (location?.zipCode) {
        console.log(`🔍 Searching for lawyers by zip code: ${location.zipCode} (will show all lawyers in DMA)`)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
        try {
          const response = await fetch(`/api/lawyers/by-zip?zipCode=${encodeURIComponent(location.zipCode)}`, {
            signal: controller.signal
          })
          clearTimeout(timeoutId)
          if (response.ok) {
            const data = await response.json()
            lawyersData = data.lawyers || []
            groupedData = data.groupedBySubscription || {}
            dmaData = data.dma || null
            subscriptionTypesData = data.subscriptionTypes || []
            console.log(`📊 Found ${lawyersData.length} lawyers in DMA for zip code ${location.zipCode}`)
            console.log(`📊 Grouped data keys:`, Object.keys(groupedData))
            console.log(`📊 Grouped data details:`, Object.keys(groupedData).map(key => ({
              key,
              count: groupedData[key]?.length || 0,
              lawyers: groupedData[key]?.map((l: any) => ({ id: l.id, name: `${l.first_name} ${l.last_name}`, subscription_type: l.subscription_type })) || []
            })))
            console.log(`📊 Subscription types:`, subscriptionTypesData)
            console.log(`📊 Subscription type names:`, subscriptionTypesData.map((st: any) => st.name))
            if (dmaData) {
              console.log(`📍 DMA: ${dmaData.name} (${dmaData.code})`)
            }
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            console.error('⏱️ Request timed out after 30 seconds')
          } else {
            console.error('Error fetching lawyers by zip code:', fetchError)
          }
        }
      }
      // Priority 2: Fallback to city/state search if no zip code
      else if (location?.city || location?.stateCode) {
        console.log(`🔍 Searching for lawyers in location: ${location.city}, ${location.stateCode}`)
        const params = new URLSearchParams()
        if (location.city) params.set('city', location.city)
        if (location.stateCode) params.set('stateCode', location.stateCode)
        
        const response = await fetch(`/api/lawyers/by-location?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          lawyersData = data.lawyers || []
          console.log(`📊 Found ${lawyersData.length} lawyers for location ${location.city}, ${location.stateCode}`)
        }
      } else {
        console.log('📍 No location detected - skipping location-based search')
      }

      // If no lawyers found for location, use fallback
      if (lawyersData.length === 0) {
        if (location?.zipCode) {
          console.log(`⚠️ No lawyers found for zip code ${location.zipCode} - using fallback lawyers`)
        } else if (location?.city || location?.stateCode) {
          console.log(`⚠️ No lawyers found for ${location.city}, ${location.stateCode} - using fallback lawyers`)
        } else {
          console.log('📍 No location detected - using fallback lawyers')
        }
        const fallbackResponse = await fetch('/api/lawyers/fallback')
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          lawyersData = fallbackData.lawyers || []
          console.log(`📋 Loaded ${lawyersData.length} fallback lawyers`)
        }
      }

      // If still no lawyers, get all lawyers as ultimate fallback
      if (lawyersData.length === 0) {
        const allResponse = await fetch('/api/lawyers/all?limit=100')
        if (allResponse.ok) {
          const allData = await allResponse.json()
          lawyersData = allData.lawyers || []
        }
      }

      // If we have lawyers but no grouped data, try to group them by subscription_type
      if (lawyersData.length > 0 && (Object.keys(groupedData).length === 0 || subscriptionTypesData.length === 0)) {
        console.log('⚠️ No grouped data or subscription types returned, attempting to group lawyers by subscription_type')
        // Fetch subscription types from the database via API
        try {
          const supabaseResponse = await fetch('/api/subscription-types')
          if (supabaseResponse.ok) {
            const subTypesData = await supabaseResponse.json()
            subscriptionTypesData = subTypesData.subscriptionTypes || []
            
            // Group lawyers by subscription_type
            const tempGrouped: Record<string, Lawyer[]> = {}
            subscriptionTypesData.forEach((subType: { name: string; display_name: string; sort_order: number }) => {
              tempGrouped[subType.name] = []
            })
            
            lawyersData.forEach(lawyer => {
              const subType = lawyer.subscription_type
              if (subType && tempGrouped[subType]) {
                tempGrouped[subType].push(lawyer)
              }
            })
            
            // Only update if we actually have groups
            if (Object.keys(tempGrouped).some(key => tempGrouped[key].length > 0)) {
              groupedData = tempGrouped
              console.log('📊 Grouped lawyers by subscription:', Object.keys(groupedData).map(key => `${key}: ${groupedData[key].length}`))
            }
          }
        } catch (error) {
          console.error('Error fetching subscription types:', error)
        }
      }

      setLawyers(lawyersData)
      setFilteredLawyers(lawyersData)
      setGroupedBySubscription(groupedData)
      setSubscriptionTypes(subscriptionTypesData)
      setDma(dmaData)
    } catch (error) {
      console.error('Error loading lawyers:', error)
      // Try fallback on error
      try {
        const fallbackResponse = await fetch('/api/lawyers/fallback')
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          setLawyers(fallbackData.lawyers || [])
          setFilteredLawyers(fallbackData.lawyers || [])
        }
      } catch (fallbackError) {
        console.error('Error loading fallback lawyers:', fallbackError)
      }
    } finally {
      setIsLoading(false)
    }
  }, [location])

  // Only load lawyers after location detection is complete
  useEffect(() => {
    if (locationDetectionComplete) {
      loadLawyers()
    }
  }, [loadLawyers, locationDetectionComplete])

  // Handle search
  const handleSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setFilteredLawyers(lawyers)
      setGroupedBySubscription({})
      setDma(null)
      return
    }

    try {
      const response = await fetch(`/api/lawyers/search?q=${encodeURIComponent(term)}`)
      if (response.ok) {
        const data = await response.json()
        setFilteredLawyers(data.lawyers || [])
        setGroupedBySubscription({})
        setDma(null)
      } else {
        setFilteredLawyers(lawyers)
      }
    } catch (error) {
      console.error('Error searching lawyers:', error)
      setFilteredLawyers(lawyers)
    }
  }, [lawyers])

  // Detect search type from user input
  const detectSearchType = useCallback((query: string): 'zip' | 'state' | 'city' | 'lawyer_name' => {
    const trimmed = query.trim()
    
    // Check if it's a zip code (5 digits, optionally with -4 more digits)
    if (/^\d{5}(-\d{4})?$/.test(trimmed)) {
      return 'zip'
    }
    
    // Check if it's a state abbreviation (exactly 2 letters)
    if (/^[A-Za-z]{2}$/.test(trimmed)) {
      return 'state'
    }
    
    // Check if it matches a state name
    const stateMatch = states.find(
      state => state.name.toLowerCase() === trimmed.toLowerCase() || 
               state.abbreviation.toLowerCase() === trimmed.toLowerCase()
    )
    if (stateMatch) {
      return 'state'
    }
    
    // If it's all numbers, treat as zip code attempt (even if invalid format)
    if (/^\d+$/.test(trimmed)) {
      return 'zip'
    }
    
    // Check if it looks like "city, state" or "city state" format
    // Pattern: word(s) followed by comma and 2-letter state, or word(s) followed by 2-letter state
    const cityStatePattern = /^([^,]+)(?:,\s*)?([A-Za-z]{2})$/
    const cityStateMatch = trimmed.match(cityStatePattern)
    if (cityStateMatch) {
      const cityPart = cityStateMatch[1].trim()
      const statePart = cityStateMatch[2].trim().toUpperCase()
      
      // Verify the state part is a valid state abbreviation
      const isValidState = states.some(s => s.abbreviation.toUpperCase() === statePart)
      if (isValidState && cityPart.length > 0) {
        return 'city'
      }
    }
    
    // Check if it's "city, state name" format (e.g., "Atlanta, Georgia")
    const cityStateNamePattern = /^([^,]+),\s*([A-Za-z\s]+)$/
    const cityStateNameMatch = trimmed.match(cityStateNamePattern)
    if (cityStateNameMatch) {
      const cityPart = cityStateNameMatch[1].trim()
      const statePart = cityStateNameMatch[2].trim()
      
      // Verify the state part is a valid state name or abbreviation
      const isValidState = states.some(
        s => s.name.toLowerCase() === statePart.toLowerCase() || 
             s.abbreviation.toLowerCase() === statePart.toLowerCase()
      )
      if (isValidState && cityPart.length > 0) {
        return 'city'
      }
    }
    
    // Check word count
    const wordCount = trimmed.split(/\s+/).length
    if (wordCount === 1) {
      // Single word - could be city or lawyer name, try city first
      return 'city'
    }
    
    // If it's 2 words and the last word is a valid state abbreviation, treat as city
    if (wordCount === 2) {
      const words = trimmed.split(/\s+/)
      const lastWord = words[words.length - 1].toUpperCase()
      const isValidState = states.some(s => s.abbreviation.toUpperCase() === lastWord)
      if (isValidState) {
        return 'city'
      }
    }
    
    // Multiple words - likely lawyer name
    return 'lawyer_name'
  }, [states])

  // Handle zip code search
  const handleZipCodeSearch = useCallback(async (zip: string) => {
    if (!zip.trim() || !/^\d{5}(-\d{4})?$/.test(zip)) {
      alert('Please enter a valid 5-digit zip code')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/lawyers/by-zip?zipCode=${encodeURIComponent(zip)}`)
      if (response.ok) {
        const data = await response.json()
        console.log(`📥 Client received API response for zip ${zip}:`, {
          lawyersCount: data.lawyers?.length || 0,
          hasDMA: !!data.dma,
          dmaName: data.dma?.name,
          dmaCode: data.dma?.code,
          groupedKeys: Object.keys(data.groupedBySubscription || {}),
          subscriptionTypesCount: data.subscriptionTypes?.length || 0
        })
        
        setLawyers(data.lawyers || [])
        setFilteredLawyers(data.lawyers || [])
        setGroupedBySubscription(data.groupedBySubscription || {})
        setSubscriptionTypes(data.subscriptionTypes || [])
        setDma(data.dma)
        setSearchTerm('') // Clear name search when using zip code
        
        if (!data.lawyers || data.lawyers.length === 0) {
          console.warn(`⚠️ No lawyers in API response for zip ${zip}`)
          if (data.dma) {
            console.warn(`   But DMA was found: ${data.dma.name} (${data.dma.code})`)
            console.warn(`   This suggests lawyers exist in the DMA but weren't returned by the query`)
          } else {
            console.warn(`   And no DMA was found - search fell back to zip-code-only`)
          }
        }
      } else {
        const errorData = await response.json()
        console.error(`❌ API error for zip ${zip}:`, errorData)
        alert(errorData.error || 'Failed to find lawyers for that zip code')
      }
    } catch (error) {
      console.error('Error searching by zip code:', error)
      alert('Error searching by zip code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle state search
  const handleStateSearch = useCallback(async (stateQuery: string) => {
    setIsLoading(true)
    try {
      // Parse state from autocomplete format (e.g., "Georgia (GA)" -> "Georgia")
      let stateSearch = stateQuery.trim()
      
      // Extract state name from "State Name (ABBR)" format
      const match = stateSearch.match(/^(.+?)\s*\([A-Z]{2}\)$/)
      if (match) {
        stateSearch = match[1].trim()
      }
      
      console.log(`🌐 Fetching: /api/lawyers/by-state?state=${encodeURIComponent(stateSearch)}`)
      const response = await fetch(`/api/lawyers/by-state?state=${encodeURIComponent(stateSearch)}`)
      if (response.ok) {
        const data = await response.json()
        console.log(`📊 State search API response:`, {
          lawyersCount: data.lawyers?.length || 0,
          groupedCount: Object.keys(data.groupedBySubscription || {}).length,
          subscriptionTypesCount: data.subscriptionTypes?.length || 0,
          hasDMA: !!data.dma,
          dmaName: data.dma?.name
        })
        console.log(`📋 Full API response:`, JSON.stringify(data, null, 2).substring(0, 500))
        setLawyers(data.lawyers || [])
        setFilteredLawyers(data.lawyers || [])
        setGroupedBySubscription(data.groupedBySubscription || {})
        setSubscriptionTypes(data.subscriptionTypes || [])
        setDma(null) // Multiple DMAs, so no single DMA
        setSearchTerm('')
      } else {
        const errorData = await response.json()
        console.error(`❌ API error for state "${stateSearch}":`, errorData)
        alert(errorData.error || 'Failed to find lawyers for that state')
      }
    } catch (error) {
      console.error('Error searching by state:', error)
      alert('Error searching by state. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle city search
  const handleCitySearch = useCallback(async (cityQuery: string) => {
    setIsLoading(true)
    try {
      // Parse city/state format from autocomplete (e.g., "Atlanta, GA" or "Atlanta, Georgia")
      let cityName = cityQuery.trim()
      let stateAbbr: string | undefined = undefined
      
      // Check if it's in "City, State" format
      const commaIndex = cityName.lastIndexOf(',')
      if (commaIndex > 0) {
        const parts = cityName.split(',').map(p => p.trim())
        cityName = parts[0]
        const statePart = parts[1]
        
        // Check if state part is an abbreviation (2 letters) or full state name
        if (statePart && statePart.length === 2) {
          stateAbbr = statePart.toUpperCase()
        } else if (statePart) {
          // Find state by name to get abbreviation
          const stateMatch = states.find(
            s => s.name.toLowerCase() === statePart.toLowerCase() ||
                 s.abbreviation.toLowerCase() === statePart.toLowerCase()
          )
          if (stateMatch) {
            stateAbbr = stateMatch.abbreviation
          }
        }
      }
      
      console.log(`🔍 City search - parsed: city="${cityName}", state="${stateAbbr || 'none'}"`)
      
      const params = new URLSearchParams()
      params.set('city', cityName)
      if (stateAbbr) {
        params.set('state', stateAbbr)
      }
      
      console.log(`🌐 Fetching: /api/lawyers/by-city?${params.toString()}`)
      const response = await fetch(`/api/lawyers/by-city?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`📊 City search API response:`, {
          lawyersCount: data.lawyers?.length || 0,
          groupedCount: Object.keys(data.groupedBySubscription || {}).length,
          subscriptionTypesCount: data.subscriptionTypes?.length || 0,
          hasDMA: !!data.dma,
          dmaName: data.dma?.name,
          dmaCode: data.dma?.code,
          groupedKeys: Object.keys(data.groupedBySubscription || {}),
          debug: data._debug // Debug info from server
        })
        
        // Log full response for detailed debugging
        console.log(`📋 Full API response:`, JSON.stringify(data, null, 2))
        
        // Log grouped data details
        if (data.groupedBySubscription && Object.keys(data.groupedBySubscription).length > 0) {
          console.log(`📋 Grouped by subscription:`, Object.entries(data.groupedBySubscription).map(([key, lawyers]: [string, any]) => 
            `${key}: ${lawyers?.length || 0} lawyers`
          ))
        } else {
          console.warn(`⚠️ No grouped data in response`)
        }
        
        setLawyers(data.lawyers || [])
        setFilteredLawyers(data.lawyers || [])
        setGroupedBySubscription(data.groupedBySubscription || {})
        setSubscriptionTypes(data.subscriptionTypes || [])
        setDma(data.dma)
        setSearchTerm('')
        
        if (!data.lawyers || data.lawyers.length === 0) {
          console.warn(`⚠️ No lawyers returned from city search API`)
          console.warn(`   This could mean:`)
          console.warn(`   1. City not found in database`)
          console.warn(`   2. No zip codes found for the city`)
          console.warn(`   3. No DMA mapping for those zip codes`)
          console.warn(`   4. No lawyers in that DMA`)
          console.warn(`   Check server console for detailed logs`)
        }
      } else {
        const errorData = await response.json()
        console.error('❌ City search API error:', {
          status: response.status,
          error: errorData
        })
        alert(errorData.error || 'Failed to find lawyers for that city')
      }
    } catch (error) {
      console.error('Error searching by city:', error)
      alert('Error searching by city. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [states])

  // Handle lawyer name search
  const handleLawyerNameSearch = useCallback(async (nameQuery: string) => {
    // Check if we have a geolocated zip code
    if (!location?.zipCode) {
      const userZip = prompt('Please enter a zip code to search for lawyers by name:')
      if (!userZip || !/^\d{5}(-\d{4})?$/.test(userZip.trim())) {
        alert('A valid zip code is required to search for lawyers by name')
        return
      }
      // Use the user-provided zip code
      setIsLoading(true)
      try {
        const response = await fetch(`/api/lawyers/by-name?name=${encodeURIComponent(nameQuery)}&zipCode=${encodeURIComponent(userZip.trim())}`)
        if (response.ok) {
          const data = await response.json()
          setLawyers(data.lawyers || [])
          setFilteredLawyers(data.lawyers || [])
          setGroupedBySubscription(data.groupedBySubscription || {})
          setSubscriptionTypes(data.subscriptionTypes || [])
          setDma(data.dma)
          setSearchTerm('')
        } else {
          const errorData = await response.json()
          alert(errorData.error || 'Failed to find lawyers with that name')
        }
      } catch (error) {
        console.error('Error searching by lawyer name:', error)
        alert('Error searching by lawyer name. Please try again.')
      } finally {
        setIsLoading(false)
      }
      return
    }

    // Use geolocated zip code
    setIsLoading(true)
    try {
      const response = await fetch(`/api/lawyers/by-name?name=${encodeURIComponent(nameQuery)}&zipCode=${encodeURIComponent(location.zipCode)}`)
      if (response.ok) {
        const data = await response.json()
        setLawyers(data.lawyers || [])
        setFilteredLawyers(data.lawyers || [])
        setGroupedBySubscription(data.groupedBySubscription || {})
        setSubscriptionTypes(data.subscriptionTypes || [])
        setDma(data.dma)
        setSearchTerm('')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to find lawyers with that name')
      }
    } catch (error) {
      console.error('Error searching by lawyer name:', error)
      alert('Error searching by lawyer name. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [location])

  // Fetch autocomplete suggestions using unified endpoint
  const fetchAutocompleteSuggestions = useCallback(async (query: string, signal?: AbortSignal) => {
    if (!query || query.length < 1) {
      setAutocompleteSuggestions([])
      setShowAutocomplete(false)
      return
    }

    // Skip autocomplete for likely lawyer names (multiple words without comma)
    const words = query.trim().split(/\s+/)
    if (words.length >= 2 && !query.includes(',') && !/^\d/.test(query)) {
      setAutocompleteSuggestions([])
      setShowAutocomplete(false)
      return
    }

    try {
      const response = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`, { signal })
      if (response.ok) {
        const data = await response.json()
        setAutocompleteSuggestions(data.suggestions || [])
        setShowAutocomplete(data.suggestions && data.suggestions.length > 0)
      } else {
        setAutocompleteSuggestions([])
        setShowAutocomplete(false)
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name !== 'AbortError') {
        console.error('Error fetching autocomplete suggestions:', error)
      }
      setAutocompleteSuggestions([])
      setShowAutocomplete(false)
    }
  }, [])

  // Debounced autocomplete with request cancellation
  useEffect(() => {
    if (!zipCode || zipCode.length < 1) {
      setAutocompleteSuggestions([])
      setShowAutocomplete(false)
      return
    }

    const controller = new AbortController()
    
    const timeoutId = setTimeout(() => {
      fetchAutocompleteSuggestions(zipCode, controller.signal)
    }, 150) // Reduced to 150ms debounce (faster response)

    return () => {
      clearTimeout(timeoutId)
      controller.abort() // Cancel any in-flight request
    }
  }, [zipCode, fetchAutocompleteSuggestions])

  // Handle click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current && 
        !autocompleteRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Unified search handler
  const handleUnifiedSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      return
    }

    setShowAutocomplete(false)
    const searchType = detectSearchType(query)
    console.log(`🔍 Detected search type: ${searchType} for query: "${query}"`)

    switch (searchType) {
      case 'zip':
        await handleZipCodeSearch(query)
        break
      case 'state':
        await handleStateSearch(query)
        break
      case 'city':
        await handleCitySearch(query)
        break
      case 'lawyer_name':
        // For multi-word queries detected as lawyer_name, try city search FIRST
        // This handles cases like "Los Angeles" which is a city, not a lawyer name
        console.log(`🔄 Trying city search first for multi-word query: "${query}"`)
        
        // Try city search first
        setIsLoading(true)
        try {
          const cityResponse = await fetch(`/api/lawyers/by-city?city=${encodeURIComponent(query.trim())}`)
          if (cityResponse.ok) {
            const cityData = await cityResponse.json()
            if (cityData.lawyers && cityData.lawyers.length > 0) {
              console.log(`✅ City search found ${cityData.lawyers.length} lawyers for "${query}"`)
              setLawyers(cityData.lawyers || [])
              setFilteredLawyers(cityData.lawyers || [])
              setGroupedBySubscription(cityData.groupedBySubscription || {})
              setSubscriptionTypes(cityData.subscriptionTypes || [])
              setDma(cityData.dma)
              setSearchTerm('')
              setIsLoading(false)
              return // Found results as city, done!
            }
          }
        } catch (error) {
          console.error('City fallback search error:', error)
        }
        setIsLoading(false)
        
        // If city search didn't find results, try as lawyer name
        console.log(`🔄 City search found nothing, trying lawyer name search for: "${query}"`)
        await handleLawyerNameSearch(query)
        break
    }
  }, [detectSearchType, handleZipCodeSearch, handleStateSearch, handleCitySearch, handleLawyerNameSearch])

  // Apply filters
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...lawyers]

      // Apply search if exists
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase()
        filtered = filtered.filter(lawyer => {
          const fullName = `${lawyer.first_name} ${lawyer.last_name}`.toLowerCase()
          const firmName = (lawyer.law_firms as any)?.name?.toLowerCase() || ''
          return fullName.includes(searchLower) || firmName.includes(searchLower)
        })
      }

      // Apply other filters
      if (filters.yearsExperienceMin) {
        filtered = filtered.filter(l => 
          l.years_experience && l.years_experience >= filters.yearsExperienceMin!
        )
      }

      if (filters.specializations.length > 0) {
        filtered = filtered.filter(l => {
          const lawyerSpecs = l.specializations || []
          return filters.specializations.some(spec => lawyerSpecs.includes(spec))
        })
      }

      if (filters.barAdmissions.length > 0) {
        filtered = filtered.filter(l => {
          const admissions = (l as any).bar_admissions || []
          return filters.barAdmissions.some(state => admissions.includes(state))
        })
      }

      if (filters.languages.length > 0) {
        filtered = filtered.filter(l => {
          const languages = (l as any).languages || []
          return filters.languages.some(lang => languages.includes(lang))
        })
      }

      // Filter by state
      if (filters.state) {
        filtered = filtered.filter(l => {
          const firm = l.law_firms as any
          const firmState = firm?.cities?.states?.abbreviation
          const serviceAreaStates = ((l as any).lawyer_service_areas || []).map((sa: any) => sa.cities?.states?.abbreviation).filter(Boolean)
          return firmState === filters.state || serviceAreaStates.includes(filters.state)
        })
      }

      // Filter by distance from me
      if (filters.distanceFromMe && filters.distanceFromMe.coordinates) {
        filtered = filtered.filter(l => {
          const firm = l.law_firms as any
          const firmCity = firm?.cities
          const serviceAreaCities = ((l as any).lawyer_service_areas || []).map((sa: any) => sa.cities).filter(Boolean)
          
          // Check firm city
          if (firmCity?.latitude && firmCity?.longitude) {
            const distance = calculateDistance(
              filters.distanceFromMe!.coordinates,
              { latitude: firmCity.latitude, longitude: firmCity.longitude }
            )
            if (distance <= filters.distanceFromMe!.miles) {
              return true
            }
          }
          
          // Check service area cities
          for (const city of serviceAreaCities) {
            if (city?.latitude && city?.longitude) {
              const distance = calculateDistance(
                filters.distanceFromMe!.coordinates,
                { latitude: city.latitude, longitude: city.longitude }
              )
              if (distance <= filters.distanceFromMe!.miles) {
                return true
              }
            }
          }
          
          return false
        })
      }

      setFilteredLawyers(filtered)
    }

    applyFilters()
  }, [lawyers, searchTerm, filters])

  // Compute filtered grouped data based on filteredLawyers
  const filteredGroupedBySubscription = useMemo(() => {
    if (Object.keys(groupedBySubscription).length === 0 || subscriptionTypes.length === 0) {
      console.log('⚠️ No grouped data available:', {
        groupedKeys: Object.keys(groupedBySubscription).length,
        subscriptionTypesCount: subscriptionTypes.length
      })
      return {}
    }
    
    const filteredGrouped: Record<string, Lawyer[]> = {}
    const filteredLawyerIds = new Set(filteredLawyers.map(l => l.id))
    
    subscriptionTypes.forEach(subType => {
      const originalGroup = groupedBySubscription[subType.name] || []
      filteredGrouped[subType.name] = originalGroup.filter(lawyer => 
        filteredLawyerIds.has(lawyer.id)
      )
    })
    
    const totalInGroups = Object.values(filteredGrouped).reduce((sum, group) => sum + group.length, 0)
    console.log('📊 Filtered grouped data:', {
      groups: Object.keys(filteredGrouped).length,
      totalLawyers: totalInGroups,
      groupCounts: Object.keys(filteredGrouped).map(key => `${key}: ${filteredGrouped[key].length}`)
    })
    
    return filteredGrouped
  }, [filteredLawyers, groupedBySubscription, subscriptionTypes])

  // Get unique values for filter dropdowns
  const allSpecializations = Array.from(
    new Set(
      lawyers.flatMap(l => l.specializations || [])
    )
  ).sort()

  const allBarAdmissions = Array.from(
    new Set(
      lawyers.flatMap(l => (l as any).bar_admissions || [])
    )
  ).sort()

  const allLanguages = Array.from(
    new Set(
      lawyers.flatMap(l => (l as any).languages || [])
    )
  ).sort()

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-bluish text-white pt-24 lg:pt-32 pb-8 lg:pb-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl lg:text-5xl xl:text-6xl font-serif mb-6 lg:mb-8 text-center">
            Connect with a Divorce Lawyer
          </h1>
          <p className="text-lg lg:text-xl text-center max-w-3xl mx-auto mb-8">
            Find vetted divorce lawyers in your area. We've done the screening so you can focus on finding the right fit.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col gap-4">
              {/* First search bar - hidden */}
              {/* <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search by lawyer name or location..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    handleSearch(e.target.value)
                  }}
                  className="flex-1 px-6 py-4 rounded-full text-black text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={() => handleSearch(searchTerm)}
                  className="bg-primary text-black font-bold py-4 px-8 rounded-full hover:bg-primary/90 transition-colors uppercase tracking-wide"
                >
                  Search
                </button>
              </div> */}
              <div className="flex flex-col sm:flex-row gap-4 relative">
                <div className="flex-1 relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search by zip, city, state, or lawyer name"
                    value={zipCode}
                    onChange={(e) => {
                      setZipCode(e.target.value)
                      setSelectedSuggestionIndex(-1)
                    }}
                    onFocus={() => {
                      if (autocompleteSuggestions.length > 0) {
                        setShowAutocomplete(true)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (showAutocomplete && autocompleteSuggestions.length > 0) {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          setSelectedSuggestionIndex(prev => 
                            prev < autocompleteSuggestions.length - 1 ? prev + 1 : prev
                          )
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
                        } else if (e.key === 'Enter') {
                          e.preventDefault()
                          if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < autocompleteSuggestions.length) {
                            const selected = autocompleteSuggestions[selectedSuggestionIndex]
                            setZipCode(selected.value)
                            setShowAutocomplete(false)
                            handleUnifiedSearch(selected.value)
                          } else if (zipCode.trim()) {
                            setShowAutocomplete(false)
                            handleUnifiedSearch(zipCode.trim())
                          }
                        } else if (e.key === 'Escape') {
                          setShowAutocomplete(false)
                        }
                      } else if (e.key === 'Enter' && zipCode.trim()) {
                        handleUnifiedSearch(zipCode.trim())
                      }
                    }}
                    className="w-full px-6 py-4 rounded-full text-black text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {/* Autocomplete Dropdown */}
                  {showAutocomplete && autocompleteSuggestions.length > 0 && (
                    <div
                      ref={autocompleteRef}
                      className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    >
                      {autocompleteSuggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.value}-${index}`}
                          type="button"
                          onClick={() => {
                            setZipCode(suggestion.value)
                            setShowAutocomplete(false)
                            handleUnifiedSearch(suggestion.value)
                          }}
                          onMouseEnter={() => setSelectedSuggestionIndex(index)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                            index === selectedSuggestionIndex ? 'bg-gray-100' : ''
                          }`}
                        >
                          <div className="text-black">{suggestion.label}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (zipCode.trim()) {
                      setShowAutocomplete(false)
                      handleUnifiedSearch(zipCode.trim())
                    }
                  }}
                  className="bg-primary text-black font-bold py-4 px-8 rounded-full hover:bg-primary/90 transition-colors uppercase tracking-wide"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Location Display */}
          {dma && (
            <div className="text-center mt-4">
              <p className="text-sm lg:text-base">
                Showing lawyers in <span className="font-bold">{dma.name} (DMA {dma.code})</span>
                {location?.zipCode && (
                  <span className="ml-2">for zip code {location.zipCode}</span>
                )}
                {zipCode && !location?.zipCode && (
                  <span className="ml-2">for zip code {zipCode}</span>
                )}
                <button
                  onClick={() => {
                    setZipCode('')
                    setDma(null)
                    setGroupedBySubscription({})
                    setSubscriptionTypes([])
                    loadLawyers()
                  }}
                  className="ml-2 underline hover:no-underline"
                >
                  Clear
                </button>
              </p>
            </div>
          )}
          {!dma && lawyers.length > 0 && groupedBySubscription && Object.keys(groupedBySubscription).length > 0 && (
            <div className="text-center mt-4">
              <p className="text-sm lg:text-base">
                Showing lawyers across multiple DMAs
                <button
                  onClick={() => {
                    setZipCode('')
                    setDma(null)
                    setGroupedBySubscription({})
                    setSubscriptionTypes([])
                    loadLawyers()
                  }}
                  className="ml-2 underline hover:no-underline"
                >
                  Clear
                </button>
              </p>
            </div>
          )}
          {!dma && !groupedBySubscription && location && location.city && (
            <div className="text-center mt-4">
              <p className="text-sm lg:text-base">
                Showing lawyers near <span className="font-bold">{location.city}, {location.stateCode}</span>
                <button
                  onClick={() => setLocation(null)}
                  className="ml-2 underline hover:no-underline"
                >
                  Change location
                </button>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-subtlesand py-6 px-4 border-b border-gray-200">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="font-bold text-bluish">Filter by:</span>
            
            {/* Years Experience */}
            <select
              value={filters.yearsExperienceMin || ''}
              onChange={(e) => setFilters({ ...filters, yearsExperienceMin: e.target.value ? parseInt(e.target.value) : undefined })}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white"
            >
              <option value="">Any Experience</option>
              <option value="5">5+ Years</option>
              <option value="10">10+ Years</option>
              <option value="15">15+ Years</option>
              <option value="20">20+ Years</option>
            </select>

            {/* State Filter */}
            <select
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white"
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state.id} value={state.abbreviation}>{state.name}</option>
              ))}
            </select>

            {/* Specializations */}
            {allSpecializations.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value && !filters.specializations.includes(e.target.value)) {
                    setFilters({ ...filters, specializations: [...filters.specializations, e.target.value] })
                  }
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white"
              >
                <option value="">Add Specialization...</option>
                {allSpecializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            )}

            {/* Distance from Me Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Distance from Me:</label>
              
              {/* Miles Select - can be set without address (uses geolocated location) */}
              <select
                value={filters.distanceFromMe?.miles || ''}
                onChange={async (e) => {
                  const miles = parseInt(e.target.value)
                  if (!miles) {
                    setFilters({ ...filters, distanceFromMe: undefined })
                    return
                  }

                  // If we have a custom address, geocode it
                  const customAddress = filters.distanceFromMe?.address
                  if (customAddress) {
                    try {
                      const response = await fetch(`/api/geocode?address=${encodeURIComponent(customAddress)}`)
                      if (response.ok) {
                        const data = await response.json()
                        if (data.coordinates) {
                          setFilters({
                            ...filters,
                            distanceFromMe: {
                              address: customAddress,
                              miles,
                              coordinates: data.coordinates
                            }
                          })
                          return
                        }
                      }
                    } catch (error) {
                      console.error('Error geocoding address:', error)
                    }
                  }

                  // Use geolocated location if available
                  if (location?.zipCode) {
                    try {
                      const response = await fetch(`/api/geocode?address=${encodeURIComponent(location.zipCode)}`)
                      if (response.ok) {
                        const data = await response.json()
                        if (data.coordinates) {
                          setFilters({
                            ...filters,
                            distanceFromMe: {
                              miles,
                              coordinates: data.coordinates
                            }
                          })
                          return
                        }
                      }
                    } catch (error) {
                      console.error('Error geocoding zip code:', error)
                    }
                  }

                  // If no location available, prompt for address
                  if (!location?.zipCode) {
                    alert('Please enter an address below to use distance filter, or allow location access')
                    setFilters({ ...filters, distanceFromMe: undefined })
                  }
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white"
              >
                <option value="">Select miles</option>
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
                <option value="100">100 miles</option>
                <option value="200">200 miles</option>
              </select>

              {/* Optional Address Input (overrides geolocated location) */}
              <input
                type="text"
                placeholder="Or enter address to override location"
                value={filters.distanceFromMe?.address || ''}
                onChange={async (e) => {
                  const address = e.target.value
                  if (!address) {
                    // Clear address but keep miles if set, use geolocated location
                    if (filters.distanceFromMe?.miles && location?.zipCode) {
                      try {
                        const response = await fetch(`/api/geocode?address=${encodeURIComponent(location.zipCode)}`)
                        if (response.ok) {
                          const data = await response.json()
                          if (data.coordinates) {
                            setFilters({
                              ...filters,
                              distanceFromMe: {
                                miles: filters.distanceFromMe.miles,
                                coordinates: data.coordinates
                              }
                            })
                            return
                          }
                        }
                      } catch (error) {
                        console.error('Error geocoding zip code:', error)
                      }
                    }
                    setFilters({ ...filters, distanceFromMe: undefined })
                    return
                  }

                  // Geocode the custom address
                  try {
                    const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`)
                    if (response.ok) {
                      const data = await response.json()
                      if (data.coordinates) {
                        setFilters({
                          ...filters,
                          distanceFromMe: {
                            address,
                            miles: filters.distanceFromMe?.miles || 25,
                            coordinates: data.coordinates
                          }
                        })
                      }
                    }
                  } catch (error) {
                    console.error('Error geocoding address:', error)
                  }
                }}
                className="w-80 px-4 py-2 rounded-lg border border-gray-300 bg-white text-black"
              />

              {/* Show current location info */}
              {filters.distanceFromMe && !filters.distanceFromMe.address && location?.city && (
                <span className="text-sm text-gray-600">
                  Using your location: {location.city}, {location.stateCode}
                </span>
              )}
            </div>

            {/* Clear Filters */}
            {(filters.yearsExperienceMin || filters.specializations.length > 0 || filters.state || filters.distanceFromMe) && (
              <button
                onClick={() => setFilters({
                  ...filters,
                  yearsExperienceMin: undefined,
                  specializations: [],
                  barAdmissions: [],
                  languages: [],
                  state: '',
                  distanceFromMe: undefined,
                })}
                className="px-4 py-2 text-bluish underline hover:no-underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Active Filters Display */}
          {(filters.specializations.length > 0 || filters.barAdmissions.length > 0 || filters.languages.length > 0 || filters.state || filters.distanceFromMe) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.specializations.map(spec => (
                <span key={spec} className="px-3 py-1 bg-white rounded-full text-sm flex items-center gap-2">
                  {spec}
                  <button onClick={() => setFilters({ ...filters, specializations: filters.specializations.filter(s => s !== spec) })}>×</button>
                </span>
              ))}
              {filters.state && (
                <span className="px-3 py-1 bg-white rounded-full text-sm flex items-center gap-2">
                  State: {states.find(s => s.abbreviation === filters.state)?.name || filters.state}
                  <button onClick={() => setFilters({ ...filters, state: '' })}>×</button>
                </span>
              )}
              {filters.distanceFromMe && (
                <span className="px-3 py-1 bg-white rounded-full text-sm flex items-center gap-2">
                  Within {filters.distanceFromMe.miles} miles of {filters.distanceFromMe.address || (location?.city && location?.stateCode ? `${location.city}, ${location.stateCode}` : 'your location')}
                  <button onClick={() => setFilters({ ...filters, distanceFromMe: undefined })}>×</button>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Lawyers Grid */}
      <section className="py-12 lg:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bluish"></div>
              <p className="mt-4 text-gray-600">Loading lawyers...</p>
            </div>
          ) : filteredLawyers.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-2xl lg:text-3xl font-serif text-bluish mb-4">No lawyers found</h2>
              <p className="text-gray-600 mb-6">Try adjusting your search or filters.</p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setZipCode('')
                  setDma(null)
                  setGroupedBySubscription({})
                  setFilters({
                    ...filters,
                    verified: undefined,
                    featured: undefined,
                    yearsExperienceMin: undefined,
                    specializations: [],
                    barAdmissions: [],
                    languages: [],
                  })
                }}
                className="bg-primary text-black font-bold py-3 px-6 rounded-full hover:bg-primary/90"
              >
                Clear All
              </button>
            </div>
          ) : (() => {
            return Object.keys(filteredGroupedBySubscription).length > 0 && subscriptionTypes.length > 0
          })() ? (
            // Display grouped by subscription type
            <>
              <div className="mb-8">
                <p className="text-gray-600">
                  Showing {filteredLawyers.length} lawyer{filteredLawyers.length !== 1 ? 's' : ''} organized by subscription type
                  {dma && (
                    <span className="ml-2">
                      in <span className="font-semibold">{dma.name} (DMA {dma.code})</span>
                    </span>
                  )}
                </p>
              </div>
              {(() => {
                const groupsWithLawyers = subscriptionTypes
                  .filter(subType => {
                    const lawyersInGroup = filteredGroupedBySubscription[subType.name] || []
                    return lawyersInGroup.length > 0
                  })
                
                if (groupsWithLawyers.length === 0) {
                  console.warn('⚠️ No subscription groups have lawyers. Checking if we can match by subscription_type field...')
                  
                  // Try to group by subscription_type field directly from lawyers
                  const directGrouped: Record<string, Lawyer[]> = {}
                  filteredLawyers.forEach(lawyer => {
                    const subType = lawyer.subscription_type
                    if (subType) {
                      if (!directGrouped[subType]) {
                        directGrouped[subType] = []
                      }
                      directGrouped[subType].push(lawyer)
                    }
                  })
                  
                  if (Object.keys(directGrouped).length > 0) {
                    console.log('✅ Found groups by subscription_type field:', Object.keys(directGrouped))
                    // Try to match with subscription types
                    return subscriptionTypes
                      .filter(subType => directGrouped[subType.name] && directGrouped[subType.name].length > 0)
                      .map((subType) => {
                        const lawyersInGroup = directGrouped[subType.name] || []
                        return (
                          <div key={subType.name} className="mb-12">
                            <h2 className="text-2xl lg:text-3xl font-serif text-bluish mb-6 capitalize">
                              {subType.display_name} Lawyers
                              <span className="ml-2 text-lg text-gray-500 font-normal">
                                ({lawyersInGroup.length})
                              </span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {lawyersInGroup.map((lawyer) => (
                                <LawyerCard key={lawyer.id} lawyer={lawyer} />
                              ))}
                            </div>
                          </div>
                        )
                      })
                  }
                  
                  console.warn('⚠️ Still no groups found. Showing regular grid instead.')
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredLawyers.map((lawyer) => (
                        <LawyerCard key={lawyer.id} lawyer={lawyer} />
                      ))}
                    </div>
                  )
                }
                
                const renderedGroups = groupsWithLawyers.map((subType) => {
                  const lawyersInGroup = filteredGroupedBySubscription[subType.name] || []
                  
                  // Safety check - if display_name is missing, use name
                  const displayName = subType.display_name || subType.name || 'Unknown'
                  
                  return (
                    <div key={subType.name} className="mb-12">
                      <h2 className="text-2xl lg:text-3xl font-serif text-bluish mb-6 capitalize">
                        {displayName} Lawyers
                        <span className="ml-2 text-lg text-gray-500 font-normal">
                          ({lawyersInGroup.length})
                        </span>
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lawyersInGroup.map((lawyer) => (
                          <LawyerCard key={lawyer.id} lawyer={lawyer} />
                        ))}
                      </div>
                    </div>
                  )
                })
                
                return renderedGroups
              })()}
            </>
          ) : (
            // Regular display (not grouped)
            <>
              <div className="mb-8">
                <p className="text-gray-600">
                  Showing {filteredLawyers.length} of {lawyers.length} lawyers
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLawyers.map((lawyer) => (
                  <LawyerCard key={lawyer.id} lawyer={lawyer} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

// Lawyer Card Component
function LawyerCard({ lawyer }: { lawyer: Lawyer }) {
  const firm = lawyer.law_firms as any
  const fullName = `${lawyer.first_name} ${lawyer.last_name}`

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {lawyer.photo_url && (
        <div className="relative h-64 w-full">
          <LawyerImageWithBlur
            src={lawyer.photo_url}
            alt={fullName}
            fill
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl lg:text-2xl font-serif text-bluish mb-2">
          {fullName}
        </h3>
        {lawyer.title && (
          <p className="text-gray-600 mb-2">{lawyer.title}</p>
        )}
        {firm && (
          <p className="text-primary font-proxima mb-4">
            {firm.name}
          </p>
        )}
        {lawyer.years_experience && (
          <p className="text-sm text-gray-600 mb-2">
            {lawyer.years_experience} years of experience
          </p>
        )}
        {lawyer.specializations && lawyer.specializations.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Specializations:</p>
            <div className="flex flex-wrap gap-1">
              {lawyer.specializations.slice(0, 3).map((spec: any, idx: number) => (
                <span key={idx} className="px-2 py-1 bg-subtlesand rounded text-xs">
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}
        <Link
          href={`/lawyers/${lawyer.slug}`}
          className="block w-full bg-primary text-black font-bold py-3 px-6 rounded-full text-center hover:bg-primary/90 transition-colors uppercase tracking-wide text-sm"
        >
          View Profile
        </Link>
      </div>
    </div>
  )
}

