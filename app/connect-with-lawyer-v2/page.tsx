import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TagDisplayServer from '@/components/TagDisplayServer'
import ConnectWithLawyerClientV2 from '@/components/ConnectWithLawyerClientV2'
import { getStates } from '@/lib/supabase'

// SEO Metadata
export const metadata: Metadata = {
  title: 'Connect with a Divorce Lawyer (v2) | DivorceLawyer.com',
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
    url: 'https://divorcelawyer.com/connect-with-lawyer-v2',
    siteName: 'DivorceLawyer.com',
    title: 'Connect with a Divorce Lawyer (v2) | DivorceLawyer.com',
    description: 'Find and connect with vetted divorce lawyers in your area.',
    images: [{
      url: 'https://divorcelawyer.com/media/connect-lawyer-og.jpg',
      width: 1200,
      height: 630,
      alt: 'Connect with Divorce Lawyers',
    }],
  },
  robots: {
    index: false, // Don't index test page
    follow: false,
  },
}

export default async function ConnectWithLawyerV2Page() {
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
        <ConnectWithLawyerClientV2 states={states} />
      </main>
      <TagDisplayServer contentType="page" contentId="connect-with-lawyer-v2" />
      <Footer />
    </>
  )
}

