'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface LawFirm {
  id: string
  name: string
  city_id: string | null
  cities: {
    name: string
    states: {
      abbreviation: string
    }
  } | null
}

interface LawFirmSelectorProps {
  value: string
  onChange: (firmId: string) => void
  onFirmChange?: (firm: LawFirm | null) => void
}

export default function LawFirmSelector({ value, onChange, onFirmChange }: LawFirmSelectorProps) {
  const supabase = createClient()
  const router = useRouter()
  const [firms, setFirms] = useState<LawFirm[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredFirms, setFilteredFirms] = useState<LawFirm[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedFirm, setSelectedFirm] = useState<LawFirm | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load all firms on mount
  useEffect(() => {
    loadFirms()
  }, [])

  // Load selected firm when value changes
  useEffect(() => {
    if (value) {
      loadSelectedFirm(value)
    } else {
      setSelectedFirm(null)
    }
  }, [value])

  // Filter firms based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFirms(firms.slice(0, 10)) // Show first 10
    } else {
      const filtered = firms.filter(firm =>
        firm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        firm.cities?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredFirms(filtered.slice(0, 10))
    }
  }, [searchTerm, firms])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadFirms = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('law_firms')
        .select(`
          id,
          name,
          city_id,
          cities (
            name,
            states (
              abbreviation
            )
          )
        `)
        .order('name')
        .limit(1000)

      if (error) throw error
      setFirms(data || [])
      setFilteredFirms((data || []).slice(0, 10))
    } catch (error) {
      console.error('Error loading law firms:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSelectedFirm = async (firmId: string) => {
    try {
      const { data, error } = await supabase
        .from('law_firms')
        .select(`
          id,
          name,
          city_id,
          cities (
            name,
            states (
              abbreviation
            )
          )
        `)
        .eq('id', firmId)
        .single()

      if (error) throw error
      setSelectedFirm(data)
      if (onFirmChange) {
        onFirmChange(data)
      }
    } catch (error) {
      console.error('Error loading selected firm:', error)
    }
  }

  const handleSelectFirm = (firm: LawFirm) => {
    setSelectedFirm(firm)
    onChange(firm.id)
    if (onFirmChange) {
      onFirmChange(firm)
    }
    setShowDropdown(false)
    setSearchTerm('')
  }

  const handleCreateNew = () => {
    // Open law firm form in a new tab/window or modal
    const newFirmUrl = '/admin/directory/law-firms/new?returnTo=lawyer'
    window.open(newFirmUrl, '_blank')
    // Alternatively, you could use a modal here
  }

  const handleClear = () => {
    setSelectedFirm(null)
    onChange('')
    if (onFirmChange) {
      onFirmChange(null)
    }
    setSearchTerm('')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {selectedFirm ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
            <div className="font-medium text-gray-900">{selectedFirm.name}</div>
            {selectedFirm.cities && (
              <div className="text-sm text-gray-500">
                {selectedFirm.cities.name}, {selectedFirm.cities.states?.abbreviation}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a law firm..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {loading ? (
                <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
              ) : (
                <>
                  {/* Create New Law Firm button at the top */}
                  <div className="border-b border-gray-200">
                    <button
                      type="button"
                      onClick={handleCreateNew}
                      className="w-full text-left px-4 py-2 hover:bg-primary/10 focus:bg-primary/10 focus:outline-none text-primary font-medium"
                    >
                      + Create New Law Firm
                    </button>
                  </div>
                  {filteredFirms.length > 0 ? (
                    filteredFirms.map((firm) => (
                      <button
                        key={firm.id}
                        type="button"
                        onClick={() => handleSelectFirm(firm)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      >
                        <div className="font-medium text-gray-900">{firm.name}</div>
                        {firm.cities && (
                          <div className="text-sm text-gray-500">
                            {firm.cities.name}, {firm.cities.states?.abbreviation}
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No firms found.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

