import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TagDisplayServer from '@/components/TagDisplayServer'
import ConnectWithLawyerClient from '@/components/ConnectWithLawyerClient'
import { getStates } from '@/lib/supabase'

// SEO Metadata
export const metadata: Metadata = {
  title: 'Connect with a Divorce Lawyer | DivorceLawyer.com',
  description: 'Find and connect with vetted divorce lawyers in your area. Search by location, filter by experience, specializations, and more. Get matched with the right attorney for your needs.',
  keywords: [
    'divorce lawyer',
    'find divorce attorney',
    'divorce lawyer near me',
    'family law attorney',
    'divorce attorney search',
    'connect with lawyer',
    'divorce lawyer directory'
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://divorcelawyer.com/connect-with-lawyer',
    siteName: 'DivorceLawyer.com',
    title: 'Connect with a Divorce Lawyer | DivorceLawyer.com',
    description: 'Find and connect with vetted divorce lawyers in your area.',
    images: [{
      url: 'https://divorcelawyer.com/media/connect-lawyer-og.jpg',
      width: 1200,
      height: 630,
      alt: 'Connect with Divorce Lawyers',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Connect with a Divorce Lawyer',
    description: 'Find and connect with vetted divorce lawyers in your area.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://divorcelawyer.com/connect-with-lawyer',
  },
}

export default async function ConnectWithLawyerPage() {
  // Fetch states for location dropdown
  const states = await getStates()

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <ConnectWithLawyerClient states={states} />
      </main>
      <TagDisplayServer contentType="page" contentId="connect-with-lawyer" />
      <Footer />
    </>
  )
}

