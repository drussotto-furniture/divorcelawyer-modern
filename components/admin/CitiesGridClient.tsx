'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface City {
  id: string
  name: string
  slug: string
  population: number | null
  states: {
    name: string
    abbreviation: string
  } | null
  counties: {
    name: string
  } | null
}

interface CitiesGridClientProps {
  initialCities: City[]
}

type SortField = 'name' | 'state' | 'county' | 'population'
type SortDirection = 'asc' | 'desc'

export default function CitiesGridClient({ initialCities }: CitiesGridClientProps) {
  const [cities] = useState<City[]>(initialCities)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState<string>('all')

  // Get unique states for filter
  const uniqueStates = useMemo(() => {
    const states = new Map<string, string>()
    cities.forEach(city => {
      if (city.states) {
        states.set(city.states.abbreviation, city.states.name)
      }
    })
    return Array.from(states.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [cities])

  // Filter and sort cities
  const filteredAndSortedCities = useMemo(() => {
    let filtered = [...cities]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(city => 
        city.name.toLowerCase().includes(query) ||
        city.slug.toLowerCase().includes(query) ||
        city.states?.name.toLowerCase().includes(query) ||
        city.states?.abbreviation.toLowerCase().includes(query) ||
        city.counties?.name.toLowerCase().includes(query)
      )
    }

    // Apply state filter
    if (stateFilter !== 'all') {
      filtered = filtered.filter(city => 
        city.states?.abbreviation === stateFilter
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number = ''
      let bValue: string | number = ''

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'state':
          const aState = a.states?.abbreviation || 'zzz'
          const bState = b.states?.abbreviation || 'zzz'
          aValue = aState.toLowerCase()
          bValue = bState.toLowerCase()
          break
        case 'county':
          aValue = (a.counties?.name || '').toLowerCase()
          bValue = (b.counties?.name || '').toLowerCase()
          break
        case 'population':
          aValue = a.population || 0
          bValue = b.population || 0
          break
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [cities, searchQuery, stateFilter, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕</span>
    }
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, slug, state, or county..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>

          {/* State Filter */}
          {uniqueStates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="all">All States</option>
                {uniqueStates.map(([abbr, name]) => (
                  <option key={abbr} value={abbr}>{name} ({abbr})</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredAndSortedCities.length} of {cities.length} cities
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Name
                  <SortIcon field="name" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('state')}
              >
                <div className="flex items-center gap-1">
                  State
                  <SortIcon field="state" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('county')}
              >
                <div className="flex items-center gap-1">
                  County
                  <SortIcon field="county" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('population')}
              >
                <div className="flex items-center gap-1">
                  Population
                  <SortIcon field="population" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedCities.length > 0 ? (
              filteredAndSortedCities.map((city) => (
                <tr key={city.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{city.name}</div>
                    <div className="text-sm text-gray-500">{city.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {city.states?.name} ({city.states?.abbreviation})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {city.counties?.name || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {city.population ? city.population.toLocaleString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/directory/locations/cities/${city.id}`}
                      className="text-primary hover:text-primary/80"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  {searchQuery || stateFilter !== 'all' ? 'No cities match your filters' : 'No cities found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}



