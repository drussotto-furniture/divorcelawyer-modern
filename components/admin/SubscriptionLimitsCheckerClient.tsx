'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DMA {
  id: string
  name: string
  code: number
}

interface SubscriptionType {
  name: string
  display_name: string
  sort_order: number
}

interface SubscriptionLimit {
  id: string
  location_type: string
  location_value: string
  subscription_type: string
  max_lawyers: number | null
}

interface Violation {
  dma: DMA
  subscription_type: string
  current_count: number
  limit: number | null
  is_violation: boolean
}

interface SubscriptionLimitsCheckerClientProps {
  dmas: DMA[]
  subscriptionTypes: SubscriptionType[]
  subscriptionLimits: SubscriptionLimit[]
}

export default function SubscriptionLimitsCheckerClient({
  dmas,
  subscriptionTypes,
  subscriptionLimits: initialLimits
}: SubscriptionLimitsCheckerClientProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [violations, setViolations] = useState<Violation[]>([])
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  // Build limits map: dma_id -> subscription_type -> max_lawyers
  const limitsMap = new Map<string, Map<string, number | null>>()
  
  // Add global limits
  const globalLimits = new Map<string, number | null>()
  initialLimits
    .filter(limit => limit.location_type === 'global')
    .forEach(limit => {
      globalLimits.set(limit.subscription_type, limit.max_lawyers)
    })

  // Add DMA-specific limits
  initialLimits
    .filter(limit => limit.location_type === 'dma')
    .forEach(limit => {
      const dmaId = limit.location_value
      if (!limitsMap.has(dmaId)) {
        limitsMap.set(dmaId, new Map())
      }
      limitsMap.get(dmaId)!.set(limit.subscription_type, limit.max_lawyers)
    })

  const checkLimits = async () => {
    setLoading(true)
    setViolations([])
    const foundViolations: Violation[] = []

    try {
      if (dmas.length === 0) {
        alert('No DMAs found to check')
        setLoading(false)
        return
      }

      // For each DMA, check each subscription type
      for (let dmaIndex = 0; dmaIndex < dmas.length; dmaIndex++) {
        const dma = dmas[dmaIndex]
        // Get all zip codes in this DMA
        const { data: zipCodeDmas } = await supabase
          .from('zip_code_dmas')
          .select('zip_code_id, zip_codes(zip_code)')
          .eq('dma_id', dma.id)

        if (!zipCodeDmas || zipCodeDmas.length === 0) continue

        const zipCodes = zipCodeDmas
          .map((zcd: any) => zcd.zip_codes?.zip_code)
          .filter((zip: string | undefined): zip is string => !!zip)

        if (zipCodes.length === 0) continue

        // Limit to 1000 zip codes to avoid Supabase .in() limit
        const limitedZipCodes = zipCodes.length > 1000 ? zipCodes.slice(0, 1000) : zipCodes

        // For each subscription type, count lawyers
        for (const subType of subscriptionTypes) {
          // Get all lawyers with office_zip_code in this DMA
          const { data: lawyersByZip, error: lawyersByZipError } = await supabase
            .from('lawyers')
            .select('id')
            .eq('subscription_type', subType.name)
            .in('office_zip_code', limitedZipCodes)

          if (lawyersByZipError) {
            console.error(`Error fetching lawyers by zip for DMA ${dma.name}:`, lawyersByZipError)
          }

          // Get all firms in this DMA
          const { data: firmsInDma, error: firmsError } = await supabase
            .from('law_firms')
            .select('id')
            .in('zip_code', limitedZipCodes)

          if (firmsError) {
            console.error(`Error fetching firms for DMA ${dma.name}:`, firmsError)
          }

          // Get lawyers whose firms are in this DMA
          let lawyersByFirm: any[] = []
          if (firmsInDma && firmsInDma.length > 0) {
            const firmIds = firmsInDma.map(f => f.id)
            const { data, error: lawyersByFirmError } = await supabase
              .from('lawyers')
              .select('id')
              .eq('subscription_type', subType.name)
              .in('law_firm_id', firmIds)

            if (lawyersByFirmError) {
              console.error(`Error fetching lawyers by firm for DMA ${dma.name}:`, lawyersByFirmError)
            }

            lawyersByFirm = data || []
          }

          // Combine and get unique count
          const allLawyerIds = new Set<string>()
          lawyersByZip?.forEach(l => allLawyerIds.add(l.id))
          lawyersByFirm.forEach(l => allLawyerIds.add(l.id))
          const currentCount = allLawyerIds.size

          // Get limit for this DMA and subscription type
          const dmaLimit = limitsMap.get(dma.id)?.get(subType.name)
          const limit = dmaLimit !== undefined ? dmaLimit : globalLimits.get(subType.name) ?? null

          // Check if violation
          const isViolation = limit !== null && currentCount > limit

          if (isViolation || limit !== null) {
            foundViolations.push({
              dma,
              subscription_type: subType.name,
              current_count: currentCount,
              limit,
              is_violation: isViolation
            })
          }
        }
      }

      setViolations(foundViolations)
      setLastChecked(new Date())
    } catch (error: any) {
      console.error('Error checking limits:', error)
      alert(`Error checking limits: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Group violations by DMA
  const violationsByDma = violations.reduce((acc, violation) => {
    if (!acc[violation.dma.id]) {
      acc[violation.dma.id] = {
        dma: violation.dma,
        violations: []
      }
    }
    acc[violation.dma.id].violations.push(violation)
    return acc
  }, {} as Record<string, { dma: DMA; violations: Violation[] }>)

  const hasViolations = violations.some(v => v.is_violation)

  return (
    <div className="space-y-6">
      {/* Action Button */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Check Subscription Limits</h2>
            <p className="text-sm text-gray-600 mt-1">
              This will check all DMAs for subscription limit violations
            </p>
            {lastChecked && (
              <p className="text-xs text-gray-500 mt-1">
                Last checked: {lastChecked.toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={checkLimits}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : 'Check Limits'}
          </button>
        </div>
      </div>

      {/* Results */}
      {violations.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Subscription Limits Status
            </h2>
            {hasViolations && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ {violations.filter(v => v.is_violation).length} violation(s) found
                </p>
              </div>
            )}
          </div>

          <div className="divide-y divide-gray-200">
            {Object.values(violationsByDma).map(({ dma, violations: dmaViolations }) => {
              const dmaHasViolations = dmaViolations.some(v => v.is_violation)
              return (
                <div key={dma.id} className="p-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">
                    {dma.name} (DMA {dma.code})
                    {dmaHasViolations && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                        Violations
                      </span>
                    )}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Subscription Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Current Count
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Limit
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dmaViolations.map((violation, idx) => (
                          <tr key={idx} className={violation.is_violation ? 'bg-red-50' : ''}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {subscriptionTypes.find(st => st.name === violation.subscription_type)?.display_name || violation.subscription_type}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                              {violation.current_count}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {violation.limit === null ? 'Unlimited' : violation.limit}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {violation.is_violation ? (
                                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                                  ⚠️ Over Limit ({violation.current_count - (violation.limit || 0)} over)
                                </span>
                              ) : violation.limit !== null && violation.current_count === violation.limit ? (
                                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                  At Limit
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                  ✓ OK
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {violations.length === 0 && lastChecked && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">No subscription limits configured or no lawyers found in DMAs.</p>
        </div>
      )}
    </div>
  )
}

