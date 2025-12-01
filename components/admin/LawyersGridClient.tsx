'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface Lawyer {
  id: string
  first_name: string
  last_name: string
  slug: string
  email: string | null
  subscription_type: string | null
  law_firm_id: string | null
  photo_url: string | null
  office_zip_code: string | null
  law_firms: {
    name: string
  } | null
  lawyer_service_areas?: Array<{
    dma_id: string
    dmas: {
      id: string
      name: string
      code: number
    } | null
  }>
}

interface LawyersGridClientProps {
  initialLawyers: Lawyer[]
  isSuperAdmin: boolean
}

type SortField = 'name' | 'email' | 'subscription' | 'firm'
type SortDirection = 'asc' | 'desc'

function LawyerAvatar({ photoUrl, name }: { photoUrl: string | null; name: string }) {
  const [imageError, setImageError] = useState(false)
  
  if (!photoUrl || imageError) {
    return (
      <div className="h-10 w-10 rounded-full border-2 border-gray-300 bg-gray-100"></div>
    )
  }
  
  return (
    <Image
      src={photoUrl}
      alt={name}
      width={40}
      height={40}
      className="h-10 w-10 rounded-full object-cover"
      onError={() => setImageError(true)}
    />
  )
}

export default function LawyersGridClient({ initialLawyers, isSuperAdmin }: LawyersGridClientProps) {
  const [lawyers, setLawyers] = useState<Lawyer[]>(initialLawyers)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all')
  const [firmFilter, setFirmFilter] = useState<string>('all')
  const [dmaFilter, setDmaFilter] = useState<string>('all')
  const [dmaCache, setDmaCache] = useState<Map<string, { id: string; name: string; code: number }>>(new Map())
  const [lawyerServiceAreas, setLawyerServiceAreas] = useState<Map<string, Array<{ dma_id: string; dmas: { id: string; name: string; code: number } }>>>(new Map())
  const supabase = createClient()

  // Fetch DMAs for lawyers based on their zip codes (since they don't have service areas yet)
  useEffect(() => {
    const fetchDmasFromZipCodes = async () => {
      if (lawyers.length === 0) return
      
      console.log('🔍 Fetching DMAs from zip codes for', lawyers.length, 'lawyers...')
      
      // Get unique zip codes
      const zipCodes = [...new Set(lawyers.map(l => l.office_zip_code).filter((zip): zip is string => !!zip))]
      console.log('📊 Unique zip codes:', zipCodes.length)
      
      if (zipCodes.length === 0) {
        console.log('⚠️ No zip codes found')
        return
      }
      
      // Fetch zip code to DMA mappings
      // First get zip code IDs
      const { data: zipCodeRecords, error: zipCodeError } = await supabase
        .from('zip_codes')
        .select('id, zip_code')
        .in('zip_code', zipCodes)
      
      if (zipCodeError) {
        console.error('❌ Error fetching zip codes:', zipCodeError)
        return
      }
      
      if (!zipCodeRecords || zipCodeRecords.length === 0) {
        console.log('⚠️ No zip code records found')
        return
      }
      
      console.log('✅ Found', zipCodeRecords.length, 'zip code records')
      
      const zipCodeIds = zipCodeRecords.map(z => z.id)
      
      // Now get DMA mappings
      const { data: zipCodeDmas, error: zipError } = await (supabase as any)
        .from('zip_code_dmas')
        .select(`
          zip_code_id,
          dma_id,
          zip_codes (
            zip_code
          ),
          dmas (
            id,
            name,
            code
          )
        `)
        .in('zip_code_id', zipCodeIds)
      
      if (zipError) {
        console.error('❌ Error fetching zip code DMAs:', zipError)
        return
      }
      
      console.log('✅ Fetched zip code DMAs:', zipCodeDmas?.length || 0)
      
      // Create map: zip_code -> DMA
      const zipToDmaMap = new Map<string, { id: string; name: string; code: number }>()
      if (zipCodeDmas) {
        zipCodeDmas.forEach((zcd: any) => {
          const zipCode = zcd.zip_codes?.zip_code
          const dma = zcd.dmas
          if (zipCode && dma && dma.id && dma.name) {
            zipToDmaMap.set(zipCode, {
              id: dma.id,
              name: dma.name,
              code: dma.code || 0
            })
          }
        })
      }
      
      // Also create a map from zip_code_id to zip_code for easier lookup
      const zipIdToZipMap = new Map(zipCodeRecords.map(z => [z.id, z.zip_code]))
      
      // If we didn't get nested zip_code, try to get it from zip_code_id
      if (zipCodeDmas) {
        zipCodeDmas.forEach((zcd: any) => {
          if (!zcd.zip_codes?.zip_code && zcd.zip_code_id) {
            const zipCode = zipIdToZipMap.get(zcd.zip_code_id)
            const dma = zcd.dmas
            if (zipCode && dma && dma.id && dma.name) {
              zipToDmaMap.set(zipCode, {
                id: dma.id,
                name: dma.name,
                code: dma.code || 0
              })
            }
          }
        })
      }
      
      console.log('📊 Zip to DMA map size:', zipToDmaMap.size)
      console.log('📋 Sample zip to DMA mappings:', Array.from(zipToDmaMap.entries()).slice(0, 5))
      
      // Create service areas map from zip codes
      const serviceAreasMap = new Map<string, Array<{ dma_id: string; dmas: { id: string; name: string; code: number } }>>()
      
      lawyers.forEach(lawyer => {
        if (lawyer.office_zip_code) {
          const dma = zipToDmaMap.get(lawyer.office_zip_code)
          if (dma) {
            serviceAreasMap.set(lawyer.id, [{
              dma_id: dma.id,
              dmas: dma
            }])
          }
        }
      })
      
      console.log('📊 Service areas map size (from zip codes):', serviceAreasMap.size)
      setLawyerServiceAreas(serviceAreasMap)
      
      // Also fetch actual service areas if they exist
      const lawyerIds = lawyers.map(l => l.id)
      const { data: serviceAreas, error: saError } = await supabase
        .from('lawyer_service_areas')
        .select(`
          lawyer_id,
          dma_id,
          dmas (
            id,
            name,
            code
          )
        `)
        .in('lawyer_id', lawyerIds)
        .not('dma_id', 'is', null)
      
      if (!saError && serviceAreas && serviceAreas.length > 0) {
        console.log('✅ Found', serviceAreas.length, 'actual service areas')
        // Merge with zip code based DMAs (service areas take precedence)
        serviceAreas.forEach((sa: any) => {
          if (sa.lawyer_id && sa.dma_id && sa.dmas && sa.dmas.id) {
            if (!serviceAreasMap.has(sa.lawyer_id)) {
              serviceAreasMap.set(sa.lawyer_id, [])
            }
            const existing = serviceAreasMap.get(sa.lawyer_id)!
            // Check if this DMA is already added
            if (!existing.some(e => e.dma_id === sa.dma_id)) {
              existing.push({
                dma_id: sa.dma_id,
                dmas: {
                  id: sa.dmas.id,
                  name: sa.dmas.name,
                  code: sa.dmas.code || 0
                }
              })
            }
          }
        })
        setLawyerServiceAreas(new Map(serviceAreasMap))
      }
    }
    
    fetchDmasFromZipCodes()
  }, [lawyers.length, supabase])

  // Get unique law firms for filter
  const uniqueFirms = useMemo(() => {
    const firms = new Set<string>()
    lawyers.forEach(lawyer => {
      if (lawyer.law_firms?.name) {
        firms.add(lawyer.law_firms.name)
      }
    })
    return Array.from(firms).sort()
  }, [lawyers])

  // Get unique DMAs for filter
  const uniqueDmas = useMemo(() => {
    const dmaMap = new Map<string, { id: string; name: string; code: number }>()
    
    // Primary source: use the separately fetched service areas
    lawyerServiceAreas.forEach((sas) => {
      sas.forEach((sa) => {
        if (sa.dmas && sa.dmas.id && sa.dmas.name) {
          dmaMap.set(sa.dmas.id, { 
            id: sa.dmas.id, 
            name: sa.dmas.name, 
            code: sa.dmas.code || 0 
          })
        }
      })
    })
    
    // Fallback: also check lawyer.lawyer_service_areas from initial query
    lawyers.forEach(lawyer => {
      if (lawyer.lawyer_service_areas && Array.isArray(lawyer.lawyer_service_areas) && lawyer.lawyer_service_areas.length > 0) {
        lawyer.lawyer_service_areas.forEach((sa: any) => {
          // Try multiple ways to extract DMA data
          let dma = null
          
          // Method 1: Nested dmas object (expected structure)
          if (sa.dmas && sa.dmas.id && sa.dmas.name) {
            dma = sa.dmas
          }
          // Method 2: Flat structure with dma_id
          else if (sa.dma_id && dmaCache.has(sa.dma_id)) {
            dma = dmaCache.get(sa.dma_id)
          }
          
          if (dma && dma.id && dma.name && dma.name !== 'Loading...') {
            dmaMap.set(dma.id, { id: dma.id, name: dma.name, code: dma.code || 0 })
          }
        })
      }
    })
    
    const result = Array.from(dmaMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    console.log('🔍 Unique DMAs found for filter:', result.length, result.map(d => `${d.name} (${d.code})`))
    return result
  }, [lawyers, lawyerServiceAreas, dmaCache])

  // Filter and sort lawyers
  const filteredAndSortedLawyers = useMemo(() => {
    let filtered = [...lawyers]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(lawyer => 
        `${lawyer.first_name} ${lawyer.last_name}`.toLowerCase().includes(query) ||
        lawyer.email?.toLowerCase().includes(query) ||
        lawyer.slug.toLowerCase().includes(query) ||
        lawyer.law_firms?.name.toLowerCase().includes(query)
      )
    }

    // Apply subscription filter
    if (subscriptionFilter !== 'all') {
      filtered = filtered.filter(lawyer => 
        (lawyer.subscription_type || 'free') === subscriptionFilter
      )
    }

    // Apply firm filter
    if (firmFilter !== 'all') {
      filtered = filtered.filter(lawyer => 
        lawyer.law_firms?.name === firmFilter
      )
    }

    // Apply DMA filter
    if (dmaFilter !== 'all') {
      filtered = filtered.filter(lawyer => {
        // Check separately fetched service areas first
        const sas = lawyerServiceAreas.get(lawyer.id)
        if (sas && sas.some(sa => sa.dma_id === dmaFilter)) {
          return true
        }
        // Fallback to lawyer.lawyer_service_areas
        return lawyer.lawyer_service_areas?.some((sa: any) => {
          const dmaId = sa.dma_id || sa.dmas?.id
          return dmaId === dmaFilter
        })
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number = ''
      let bValue: string | number = ''

      switch (sortField) {
        case 'name':
          aValue = `${a.last_name}, ${a.first_name}`.toLowerCase()
          bValue = `${b.last_name}, ${b.first_name}`.toLowerCase()
          break
        case 'email':
          aValue = (a.email || '').toLowerCase()
          bValue = (b.email || '').toLowerCase()
          break
        case 'subscription':
          aValue = a.subscription_type || 'free'
          bValue = b.subscription_type || 'free'
          break
        case 'firm':
          aValue = (a.law_firms?.name || '').toLowerCase()
          bValue = (b.law_firms?.name || '').toLowerCase()
          break
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [lawyers, searchQuery, subscriptionFilter, firmFilter, dmaFilter, sortField, sortDirection])

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or slug..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Subscription Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subscription
            </label>
            <select
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            >
              <option value="all">All Subscriptions</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="enhanced">Enhanced</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          {/* Firm Filter */}
          {isSuperAdmin && uniqueFirms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Law Firm
              </label>
              <select
                value={firmFilter}
                onChange={(e) => setFirmFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="all">All Firms</option>
                {uniqueFirms.map(firm => (
                  <option key={firm} value={firm}>{firm}</option>
                ))}
              </select>
            </div>
          )}

          {/* DMA Filter */}
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DMA
              </label>
              <select
                value={dmaFilter}
                onChange={(e) => setDmaFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="all">All DMAs</option>
                {uniqueDmas.length > 0 ? (
                  uniqueDmas.map(dma => (
                    <option key={dma.id} value={dma.id}>
                      {dma.name} (DMA {dma.code})
                    </option>
                  ))
                ) : (
                  <option value="all" disabled>No DMAs found</option>
                )}
              </select>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredAndSortedLawyers.length} of {lawyers.length} lawyers
          {(dmaFilter !== 'all' || subscriptionFilter !== 'all' || firmFilter !== 'all') && (
            <button
              onClick={() => {
                setDmaFilter('all')
                setSubscriptionFilter('all')
                setFirmFilter('all')
                setSearchQuery('')
              }}
              className="ml-2 text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto -mx-3 md:-mx-4 lg:-mx-5">
        <div className="inline-block min-w-full align-middle">
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
                onClick={() => handleSort('firm')}
              >
                <div className="flex items-center gap-1">
                  Law Firm
                  <SortIcon field="firm" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-1">
                  Email
                  <SortIcon field="email" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('subscription')}
              >
                <div className="flex items-center gap-1">
                  Subscription
                  <SortIcon field="subscription" />
                </div>
              </th>
              {isSuperAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DMA
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedLawyers.length > 0 ? (
              filteredAndSortedLawyers.map((lawyer) => (
                <tr key={lawyer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-10 w-10">
                        <LawyerAvatar 
                          photoUrl={lawyer.photo_url} 
                          name={`${lawyer.first_name} ${lawyer.last_name}`}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {lawyer.first_name} {lawyer.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{lawyer.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lawyer.law_firms?.name || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lawyer.email || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      lawyer.subscription_type === 'premium' 
                        ? 'bg-purple-100 text-purple-800'
                        : lawyer.subscription_type === 'enhanced'
                        ? 'bg-blue-100 text-blue-800'
                        : lawyer.subscription_type === 'basic'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {lawyer.subscription_type ? lawyer.subscription_type.charAt(0).toUpperCase() + lawyer.subscription_type.slice(1) : 'Free'}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        // First try to get from lawyer_service_areas state (from separate fetch)
                        const sas = lawyerServiceAreas.get(lawyer.id)
                        if (sas && sas.length > 0) {
                          console.log(`✅ Displaying DMA for lawyer ${lawyer.id}:`, sas)
                          return (
                            <div className="space-y-1">
                              {sas.map((sa) => (
                                <div key={sa.dma_id} className="text-xs">
                                  {sa.dmas.name} (DMA {sa.dmas.code || 'N/A'})
                                </div>
                              ))}
                            </div>
                          )
                        }
                        
                        // Debug: log if no service areas found
                        if (process.env.NODE_ENV === 'development' && lawyer.id === lawyers[0]?.id) {
                          console.log(`⚠️ No service areas found for lawyer ${lawyer.id}, zip: ${lawyer.office_zip_code}, map size: ${lawyerServiceAreas.size}`)
                        }
                        
                        // Fallback to lawyer.lawyer_service_areas from initial query
                        const hasServiceAreas = lawyer.lawyer_service_areas && Array.isArray(lawyer.lawyer_service_areas) && lawyer.lawyer_service_areas.length > 0
                        
                        if (!hasServiceAreas) {
                          return <span className="text-gray-400">—</span>
                        }
                        
                        // Extract DMAs from service areas
                        const dmas: Array<{ id: string; name: string; code: number }> = [] as Array<{ id: string; name: string; code: number }>
                        
                        ((lawyer as any).lawyer_service_areas || []).forEach((sa: any) => {
                          // Method 1: Nested dmas object (expected from Supabase query)
                          if (sa.dmas && typeof sa.dmas === 'object' && sa.dmas.id && sa.dmas.name) {
                            dmas.push({
                              id: sa.dmas.id,
                              name: sa.dmas.name,
                              code: sa.dmas.code || 0
                            })
                          }
                          // Method 2: Check cache if we have dma_id
                          else if (sa.dma_id && dmaCache.has(sa.dma_id)) {
                            const cachedDma = dmaCache.get(sa.dma_id)!
                            dmas.push(cachedDma)
                          }
                        })
                        
                        // Remove duplicates by ID
                        const uniqueDmas = Array.from(
                          new Map(dmas.map(d => [d.id, d])).values()
                        )
                        
                        if (uniqueDmas.length === 0) {
                          return <span className="text-gray-400">—</span>
                        }
                        
                        return (
                          <div className="space-y-1">
                            {uniqueDmas.map((dma) => (
                              <div key={dma.id} className="text-xs">
                                {dma.name} (DMA {dma.code || 'N/A'})
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/directory/lawyers/${lawyer.id}`}
                      className="text-primary hover:text-primary/80"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                  {searchQuery || subscriptionFilter !== 'all' || firmFilter !== 'all' || dmaFilter !== 'all'
                    ? 'No lawyers match your filters'
                    : 'No lawyers found'}
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

