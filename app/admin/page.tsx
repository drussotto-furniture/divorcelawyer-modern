import { getAuthUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const auth = await getAuthUser()
  const supabase = await createClient()

  // Get statistics based on user role
  let stats = {
    lawFirms: 0,
    lawyers: 0,
    articles: 0,
    videos: 0,
    questions: 0,
    contactSubmissions: 0,
  }

  if (auth.isSuperAdmin) {
    // Super admin sees all stats
    const [firms, lawyers, articles, videos, questions, contacts] = await Promise.all([
      supabase.from('law_firms').select('id', { count: 'exact', head: true }),
      supabase.from('lawyers').select('id', { count: 'exact', head: true }),
      supabase.from('articles').select('id', { count: 'exact', head: true }),
      supabase.from('videos').select('id', { count: 'exact', head: true }),
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('contact_submissions' as any).select('id', { count: 'exact', head: true }),
    ])

    stats = {
      lawFirms: firms.count || 0,
      lawyers: lawyers.count || 0,
      articles: articles.count || 0,
      videos: videos.count || 0,
      questions: questions.count || 0,
      contactSubmissions: contacts.count || 0,
    }
  } else if (auth.isLawFirm && auth.lawFirmId) {
    // Law firm sees their firm and lawyers
    const [firm, lawyers] = await Promise.all([
      supabase.from('law_firms').select('id').eq('id', auth.lawFirmId).single(),
      supabase.from('lawyers').select('id', { count: 'exact', head: true }).eq('law_firm_id', auth.lawFirmId),
    ])

    stats = {
      lawFirms: firm.data ? 1 : 0,
      lawyers: lawyers.count || 0,
      articles: 0,
      videos: 0,
      questions: 0,
      contactSubmissions: 0,
    }
  } else if (auth.isLawyer && auth.lawyerId) {
    // Lawyer sees only their profile
    const lawyer = await supabase.from('lawyers').select('id').eq('id', auth.lawyerId).single()

    stats = {
      lawFirms: 0,
      lawyers: lawyer.data ? 1 : 0,
      articles: 0,
      videos: 0,
      questions: 0,
      contactSubmissions: 0,
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-bluish mb-4">Dashboard</h1>
        <p className="text-lg text-gray-700 font-proxima">
          Welcome back, <span className="font-semibold text-bluish">{auth.profile?.name || auth.profile?.email}</span>
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auth.isSuperAdmin && (
          <>
            <StatCard
              title="Law Firms"
              value={stats.lawFirms}
              href="/admin/directory/law-firms"
              icon="🏢"
            />
            <StatCard
              title="Lawyers"
              value={stats.lawyers}
              href="/admin/directory/lawyers"
              icon="👨‍⚖️"
            />
            <StatCard
              title="Articles"
              value={stats.articles}
              href="/admin/content/articles"
              icon="📝"
            />
            <StatCard
              title="Videos"
              value={stats.videos}
              href="/admin/content/videos"
              icon="🎥"
            />
            <StatCard
              title="Questions/FAQ"
              value={stats.questions}
              href="/admin/content/questions"
              icon="❓"
            />
            <StatCard
              title="Contact Submissions"
              value={stats.contactSubmissions}
              href="/admin/forms/contact"
              icon="📋"
            />
          </>
        )}

        {auth.isLawFirm && (
          <>
            <StatCard
              title="My Firm"
              value={stats.lawFirms}
              href={`/admin/directory/law-firms/${auth.lawFirmId}`}
              icon="🏢"
            />
            <StatCard
              title="My Lawyers"
              value={stats.lawyers}
              href="/admin/directory/lawyers"
              icon="👨‍⚖️"
            />
          </>
        )}

        {auth.isLawyer && (
          <StatCard
            title="My Profile"
            value={stats.lawyers}
            href={`/admin/directory/lawyers/${auth.lawyerId}`}
            icon="👤"
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8">
        <h2 className="text-2xl md:text-3xl font-serif text-bluish mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auth.isSuperAdmin && (
            <>
              <Link
                href="/admin/content/homepage"
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-peach-cream transition-all hover:shadow-md"
              >
                <div className="font-bold text-lg text-bluish mb-2">Edit Homepage</div>
                <div className="text-sm text-gray-600 font-proxima">Update homepage content</div>
              </Link>
              <Link
                href="/admin/directory/law-firms/new"
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-peach-cream transition-all hover:shadow-md"
              >
                <div className="font-bold text-lg text-bluish mb-2">Add Law Firm</div>
                <div className="text-sm text-gray-600 font-proxima">Create a new law firm</div>
              </Link>
              <Link
                href="/admin/directory/lawyers/new"
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-peach-cream transition-all hover:shadow-md"
              >
                <div className="font-bold text-lg text-bluish mb-2">Add Lawyer</div>
                <div className="text-sm text-gray-600 font-proxima">Create a new lawyer profile</div>
              </Link>
            </>
          )}

          {auth.isLawFirm && (
            <Link
              href={`/admin/directory/law-firms/${auth.lawFirmId}`}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-peach-cream transition-all hover:shadow-md"
            >
              <div className="font-bold text-lg text-bluish mb-2">Edit My Firm</div>
              <div className="text-sm text-gray-600 font-proxima">Update firm information</div>
            </Link>
          )}

          {auth.isLawyer && (
            <Link
              href={`/admin/directory/lawyers/${auth.lawyerId}`}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-peach-cream transition-all hover:shadow-md"
            >
              <div className="font-bold text-lg text-bluish mb-2">Edit My Profile</div>
              <div className="text-sm text-gray-600 font-proxima">Update your profile information</div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  href,
  icon,
}: {
  title: string
  value: number
  href: string
  icon: string
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </Link>
  )
}

