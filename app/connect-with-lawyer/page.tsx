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
  // Fetch states for location dropdown - use empty array if it fails or hangs
  let states: any[] = []
  try {
    // Try to get states, but don't let it block page rendering
    const statesPromise = getStates()
    const timeoutPromise = new Promise<any[]>((resolve) => 
      setTimeout(() => resolve([]), 3000) // Return empty array after 3 seconds
    )
    states = await Promise.race([statesPromise, timeoutPromise])
  } catch (error) {
    console.error('Error fetching states:', error)
    states = []
  }

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

