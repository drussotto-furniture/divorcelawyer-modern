'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface LawFirm {
  id: string
  name: string
  slug: string
  verified: boolean
  city_id: string | null
  cities: {
    name: string
    states: {
      abbreviation: string
    }
  } | null
}

interface LawFirmsGridClientProps {
  initialFirms: LawFirm[]
}

type SortField = 'name' | 'location' | 'verified'
type SortDirection = 'asc' | 'desc'

export default function LawFirmsGridClient({ initialFirms }: LawFirmsGridClientProps) {
  const [firms] = useState<LawFirm[]>(initialFirms)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all')

  // Filter and sort firms
  const filteredAndSortedFirms = useMemo(() => {
    let filtered = [...firms]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(firm => 
        firm.name.toLowerCase().includes(query) ||
        firm.slug.toLowerCase().includes(query) ||
        firm.cities?.name.toLowerCase().includes(query) ||
        firm.cities?.states?.abbreviation.toLowerCase().includes(query)
      )
    }

    // Apply verified filter
    if (verifiedFilter !== 'all') {
      filtered = filtered.filter(firm => 
        verifiedFilter === 'verified' ? firm.verified : !firm.verified
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
        case 'location':
          const aLocation = a.cities?.name && a.cities.states?.abbreviation
            ? `${a.cities.name}, ${a.cities.states.abbreviation}`.toLowerCase()
            : 'zzz' // Put firms without location at the end
          const bLocation = b.cities?.name && b.cities.states?.abbreviation
            ? `${b.cities.name}, ${b.cities.states.abbreviation}`.toLowerCase()
            : 'zzz'
          aValue = aLocation
          bValue = bLocation
          break
        case 'verified':
          aValue = a.verified ? 1 : 0
          bValue = b.verified ? 1 : 0
          break
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [firms, searchQuery, verifiedFilter, sortField, sortDirection])

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
              placeholder="Search by name, slug, or location..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Verified Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Status
            </label>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="not-verified">Not Verified</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredAndSortedFirms.length} of {firms.length} law firms
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
                onClick={() => handleSort('location')}
              >
                <div className="flex items-center gap-1">
                  Location
                  <SortIcon field="location" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('verified')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortIcon field="verified" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedFirms.length > 0 ? (
              filteredAndSortedFirms.map((firm) => (
                <tr key={firm.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{firm.name}</div>
                    <div className="text-sm text-gray-500">{firm.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {firm.cities?.name && firm.cities.states?.abbreviation
                      ? `${firm.cities.name}, ${firm.cities.states.abbreviation}`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {firm.verified ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                        Not Verified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/directory/law-firms/${firm.id}`}
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
                  {searchQuery || verifiedFilter !== 'all'
                    ? 'No law firms match your filters'
                    : 'No law firms found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

