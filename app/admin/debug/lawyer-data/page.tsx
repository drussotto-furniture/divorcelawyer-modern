import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DebugLawyerDataPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  // Get all lawyers, especially looking for Marvin Solomiany
  // First, let's check what columns actually exist by selecting all
  const { data: lawyers, error } = await supabase
    .from('lawyers')
    .select('*')
    .or('first_name.ilike.%marvin%,last_name.ilike.%solomiany%')
    .limit(10)

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug: Lawyer Data</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Debug: Lawyer Data</h1>
      <p className="text-gray-600">
        This page shows the raw database data for lawyers matching "Marvin" or "Solomiany"
      </p>

      {lawyers && lawyers.length > 0 ? (
        lawyers.map((lawyer: any) => (
          <div key={lawyer.id} className="bg-white border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">
              {lawyer.first_name} {lawyer.last_name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>ID:</strong> {lawyer.id}
              </div>
              <div>
                <strong>Slug:</strong> {lawyer.slug}
              </div>
              <div className="md:col-span-2">
                <strong>Specializations:</strong>
                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">
                  {JSON.stringify(lawyer.specializations, null, 2)}
                </pre>
                <div className="text-xs text-gray-500 mt-1">
                  Type: {typeof lawyer.specializations} | 
                  Is Array: {Array.isArray(lawyer.specializations) ? 'Yes' : 'No'} |
                  Is Null: {lawyer.specializations === null ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="md:col-span-2">
                <strong>Education:</strong>
                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">
                  {lawyer.education !== undefined ? JSON.stringify(lawyer.education, null, 2) : 'Column does not exist'}
                </pre>
              </div>
              <div className="md:col-span-2">
                <strong>Awards:</strong>
                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">
                  {lawyer.awards !== undefined ? JSON.stringify(lawyer.awards, null, 2) : 'Column does not exist'}
                </pre>
              </div>
              <div className="md:col-span-2">
                <strong>Bar Admissions:</strong>
                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">
                  {lawyer.bar_admissions !== undefined ? JSON.stringify(lawyer.bar_admissions, null, 2) : 'Column does not exist'}
                </pre>
              </div>
              <div className="md:col-span-2">
                <strong>All Array Fields (only showing existing columns):</strong>
                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify({
                    specializations: lawyer.specializations !== undefined ? lawyer.specializations : 'COLUMN MISSING',
                    education: lawyer.education !== undefined ? lawyer.education : 'COLUMN MISSING',
                    awards: lawyer.awards !== undefined ? lawyer.awards : 'COLUMN MISSING',
                    bar_admissions: lawyer.bar_admissions !== undefined ? lawyer.bar_admissions : 'COLUMN MISSING',
                    publications: lawyer.publications !== undefined ? lawyer.publications : 'COLUMN MISSING',
                    professional_memberships: lawyer.professional_memberships !== undefined ? lawyer.professional_memberships : 'COLUMN MISSING',
                    certifications: lawyer.certifications !== undefined ? lawyer.certifications : 'COLUMN MISSING',
                    languages: lawyer.languages !== undefined ? lawyer.languages : 'COLUMN MISSING',
                    media_mentions: lawyer.media_mentions !== undefined ? lawyer.media_mentions : 'COLUMN MISSING',
                    speaking_engagements: lawyer.speaking_engagements !== undefined ? lawyer.speaking_engagements : 'COLUMN MISSING',
                  }, null, 2)}
                </pre>
              </div>
              <div className="md:col-span-2">
                <strong>All Fields (Full Record):</strong>
                <details className="mt-1">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    Click to expand full record
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(lawyer, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          No lawyers found matching "Marvin" or "Solomiany"
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h3 className="font-semibold mb-2">SQL Query to Check What Columns Exist:</h3>
        <pre className="text-xs bg-white p-2 rounded overflow-auto">
{`-- First, check what columns actually exist in the lawyers table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lawyers' 
ORDER BY ordinal_position;`}
        </pre>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
        <h3 className="font-semibold mb-2">⚠️ Important: Run Migrations First</h3>
        <p className="text-sm mb-2">
          It looks like the database schema might not be up to date. You need to run the migrations:
        </p>
        <ol className="list-decimal list-inside text-sm space-y-1">
          <li>Go to Supabase Dashboard → SQL Editor</li>
          <li>Run the base schema if the table doesn't exist: <code className="bg-white px-1 rounded">supabase/schema.sql</code></li>
          <li>Run migration <code className="bg-white px-1 rounded">015_add_lawyer_firm_fields.sql</code> to add the new fields</li>
          <li>Then check the data again</li>
        </ol>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h3 className="font-semibold mb-2">SQL Query to Check Data (Safe - only existing columns):</h3>
        <pre className="text-xs bg-white p-2 rounded overflow-auto">
{`-- This query uses * to get all columns that exist
SELECT *
FROM lawyers 
WHERE first_name ILIKE '%marvin%' 
   OR last_name ILIKE '%solomiany%'
LIMIT 1;`}
        </pre>
        <p className="text-sm mt-2">
          Run this in Supabase SQL Editor to see all available columns and data.
        </p>
      </div>
    </div>
  )
}

