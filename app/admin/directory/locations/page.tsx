import { getAuthUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LocationsPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  // Get counts for each location type
  const [statesResult, countiesResult, citiesResult, zipCodesResult, marketsResult] = await Promise.all([
    supabase.from('states').select('id', { count: 'exact', head: true }),
    supabase.from('counties').select('id', { count: 'exact', head: true }),
    supabase.from('cities').select('id', { count: 'exact', head: true }),
    supabase.from('zip_codes').select('id', { count: 'exact', head: true }),
    supabase.from('markets').select('id', { count: 'exact', head: true }),
  ])

  const stats = {
    states: statesResult.count || 0,
    counties: countiesResult.count || 0,
    cities: citiesResult.count || 0,
    zipCodes: zipCodesResult.count || 0,
    markets: marketsResult.count || 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
        <p className="mt-2 text-gray-600">
          Manage geographic locations: states, counties, cities, zip codes, and markets
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/directory/locations/states"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200 hover:border-primary"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">States</h2>
              <p className="text-sm text-gray-600 mt-1">Manage US states</p>
            </div>
            <div className="text-3xl">🗺️</div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-primary">{stats.states}</div>
            <div className="text-sm text-gray-500">Total states</div>
          </div>
        </Link>

        <Link
          href="/admin/directory/locations/counties"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200 hover:border-primary"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Counties</h2>
              <p className="text-sm text-gray-600 mt-1">Manage counties</p>
            </div>
            <div className="text-3xl">🏛️</div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-primary">{stats.counties}</div>
            <div className="text-sm text-gray-500">Total counties</div>
          </div>
        </Link>

        <Link
          href="/admin/directory/locations/cities"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200 hover:border-primary"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Cities</h2>
              <p className="text-sm text-gray-600 mt-1">Manage cities</p>
            </div>
            <div className="text-3xl">🏙️</div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-primary">{stats.cities}</div>
            <div className="text-sm text-gray-500">Total cities</div>
          </div>
        </Link>

        <Link
          href="/admin/directory/locations/zip-codes"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200 hover:border-primary"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Zip Codes</h2>
              <p className="text-sm text-gray-600 mt-1">Manage zip codes</p>
            </div>
            <div className="text-3xl">📮</div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-primary">{stats.zipCodes}</div>
            <div className="text-sm text-gray-500">Total zip codes</div>
          </div>
        </Link>

        <Link
          href="/admin/directory/locations/markets"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200 hover:border-primary"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Markets</h2>
              <p className="text-sm text-gray-600 mt-1">Manage market areas</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-primary">{stats.markets}</div>
            <div className="text-sm text-gray-500">Total markets</div>
          </div>
        </Link>
      </div>
    </div>
  )
}

