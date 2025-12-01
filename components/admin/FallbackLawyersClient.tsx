'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Lawyer } from '@/types/database.types'

interface FallbackLawyer {
  id: string
  lawyer_id: string
  display_order: number
  active: boolean
  lawyers: {
    id: string
    first_name: string
    last_name: string
    slug: string
  }
}

interface FallbackLawyersClientProps {
  allLawyers: Lawyer[]
  currentFallbackLawyers: FallbackLawyer[]
}

export default function FallbackLawyersClient({ 
  allLawyers, 
  currentFallbackLawyers 
}: FallbackLawyersClientProps) {
  const supabase = createClient()
  const [selectedLawyerIds, setSelectedLawyerIds] = useState<string[]>(
    currentFallbackLawyers.map(fl => fl.lawyer_id)
  )
  const [displayOrders, setDisplayOrders] = useState<Record<string, number>>(
    currentFallbackLawyers.reduce((acc, fl) => {
      acc[fl.lawyer_id] = fl.display_order
      return acc
    }, {} as Record<string, number>)
  )
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleToggleLawyer = (lawyerId: string) => {
    if (selectedLawyerIds.includes(lawyerId)) {
      setSelectedLawyerIds(selectedLawyerIds.filter(id => id !== lawyerId))
    } else {
      setSelectedLawyerIds([...selectedLawyerIds, lawyerId])
      if (!displayOrders[lawyerId]) {
        setDisplayOrders({ ...displayOrders, [lawyerId]: selectedLawyerIds.length })
      }
    }
  }

  const handleOrderChange = (lawyerId: string, order: number) => {
    setDisplayOrders({ ...displayOrders, [lawyerId]: order })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      // First, get all current fallback lawyers
      const { data: current } = await (supabase as any)
        .from('fallback_lawyers')
        .select('*')

      // Delete all current entries
      if (current && current.length > 0) {
        const { error: deleteError } = await (supabase as any)
          .from('fallback_lawyers')
          .delete()
          .in('id', current.map((c: any) => c.id))

        if (deleteError) throw deleteError
      }

      // Insert new entries
      const entries = selectedLawyerIds.map((lawyerId, index) => ({
        lawyer_id: lawyerId,
        display_order: displayOrders[lawyerId] ?? index,
        active: true,
      }))

      if (entries.length > 0) {
        const { error: insertError } = await (supabase as any)
          .from('fallback_lawyers')
          .insert(entries)

        if (insertError) throw insertError
      }

      setMessage({ type: 'success', text: 'Fallback lawyers saved successfully!' })
    } catch (error: any) {
      console.error('Error saving fallback lawyers:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to save fallback lawyers' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-4 rounded ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded">
        <p className="font-semibold mb-2">How it works:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Select lawyers to show when location cannot be detected</li>
          <li>Set display order (lower numbers appear first)</li>
          <li>These lawyers will also be shown if no lawyers are found in a detected location</li>
        </ul>
      </div>

      {/* Lawyer Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Select Fallback Lawyers ({selectedLawyerIds.length} selected)
        </h2>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {allLawyers.map((lawyer) => {
            const isSelected = selectedLawyerIds.includes(lawyer.id)
            const fullName = `${lawyer.first_name} ${lawyer.last_name}`
            
            return (
              <div
                key={lawyer.id}
                className={`flex items-center gap-4 p-4 border rounded-lg ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleLawyer(lawyer.id)}
                  className="w-5 h-5 text-primary rounded"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{fullName}</p>
                  {(lawyer.law_firms as any)?.name && (
                    <p className="text-sm text-gray-600">{(lawyer.law_firms as any).name}</p>
                  )}
                </div>
                {isSelected && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Order:</label>
                    <input
                      type="number"
                      min="0"
                      value={displayOrders[lawyer.id] ?? 0}
                      onChange={(e) => handleOrderChange(lawyer.id, parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-black font-bold py-3 px-8 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Fallback Lawyers'}
        </button>
      </div>
    </div>
  )
}


