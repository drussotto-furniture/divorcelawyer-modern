import { getAuthUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ZipCodesClient from '@/components/admin/ZipCodesClient'

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>
}

export default async function ZipCodesPage({ searchParams }: PageProps) {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const pageSize = 50

  const supabase = await createClient()
  
  // Build count query
  let countQuery = supabase
    .from('zip_codes')
    .select('*', { count: 'exact', head: true })

  // Apply search filter to count
  if (search) {
    countQuery = countQuery.ilike('zip_code', `%${search}%`)
  }

  const { count } = await countQuery

  // Build data query
  let dataQuery = supabase
    .from('zip_codes')
    .select('id, zip_code, cities(name, states(abbreviation)), zip_code_dmas(dmas(code, name))')
    .order('zip_code', { ascending: true })

  // Apply search filter to data
  if (search) {
    dataQuery = dataQuery.ilike('zip_code', `%${search}%`)
  }

  // Apply pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  dataQuery = dataQuery.range(from, to)

  const { data: zipCodes, error } = await dataQuery

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading zip codes: {error.message}
      </div>
    )
  }

  const totalPages = Math.ceil((count || 0) / pageSize)

  // Transform data to match expected type (convert null to undefined)
  const transformedZipCodes = (zipCodes || []).map((zipCode: any) => ({
    ...zipCode,
    cities: zipCode.cities
      ? {
          ...zipCode.cities,
          states: zipCode.cities.states || undefined,
        }
      : undefined,
    dmas: zipCode.zip_code_dmas && zipCode.zip_code_dmas.length > 0 && zipCode.zip_code_dmas[0].dmas
      ? zipCode.zip_code_dmas[0].dmas
      : undefined,
  }))

  return (
    <ZipCodesClient
      zipCodes={transformedZipCodes}
      currentPage={page}
      totalPages={totalPages}
      totalCount={count || 0}
      search={search}
      pageSize={pageSize}
    />
  )
}
