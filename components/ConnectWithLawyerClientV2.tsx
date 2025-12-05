'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { detectUserLocation } from '@/lib/location-detection'
import { calculateDistance } from '@/lib/geocoding'
import Link from 'next/link'
import { LawyerImageWithBlur } from './LawyerImageWithBlur'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ChevronLeft, ChevronRight, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface ConnectWithLawyerClientV2Props {
  states: State[]
}

export default function ConnectWithLawyerClientV2({ states }: ConnectWithLawyerClientV2Props) {
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
  const isGeolocationUpdate = useRef(false)
  const hasUserInteracted = useRef(false)
  const [filters, setFilters] = useState({
    verified: undefined as boolean | undefined,
    featured: undefined as boolean | undefined,
    yearsExperienceMin: undefined as number | undefined,
    specializations: [] as string[],
    barAdmissions: [] as string[],
    languages: [] as string[],
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
          isGeolocationUpdate.current = true
          setZipCode(detected.zipCode) // Set zipCode state for display
          setLocation({ 
            city: detected.city, 
            stateCode: detected.stateCode,
            zipCode: detected.zipCode 
          })
          // Reset flag after state update completes
          setTimeout(() => {
            isGeolocationUpdate.current = false
          }, 100)
        } else if (detected.detected && detected.city && detected.stateCode) {
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

      // If no location was detected, show all lawyers (skip fallback_lawyers table)
      if (!location?.zipCode && !location?.city && !location?.stateCode) {
        console.log('📍 No location detected - showing all lawyers')
        const allResponse = await fetch('/api/lawyers/all?limit=500')
        if (allResponse.ok) {
          const allData = await allResponse.json()
          lawyersData = allData.lawyers || []
          console.log(`📋 Loaded ${lawyersData.length} lawyers from all endpoint`)
        }
      }
      // If location was detected but no lawyers found, try fallback_lawyers table first
      else if (lawyersData.length === 0) {
        if (location?.zipCode) {
          console.log(`⚠️ No lawyers found for zip code ${location.zipCode} - using fallback lawyers`)
        } else if (location?.city || location?.stateCode) {
          console.log(`⚠️ No lawyers found for ${location.city}, ${location.stateCode} - using fallback lawyers`)
        }
        const fallbackResponse = await fetch('/api/lawyers/fallback')
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          lawyersData = fallbackData.lawyers || []
          console.log(`📋 Loaded ${lawyersData.length} fallback lawyers`)
        }
        
        // If still no lawyers after fallback, get all lawyers as ultimate fallback
        if (lawyersData.length === 0) {
          const allResponse = await fetch('/api/lawyers/all?limit=500')
          if (allResponse.ok) {
            const allData = await allResponse.json()
            lawyersData = allData.lawyers || []
            console.log(`📋 Loaded ${lawyersData.length} lawyers from all endpoint (ultimate fallback)`)
          }
        }
      }

      setLawyers(lawyersData)
      setFilteredLawyers(lawyersData)
      setGroupedBySubscription(groupedData)
      setSubscriptionTypes(subscriptionTypesData)
      setDma(dmaData)
    } catch (error) {
      console.error('Error loading lawyers:', error)
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

  useEffect(() => {
    if (locationDetectionComplete) {
      loadLawyers()
    }
  }, [loadLawyers, locationDetectionComplete])
  
  // Reload lawyers when location changes (after initial detection)
  useEffect(() => {
    if (locationDetectionComplete && location) {
      // Only reload if we have a meaningful location change
      loadLawyers()
    }
  }, [location?.zipCode, location?.city, location?.stateCode, locationDetectionComplete, loadLawyers])

  // Detect search type from user input
  const detectSearchType = useCallback((query: string): 'zip' | 'state' | 'city' | 'lawyer_name' => {
    const trimmed = query.trim()
    
    if (/^\d{5}(-\d{4})?$/.test(trimmed)) {
      return 'zip'
    }
    
    if (/^[A-Za-z]{2}$/.test(trimmed)) {
      return 'state'
    }
    
    const stateMatch = states.find(
      state => state.name.toLowerCase() === trimmed.toLowerCase() || 
               state.abbreviation.toLowerCase() === trimmed.toLowerCase()
    )
    if (stateMatch) {
      return 'state'
    }
    
    const cityStatePattern = /^([^,]+)(?:,\s*)?([A-Za-z]{2})$/
    const cityStateMatch = trimmed.match(cityStatePattern)
    if (cityStateMatch) {
      const cityPart = cityStateMatch[1].trim()
      const statePart = cityStateMatch[2].trim().toUpperCase()
      const isValidState = states.some(s => s.abbreviation.toUpperCase() === statePart)
      if (isValidState && cityPart.length > 0) {
        return 'city'
      }
    }
    
    const cityStateNamePattern = /^([^,]+),\s*([A-Za-z\s]+)$/
    const cityStateNameMatch = trimmed.match(cityStateNamePattern)
    if (cityStateNameMatch) {
      const cityPart = cityStateNameMatch[1].trim()
      const statePart = cityStateNameMatch[2].trim()
      const isValidState = states.some(
        s => s.name.toLowerCase() === statePart.toLowerCase() || 
             s.abbreviation.toLowerCase() === statePart.toLowerCase()
      )
      if (isValidState && cityPart.length > 0) {
        return 'city'
      }
    }
    
    const wordCount = trimmed.split(/\s+/).length
    if (wordCount === 1) {
      return 'city'
    }
    
    if (wordCount === 2) {
      const words = trimmed.split(/\s+/)
      const lastWord = words[words.length - 1].toUpperCase()
      const isValidState = states.some(s => s.abbreviation.toUpperCase() === lastWord)
      if (isValidState) {
        return 'city'
      }
    }
    
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
        setLawyers(data.lawyers || [])
        setFilteredLawyers(data.lawyers || [])
        setGroupedBySubscription(data.groupedBySubscription || {})
        setSubscriptionTypes(data.subscriptionTypes || [])
        setDma(data.dma)
        setSearchTerm('')
      } else {
        const errorData = await response.json()
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
      let stateSearch = stateQuery.trim()
      const match = stateSearch.match(/^(.+?)\s*\([A-Z]{2}\)$/)
      if (match) {
        stateSearch = match[1].trim()
      }
      
      const response = await fetch(`/api/lawyers/by-state?state=${encodeURIComponent(stateSearch)}`)
      if (response.ok) {
        const data = await response.json()
        setLawyers(data.lawyers || [])
        setFilteredLawyers(data.lawyers || [])
        setGroupedBySubscription(data.groupedBySubscription || {})
        setSubscriptionTypes(data.subscriptionTypes || [])
        setDma(null)
        setSearchTerm('')
      } else {
        const errorData = await response.json()
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
      let cityName = cityQuery.trim()
      let stateAbbr: string | undefined = undefined
      
      const commaIndex = cityName.lastIndexOf(',')
      if (commaIndex > 0) {
        const parts = cityName.split(',').map(p => p.trim())
        cityName = parts[0]
        const statePart = parts[1]
        
        if (statePart && statePart.length === 2) {
          stateAbbr = statePart.toUpperCase()
        } else if (statePart) {
          const stateMatch = states.find(
            s => s.name.toLowerCase() === statePart.toLowerCase() ||
                 s.abbreviation.toLowerCase() === statePart.toLowerCase()
          )
          if (stateMatch) {
            stateAbbr = stateMatch.abbreviation
          }
        }
      }
      
      const params = new URLSearchParams()
      params.set('city', cityName)
      if (stateAbbr) {
        params.set('state', stateAbbr)
      }
      
      const response = await fetch(`/api/lawyers/by-city?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLawyers(data.lawyers || [])
        setFilteredLawyers(data.lawyers || [])
        setGroupedBySubscription(data.groupedBySubscription || {})
        setSubscriptionTypes(data.subscriptionTypes || [])
        setDma(data.dma)
        setSearchTerm('')
      }
    } catch (error) {
      console.error('Error searching by city:', error)
    } finally {
      setIsLoading(false)
    }
  }, [states])

  // Handle lawyer name search
  const handleLawyerNameSearch = useCallback(async (name: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/lawyers/search?q=${encodeURIComponent(name)}`)
      if (response.ok) {
        const data = await response.json()
        setLawyers(data.lawyers || [])
        setFilteredLawyers(data.lawyers || [])
        setGroupedBySubscription({})
        setDma(null)
      }
    } catch (error) {
      console.error('Error searching by lawyer name:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch autocomplete suggestions
  const fetchAutocompleteSuggestions = useCallback(async (query: string, signal?: AbortSignal, shouldShow?: boolean) => {
    if (!query || query.length < 1) {
      setAutocompleteSuggestions([])
      setShowAutocomplete(false)
      return
    }

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
        // Only show autocomplete if user has interacted or explicitly requested
        const canShow = shouldShow !== undefined ? shouldShow : hasUserInteracted.current
        setShowAutocomplete(canShow && data.suggestions && data.suggestions.length > 0)
      } else {
        setAutocompleteSuggestions([])
        setShowAutocomplete(false)
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching autocomplete suggestions:', error)
      }
      setAutocompleteSuggestions([])
      setShowAutocomplete(false)
    }
  }, [])

  // Debounced autocomplete
  useEffect(() => {
    // Don't show autocomplete if zipCode was set by geolocation and user hasn't interacted
    if (isGeolocationUpdate.current && !hasUserInteracted.current) {
      setAutocompleteSuggestions([])
      setShowAutocomplete(false)
      return
    }

    if (!zipCode || zipCode.length < 1) {
      setAutocompleteSuggestions([])
      setShowAutocomplete(false)
      return
    }

    // Only fetch suggestions if user has interacted with the input
    if (!hasUserInteracted.current) {
      setAutocompleteSuggestions([])
      setShowAutocomplete(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      fetchAutocompleteSuggestions(zipCode, controller.signal, true)
    }, 150)

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
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
        setIsLoading(true)
        try {
          const cityResponse = await fetch(`/api/lawyers/by-city?city=${encodeURIComponent(query.trim())}`)
          if (cityResponse.ok) {
            const cityData = await cityResponse.json()
            if (cityData.lawyers && cityData.lawyers.length > 0) {
              setLawyers(cityData.lawyers || [])
              setFilteredLawyers(cityData.lawyers || [])
              setGroupedBySubscription(cityData.groupedBySubscription || {})
              setSubscriptionTypes(cityData.subscriptionTypes || [])
              setDma(cityData.dma)
              setSearchTerm('')
              setIsLoading(false)
              return
            }
          }
        } catch (error) {
          console.error('City fallback search error:', error)
        }
        setIsLoading(false)
        await handleLawyerNameSearch(query)
        break
    }
  }, [detectSearchType, handleZipCodeSearch, handleStateSearch, handleCitySearch, handleLawyerNameSearch])

  // Apply filters
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...lawyers]

      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase()
        filtered = filtered.filter(lawyer => {
          const fullName = `${lawyer.first_name} ${lawyer.last_name}`.toLowerCase()
          const firmName = (lawyer.law_firms as any)?.name?.toLowerCase() || ''
          return fullName.includes(searchLower) || firmName.includes(searchLower)
        })
      }

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

      if (filters.distanceFromMe && filters.distanceFromMe.coordinates) {
        filtered = filtered.filter(l => {
          const firm = l.law_firms as any
          const firmCity = firm?.cities
          const serviceAreaCities = ((l as any).lawyer_service_areas || []).map((sa: any) => sa.cities).filter(Boolean)
          
          if (firmCity?.latitude && firmCity?.longitude) {
            const distance = calculateDistance(
              filters.distanceFromMe!.coordinates,
              { latitude: firmCity.latitude, longitude: firmCity.longitude }
            )
            if (distance <= filters.distanceFromMe!.miles) {
              return true
            }
          }
          
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

  // Compute filtered grouped data
  const filteredGroupedBySubscription = useMemo(() => {
    if (Object.keys(groupedBySubscription).length === 0 || subscriptionTypes.length === 0) {
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-bluish to-bluish/95 text-white pt-24 lg:pt-32 pb-12 lg:pb-16 px-4 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-serif mb-4 lg:mb-6 text-center leading-tight">
              Connect with a Divorce Lawyer
            </h1>
            <p className="text-lg lg:text-xl text-center max-w-3xl mx-auto text-white/90 leading-relaxed">
              Find vetted divorce lawyers in your area. We've done the screening so you can focus on finding the right fit.
            </p>
          </div>

          {/* Search Bar with shadcn/ui components */}
          <div className="max-w-2xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
            <div className="flex flex-col sm:flex-row gap-3 relative">
              <div className="flex-1 relative">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by zip, city, state, or lawyer name"
                  value={zipCode}
                  onChange={(e) => {
                    isGeolocationUpdate.current = false
                    hasUserInteracted.current = true
                    setZipCode(e.target.value)
                    setSelectedSuggestionIndex(-1)
                  }}
                  onFocus={() => {
                    hasUserInteracted.current = true
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
                  className="w-full px-6 py-6 text-lg rounded-full bg-white/95 backdrop-blur-sm border-2 border-white/20 shadow-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-black placeholder:text-gray-500 h-16"
                />
                {/* Autocomplete Dropdown */}
                {showAutocomplete && autocompleteSuggestions.length > 0 && (
                  <div
                    ref={autocompleteRef}
                    className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
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
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-accent focus:bg-accent focus:outline-none transition-colors first:rounded-t-lg last:rounded-b-lg",
                          index === selectedSuggestionIndex && 'bg-accent'
                        )}
                      >
                        <div className="text-foreground font-medium">{suggestion.label}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={() => {
                  if (zipCode.trim()) {
                    setShowAutocomplete(false)
                    handleUnifiedSearch(zipCode.trim())
                  }
                }}
                size="lg"
                className="rounded-full px-8 uppercase tracking-wide shadow-xl hover:shadow-2xl transition-all hover:scale-105 h-16"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-gradient-to-b from-muted/50 to-muted py-8 px-4 border-b border-border/50">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Separator orientation="vertical" className="h-6" />
              <span className="font-semibold text-bluish text-sm uppercase tracking-wide">Filter by:</span>
            </div>
            
            {/* Years Experience */}
            <Select
              value={filters.yearsExperienceMin?.toString() || undefined}
              onValueChange={(value) => setFilters({ ...filters, yearsExperienceMin: value ? parseInt(value) : undefined })}
            >
              <SelectTrigger className="w-[180px] bg-background hover:bg-accent transition-colors">
                <SelectValue placeholder="Any Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5+ Years</SelectItem>
                <SelectItem value="10">10+ Years</SelectItem>
                <SelectItem value="15">15+ Years</SelectItem>
                <SelectItem value="20">20+ Years</SelectItem>
              </SelectContent>
            </Select>

            {/* Specializations */}
            {allSpecializations.length > 0 && (
              <Select
                value={undefined}
                onValueChange={(value) => {
                  if (value && !filters.specializations.includes(value)) {
                    setFilters({ ...filters, specializations: [...filters.specializations, value] })
                  }
                }}
              >
                <SelectTrigger className="w-[200px] bg-background hover:bg-accent transition-colors">
                  <SelectValue placeholder="Add Specialization..." />
                </SelectTrigger>
                <SelectContent>
                  {allSpecializations.map(spec => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Distance from Me Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-sm font-medium text-foreground whitespace-nowrap">Distance from Me:</label>
              
              {/* Miles Select */}
              <Select
                value={filters.distanceFromMe?.miles?.toString() || undefined}
                onValueChange={async (value) => {
                  const miles = parseInt(value)
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
              >
                <SelectTrigger className="w-[140px] bg-background hover:bg-accent transition-colors">
                  <SelectValue placeholder="Select miles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="25">25 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                  <SelectItem value="100">100 miles</SelectItem>
                  <SelectItem value="200">200 miles</SelectItem>
                </SelectContent>
              </Select>

              {/* Optional Address Input */}
              <Input
                type="text"
                placeholder="Or enter address to override location"
                value={filters.distanceFromMe?.address || ''}
                className="w-80 bg-background"
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
              />

              {/* Show current location info */}
              {filters.distanceFromMe && !filters.distanceFromMe.address && location?.city && (
                <span className="text-sm text-muted-foreground">
                  Using your location: {location.city}, {location.stateCode}
                </span>
              )}
            </div>

            {/* Clear Filters */}
            {(filters.yearsExperienceMin || filters.specializations.length > 0 || filters.barAdmissions.length > 0 || filters.languages.length > 0 || filters.distanceFromMe) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({
                  ...filters,
                  yearsExperienceMin: undefined,
                  specializations: [],
                  barAdmissions: [],
                  languages: [],
                  distanceFromMe: undefined,
                })}
                className="text-bluish hover:text-bluish/80 hover:bg-accent transition-colors"
              >
                Clear Filters
              </Button>
            )}

            {/* Active Filter Badges */}
            {(filters.specializations.length > 0 || filters.barAdmissions.length > 0 || filters.languages.length > 0 || filters.distanceFromMe) && (
              <div className="flex flex-wrap gap-2 w-full mt-4 pt-4 border-t border-border/50">
                {filters.specializations.map(spec => (
                  <Badge key={spec} variant="secondary" className="gap-2 px-3 py-1.5 hover:scale-105 transition-transform cursor-pointer">
                    {spec}
                    <button
                      onClick={() => setFilters({ ...filters, specializations: filters.specializations.filter(s => s !== spec) })}
                      className="ml-1 hover:bg-secondary/80 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.barAdmissions.map(state => (
                  <Badge key={state} variant="secondary" className="gap-2 px-3 py-1.5 hover:scale-105 transition-transform cursor-pointer">
                    {state}
                    <button
                      onClick={() => setFilters({ ...filters, barAdmissions: filters.barAdmissions.filter(s => s !== state) })}
                      className="ml-1 hover:bg-secondary/80 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.languages.map(lang => (
                  <Badge key={lang} variant="secondary" className="gap-2 px-3 py-1.5 hover:scale-105 transition-transform cursor-pointer">
                    {lang}
                    <button
                      onClick={() => setFilters({ ...filters, languages: filters.languages.filter(l => l !== lang) })}
                      className="ml-1 hover:bg-secondary/80 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.distanceFromMe && (
                  <Badge variant="secondary" className="gap-2 px-3 py-1.5 hover:scale-105 transition-transform cursor-pointer">
                    Within {filters.distanceFromMe.miles} miles of {filters.distanceFromMe.address || (location?.city && location?.stateCode ? `${location.city}, ${location.stateCode}` : 'your location')}
                    <button
                      onClick={() => setFilters({ ...filters, distanceFromMe: undefined })}
                      className="ml-1 hover:bg-secondary/80 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Lawyers Section */}
      <section className="py-12 lg:py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          {isLoading ? (
            <div className="text-center py-24 space-y-4">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-bluish/20 border-t-bluish"></div>
              <p className="text-lg text-muted-foreground font-medium">Loading lawyers...</p>
            </div>
          ) : filteredLawyers.length === 0 ? (
            <div className="text-center py-24 space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-serif text-bluish mb-2">No lawyers found</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">Try adjusting your search or filters to find the perfect lawyer for your needs.</p>
              <Button
                onClick={() => {
                  setSearchTerm('')
                  setZipCode('')
                  setDma(null)
                  setGroupedBySubscription({})
                  setSubscriptionTypes([])
                  setFilters({
                    ...filters,
                    verified: undefined,
                    featured: undefined,
                    yearsExperienceMin: undefined,
                    specializations: [],
                    barAdmissions: [],
                    languages: [],
                    distanceFromMe: undefined,
                  })
                  loadLawyers()
                }}
                size="lg"
                className="rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                Clear All & Reset
              </Button>
            </div>
          ) : (
            <>
              {(() => {
                // Use the limits already applied by the backend (scaled by number of DMAs)
                const premiumLawyers = filteredGroupedBySubscription['premium'] || []
                const enhancedLawyers = filteredGroupedBySubscription['enhanced'] || []
                const basicLawyers = filteredGroupedBySubscription['basic'] || []
                const freeLawyers = filteredGroupedBySubscription['free'] || []
                
                if (premiumLawyers.length === 0 && enhancedLawyers.length === 0 && basicLawyers.length === 0 && freeLawyers.length === 0) {
                  const directGrouped: Record<string, Lawyer[]> = {}
                  filteredLawyers.forEach(lawyer => {
                    const subType = lawyer.subscription_type || 'free'
                    if (!directGrouped[subType]) {
                      directGrouped[subType] = []
                    }
                    directGrouped[subType].push(lawyer)
                  })
                  
                  return (
                    <>
                      {directGrouped['premium'] && directGrouped['premium'].length > 0 && (
                        <div className="mb-16">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {directGrouped['premium'].map((lawyer) => (
                              <PremiumLawyerCard key={lawyer.id} lawyer={lawyer} />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {directGrouped['enhanced'] && directGrouped['enhanced'].length > 0 && (
                        <div className="mb-16">
                          <EnhancedLawyerCarousel lawyers={directGrouped['enhanced']} />
                        </div>
                      )}
                      
                      {(directGrouped['basic'] && directGrouped['basic'].length > 0) || (directGrouped['free'] && directGrouped['free'].length > 0) ? (
                        <div className="mb-8">
                          <h2 className="text-2xl lg:text-3xl font-serif text-bluish mb-6">
                            {dma ? `${dma.name} Divorce Lawyers` : 'Divorce Lawyers'}
                          </h2>
                          <div className="space-y-4">
                            {directGrouped['basic'] && directGrouped['basic'].map((lawyer) => (
                              <BasicLawyerCard key={lawyer.id} lawyer={lawyer} />
                            ))}
                            {directGrouped['free'] && directGrouped['free'].map((lawyer) => (
                              <FreeLawyerCard key={lawyer.id} lawyer={lawyer} />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  )
                }
                
                return (
                  <>
                    {premiumLawyers.length > 0 && (
                      <div className="mb-20">
                        <div className="mb-8">
                          <h2 className="text-3xl lg:text-4xl font-serif text-bluish mb-2">Featured Premium Lawyers</h2>
                          <p className="text-muted-foreground">Top-rated divorce attorneys in your area</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {premiumLawyers.map((lawyer, index) => (
                            <div key={lawyer.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 100}ms` }}>
                              <PremiumLawyerCard lawyer={lawyer} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {enhancedLawyers.length > 0 && (
                      <div className="mb-20">
                        <EnhancedLawyerCarousel lawyers={enhancedLawyers} />
                      </div>
                    )}
                    
                    {(basicLawyers.length > 0 || freeLawyers.length > 0) && (
                      <div className="mb-12">
                        <div className="mb-8">
                          <h2 className="text-3xl lg:text-4xl font-serif text-bluish mb-2">
                            {dma ? `${dma.name} Divorce Lawyers` : 'Divorce Lawyers'}
                          </h2>
                          <p className="text-muted-foreground">Additional attorneys available in your area</p>
                        </div>
                        <div className="space-y-4">
                          {basicLawyers.map((lawyer, index) => (
                            <div key={lawyer.id} className="animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${index * 50}ms` }}>
                              <BasicLawyerCard lawyer={lawyer} />
                            </div>
                          ))}
                          {freeLawyers.map((lawyer, index) => (
                            <div key={lawyer.id} className="animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${(basicLawyers.length + index) * 50}ms` }}>
                              <FreeLawyerCard lawyer={lawyer} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </>
          )}
        </div>
      </section>

      {/* Content Library & Podcast Section */}
      <section className="py-12 px-4 bg-subtlesand">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild variant="outline" size="lg" className="rounded-full bg-white hover:bg-primary hover:text-black text-bluish font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 w-full sm:w-auto">
              <Link href="/learning-center" className="flex items-center gap-2">
                <span className="text-xl">📚</span>
                <span>Content Library</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full bg-white hover:bg-primary hover:text-black text-bluish font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 w-full sm:w-auto">
              <Link href="/podcast" className="flex items-center gap-2">
                <span className="text-xl">🎙️</span>
                <span>Podcast</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

// Premium Lawyer Card - Large featured card with shadcn/ui
function PremiumLawyerCard({ lawyer }: { lawyer: Lawyer }) {
  const firm = lawyer.law_firms as any
  const fullName = `${lawyer.first_name} ${lawyer.last_name}`
  const phoneNumber = (lawyer as any).phone_number || firm?.phone_number || ''

  return (
    <Card className="bg-muted hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 group">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl lg:text-3xl font-serif text-bluish group-hover:text-primary transition-colors">
          {fullName}
        </CardTitle>
        {firm && (
          <CardDescription className="text-lg text-bluish font-semibold">
            {firm.name}
          </CardDescription>
        )}
        {lawyer.years_experience && (
          <CardDescription className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
              {lawyer.years_experience}
            </span>
            years of experience
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="rounded-full uppercase tracking-wide shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <Link href={`/lawyers/${lawyer.slug}`}>
              LET'S CONNECT
            </Link>
          </Button>
          {phoneNumber && (
            <Button asChild size="lg" variant="outline" className="rounded-full uppercase tracking-wide border-2 hover:bg-primary hover:text-primary-foreground transition-all">
              <a href={`tel:${phoneNumber.replace(/\D/g, '')}`}>
                CALL {phoneNumber}
              </a>
            </Button>
          )}
        </div>
        {lawyer.photo_url && (
          <div className="relative h-80 w-full bg-muted rounded-lg overflow-hidden border-2 border-border/50 group-hover:border-primary/30 transition-colors">
            <LawyerImageWithBlur
              src={lawyer.photo_url}
              alt={fullName}
              fill
              className="object-contain object-center group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <Button asChild variant="secondary" className="w-full hover:bg-secondary/90 transition-colors">
          <Link href={`/lawyers/${lawyer.slug}`}>
            VIEW PROFILE
          </Link>
        </Button>
        {firm && firm.name && (
          <p className="text-sm text-muted-foreground mt-2 text-center flex items-center justify-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
            Serving your area
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Enhanced Lawyer Carousel - Horizontal scrolling with shadcn/ui
function EnhancedLawyerCarousel({ lawyers }: { lawyers: Lawyer[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      // Calculate scroll amount based on card width (256px) + gap (24px) = 280px
      const cardWidth = 280
      const currentScroll = scrollRef.current.scrollLeft
      const containerWidth = scrollRef.current.clientWidth
      const scrollWidth = scrollRef.current.scrollWidth
      
      let newPosition: number
      if (direction === 'left') {
        newPosition = Math.max(0, currentScroll - cardWidth)
      } else {
        // Scroll right, but don't go past the end
        const maxScroll = scrollWidth - containerWidth
        newPosition = Math.min(maxScroll, currentScroll + cardWidth)
      }
      
      scrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' })
    }
  }

  return (
    <div className="relative">
      <div className="mb-6">
        <h2 className="text-3xl lg:text-4xl font-serif text-bluish mb-2">Featured Lawyers</h2>
        <p className="text-muted-foreground">Highly rated attorneys ready to help</p>
      </div>
      <div className="relative">
        {/* Left Arrow Button */}
        <Button
          onClick={() => scroll('left')}
          variant="default"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 h-12 w-12"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        {/* Carousel Container with padding for buttons */}
        <div className="overflow-hidden pl-14 pr-14">
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scroll-smooth hide-scrollbar"
          >
            {lawyers.map((lawyer, index) => (
              <div 
                key={lawyer.id} 
                className="flex-shrink-0 animate-in fade-in slide-in-from-right-4" 
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <EnhancedLawyerCard lawyer={lawyer} />
              </div>
            ))}
          </div>
        </div>
        
        {/* Right Arrow Button */}
        <Button
          onClick={() => scroll('right')}
          variant="default"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 h-12 w-12"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}

// Enhanced Lawyer Card - For carousel with shadcn/ui
function EnhancedLawyerCard({ lawyer }: { lawyer: Lawyer }) {
  const fullName = `${lawyer.first_name} ${lawyer.last_name}`

  return (
    <Card className="flex-shrink-0 w-64 bg-muted hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 group">
      {lawyer.photo_url && (
        <div className="relative h-64 w-full bg-muted overflow-hidden border-b-2 border-border/50">
          <LawyerImageWithBlur
            src={lawyer.photo_url}
            alt={fullName}
            fill
            className="object-contain object-center group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif text-bluish group-hover:text-primary transition-colors">
          {fullName}
        </CardTitle>
        <CardDescription className="text-sm">
          {lawyer.title || 'Divorce Lawyer'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-2">
          <Button asChild size="sm" className="w-full uppercase shadow-md hover:shadow-lg transition-all">
            <Link href={`/lawyers/${lawyer.slug}`}>
              View Profile
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="w-full uppercase hover:bg-secondary/90 transition-colors">
            <Link href={`/lawyers/${lawyer.slug}?contact=true`}>
              Contact
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Basic Lawyer Card - Compact list format with shadcn/ui
function BasicLawyerCard({ lawyer }: { lawyer: Lawyer }) {
  const firm = lawyer.law_firms as any
  const fullName = `${lawyer.first_name} ${lawyer.last_name}`
  const phoneNumber = (lawyer as any).phone_number || firm?.phone_number || ''

  return (
    <Card className="bg-muted hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 group">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          {lawyer.photo_url && (
            <div className="relative h-32 w-32 flex-shrink-0 bg-muted rounded-lg overflow-hidden border-2 border-border/50 group-hover:border-primary/30 transition-colors">
              <LawyerImageWithBlur
                src={lawyer.photo_url}
                alt={fullName}
                fill
                className="object-contain object-center group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl lg:text-2xl font-serif text-bluish mb-2 group-hover:text-primary transition-colors">
              {fullName}
            </CardTitle>
            {lawyer.years_experience && (
              <CardDescription className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {lawyer.years_experience}
                </span>
                Divorce & Separation Lawyer Licensed for {lawyer.years_experience} years
              </CardDescription>
            )}
            {lawyer.specializations && lawyer.specializations.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {lawyer.specializations.slice(0, 3).map((spec: any, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {spec}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            {phoneNumber && (
              <Button asChild variant="secondary" size="sm" className="whitespace-nowrap shadow-md hover:shadow-lg transition-all">
                <a href={`tel:${phoneNumber.replace(/\D/g, '')}`}>
                  Call for a FREE consultation {phoneNumber}
                </a>
              </Button>
            )}
            <div className="flex gap-2">
              <Button asChild variant="secondary" size="sm" className="flex-1 md:flex-none hover:bg-secondary/90 transition-colors">
                <Link href={`/lawyers/${lawyer.slug}`}>
                  Profile
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="flex-1 md:flex-none hover:bg-secondary/90 transition-colors">
                <Link href={`/lawyers/${lawyer.slug}?contact=true`}>
                  Message
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Free Lawyer Card - Compact list format without photo with shadcn/ui
function FreeLawyerCard({ lawyer }: { lawyer: Lawyer }) {
  const firm = lawyer.law_firms as any
  const fullName = `${lawyer.first_name} ${lawyer.last_name}`
  const phoneNumber = (lawyer as any).phone_number || firm?.phone_number || ''

  return (
    <Card className="bg-muted">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1">
            <CardTitle className="text-xl lg:text-2xl font-serif text-bluish mb-2">
              {fullName}
            </CardTitle>
            {lawyer.years_experience && (
              <CardDescription className="mb-2">
                Divorce & Separation Lawyer Licensed for {lawyer.years_experience} years
              </CardDescription>
            )}
            {lawyer.specializations && lawyer.specializations.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {lawyer.specializations.slice(0, 3).map((spec: any, idx: number) => (
                  <Badge key={idx} variant="outline">
                    {spec}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {phoneNumber && (
              <Button asChild variant="secondary" size="sm" className="whitespace-nowrap">
                <a href={`tel:${phoneNumber.replace(/\D/g, '')}`}>
                  Call for a FREE consultation {phoneNumber}
                </a>
              </Button>
            )}
            <div className="flex gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href={`/lawyers/${lawyer.slug}`}>
                  Profile
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/lawyers/${lawyer.slug}?contact=true`}>
                  Message
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

