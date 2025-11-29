'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface StateSelectProps {
  states: Array<{ id: string; name: string; slug: string; abbreviation: string }>
}

export default function StateSelect({ states }: StateSelectProps) {
  const [selectedState, setSelectedState] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedState) {
      router.push(`/${selectedState}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex gap-2">
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          required
        >
          <option value="">Select your state...</option>
          {states.map((state) => (
            <option key={state.id} value={state.slug}>
              {state.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Find Lawyers
        </button>
      </div>
    </form>
  )
}

