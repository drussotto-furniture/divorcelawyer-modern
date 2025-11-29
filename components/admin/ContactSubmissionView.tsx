'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  city_id: string | null
  lawyer_id: string | null
  source: string | null
  status: string
  created_at: string
  cities?: {
    name: string
    states: {
      abbreviation: string
    }
  }
  lawyers?: {
    first_name: string
    last_name: string
    slug: string
  }
}

interface ContactSubmissionViewProps {
  submission: ContactSubmission
}

export default function ContactSubmissionView({ submission }: ContactSubmissionViewProps) {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState(submission.status)
  const [saving, setSaving] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('contact_submissions' as any)
        .update({ status: newStatus })
        .eq('id', submission.id)

      if (error) throw error
      setStatus(newStatus)
    } catch (error: any) {
      alert('Failed to update status: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Status */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Submission Details</h2>
          <p className="text-sm text-gray-500">
            Submitted on {new Date(submission.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={saving}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="spam">Spam</option>
          </select>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <p className="text-sm text-gray-900">{submission.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <a
              href={`mailto:${submission.email}`}
              className="text-sm text-primary hover:underline"
            >
              {submission.email}
            </a>
          </div>
          {submission.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <a
                href={`tel:${submission.phone}`}
                className="text-sm text-primary hover:underline"
              >
                {submission.phone}
              </a>
            </div>
          )}
          {submission.cities && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <p className="text-sm text-gray-900">
                {submission.cities.name}, {submission.cities.states.abbreviation}
              </p>
            </div>
          )}
          {submission.lawyers && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lawyer Inquiry</label>
              <Link
                href={`/lawyers/${submission.lawyers.slug}`}
                className="text-sm text-primary hover:underline"
              >
                {submission.lawyers.first_name} {submission.lawyers.last_name}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-4">Message</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{submission.message}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Link
          href="/admin/forms"
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to List
        </Link>
      </div>
    </div>
  )
}

