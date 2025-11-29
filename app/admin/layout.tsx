import { getAuthUser } from '@/lib/auth/server'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Try to get auth - if it fails or user is not authenticated,
  // we'll let the page render anyway (it might be login/unauthorized page)
  // The individual pages will handle their own auth checks
  let auth = null
  try {
    auth = await getAuthUser()
  } catch (error) {
    // Auth failed - might be login page, let it render
    auth = null
  }

  // If we have valid auth with admin role, show full layout
  if (auth && auth.user && auth.profile && (auth.isSuperAdmin || auth.isLawFirm || auth.isLawyer)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader auth={auth} />
        <div className="flex pt-16">
          <AdminSidebar auth={auth} />
          <main className="flex-1 ml-64 p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    )
  }

  // Otherwise, render without layout (for login/unauthorized pages)
  return <>{children}</>
}

