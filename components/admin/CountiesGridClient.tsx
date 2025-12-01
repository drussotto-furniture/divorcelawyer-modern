'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface County {
  id: string
  name: string
  slug: string
  states: {
    name: string
    abbreviation: string
  } | null
}

interface CountiesGridClientProps {
  initialCounties: County[]
}

type SortField = 'name' | 'state' | 'slug'
type SortDirection = 'asc' | 'desc'

export default function CountiesGridClient({ initialCounties }: CountiesGridClientProps) {
  const [counties] = useState<County[]>(initialCounties)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState<string>('all')

  // Get unique states for filter
  const uniqueStates = useMemo(() => {
    const states = new Map<string, string>()
    counties.forEach(county => {
      if (county.states) {
        states.set(county.states.abbreviation, county.states.name)
      }
    })
    return Array.from(states.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [counties])

  // Filter and sort counties
  const filteredAndSortedCounties = useMemo(() => {
    let filtered = [...counties]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(county => 
        county.name.toLowerCase().includes(query) ||
        county.slug.toLowerCase().includes(query) ||
        county.states?.name.toLowerCase().includes(query) ||
        county.states?.abbreviation.toLowerCase().includes(query)
      )
    }

    // Apply state filter
    if (stateFilter !== 'all') {
      filtered = filtered.filter(county => 
        county.states?.abbreviation === stateFilter
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string = ''
      let bValue: string = ''

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
        case 'slug':
          aValue = a.slug.toLowerCase()
          bValue = b.slug.toLowerCase()
          break
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [counties, searchQuery, stateFilter, sortField, sortDirection])

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
              placeholder="Search by name, slug, or state..."
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
          Showing {filteredAndSortedCounties.length} of {counties.length} counties
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
                onClick={() => handleSort('slug')}
              >
                <div className="flex items-center gap-1">
                  Slug
                  <SortIcon field="slug" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedCounties.length > 0 ? (
              filteredAndSortedCounties.map((county) => (
                <tr key={county.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{county.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {county.states?.name} ({county.states?.abbreviation})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {county.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/directory/locations/counties/${county.id}`}
                      className="text-primary hover:text-primary/80"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  {searchQuery || stateFilter !== 'all' ? 'No counties match your filters' : 'No counties found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}



