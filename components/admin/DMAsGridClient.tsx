'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface DMA {
  id: string
  code: number
  name: string
  slug: string
  description: string | null
  zip_code_count?: number
}

interface DMAsGridClientProps {
  initialDMAs: DMA[]
  totalMappedZipCodes?: number
}

type SortField = 'code' | 'name' | 'zip_count'
type SortDirection = 'asc' | 'desc'

export default function DMAsGridClient({ initialDMAs, totalMappedZipCodes = 0 }: DMAsGridClientProps) {
  const [dmas] = useState<DMA[]>(initialDMAs)
  const [sortField, setSortField] = useState<SortField>('code')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter and sort DMAs
  const filteredAndSortedDMAs = useMemo(() => {
    let filtered = [...dmas]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(dma => 
        dma.name.toLowerCase().includes(query) ||
        dma.code.toString().includes(query) ||
        dma.slug.toLowerCase().includes(query) ||
        dma.description?.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number = ''
      let bValue: string | number = ''

      switch (sortField) {
        case 'code':
          aValue = a.code
          bValue = b.code
          break
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'zip_count':
          aValue = a.zip_code_count || 0
          bValue = b.zip_code_count || 0
          break
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [dmas, searchQuery, sortField, sortDirection])

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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code, name, slug, or description..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          />
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredAndSortedDMAs.length} of {dmas.length} DMAs
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('code')}
              >
                <div className="flex items-center gap-1">
                  Code
                  <SortIcon field="code" />
                </div>
              </th>
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
                onClick={() => handleSort('zip_count')}
              >
                <div className="flex items-center gap-1">
                  Zip Codes
                  <SortIcon field="zip_count" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedDMAs.length > 0 ? (
              filteredAndSortedDMAs.map((dma) => (
                <tr key={dma.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{dma.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{dma.name}</div>
                    {dma.description && (
                      <div className="text-sm text-gray-500 truncate max-w-md">{dma.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dma.zip_code_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/directory/locations/dmas/${dma.id}`}
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
                  {searchQuery ? 'No DMAs match your search' : 'No DMAs found'}
                </td>
              </tr>
            )}
            {/* Total row */}
            {filteredAndSortedDMAs.length > 0 && (
              <tr className="bg-gray-100 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Total
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {filteredAndSortedDMAs.length} DMA{filteredAndSortedDMAs.length !== 1 ? 's' : ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {filteredAndSortedDMAs.reduce((sum, dma) => sum + (dma.zip_code_count || 0), 0)}
                  {searchQuery && totalMappedZipCodes > 0 && (
                    <span className="text-gray-500 ml-2">
                      (of {totalMappedZipCodes.toLocaleString()} total)
                    </span>
                  )}
                  {!searchQuery && totalMappedZipCodes > 0 && (
                    <span className="text-gray-500 ml-2">
                      ({totalMappedZipCodes.toLocaleString()} total mapped)
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* Empty cell for actions column */}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

