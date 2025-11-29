import { getAuthUser, requireSuperAdmin } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsEditor from '@/components/admin/SettingsEditor'

export default async function SettingsPage() {
  const auth = await getAuthUser()
  
  if (!auth.isSuperAdmin) {
    redirect('/admin/unauthorized')
  }

  const supabase = await createClient()
  
  const { data: settings, error } = await supabase
    .from('site_settings' as any)
    .select('*')
    .order('category', { ascending: true })
    .order('key', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Site Settings</h1>
        <p className="mt-2 text-gray-600">Manage site-wide settings and configuration</p>
      </div>

      <SettingsEditor settings={settings || []} />
    </div>
  )
}

