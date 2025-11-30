import { getAuthUser } from '@/lib/auth/server'
import AdminSidebar from '@/components/admin/AdminSidebar'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

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
      <div className="min-h-screen bg-subtle-sand">
        <Header />
        <div className="flex pt-[101px]">
          <AdminSidebar auth={auth} />
          <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-6 lg:p-8 transition-all duration-300 min-h-[calc(100vh-101px)]">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
        <Footer />
      </div>
    )
  }

  // Otherwise, render without layout (for login/unauthorized pages)
  return <>{children}</>
}

