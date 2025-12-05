import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TagDisplayServer from '@/components/TagDisplayServer'
import { getLawyerBySlug } from '@/lib/supabase/queries'
import LawyerProfileClient from '@/components/LawyerProfileClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const lawyer = await getLawyerBySlug(slug)
    if (!lawyer) {
      return {
        title: 'Lawyer Not Found | DivorceLawyer.com',
      }
    }

    const fullName = `${lawyer.first_name} ${lawyer.last_name}`
    const firmName = (lawyer.law_firms as any)?.name || ''
    const bio = lawyer.bio || `Experienced divorce attorney ${fullName}${firmName ? ` at ${firmName}` : ''}`

    return {
      title: `${fullName}${firmName ? ` - ${firmName}` : ''} | Divorce Lawyer | DivorceLawyer.com`,
      description: bio.length > 160 ? bio.substring(0, 160) + '...' : bio,
      keywords: [
        'divorce lawyer',
        fullName,
        firmName,
        lawyer.specializations?.join(', ') || '',
        'family law attorney',
        'divorce attorney',
      ].filter(Boolean),
      openGraph: {
        type: 'profile',
        locale: 'en_US',
        url: `https://divorcelawyer.com/lawyers/${slug}`,
        siteName: 'DivorceLawyer.com',
        title: `${fullName} - Divorce Lawyer`,
        description: bio.length > 200 ? bio.substring(0, 200) + '...' : bio,
        images: lawyer.photo_url ? [{
          url: lawyer.photo_url,
          width: 1200,
          height: 630,
          alt: `${fullName} - Divorce Lawyer`,
        }] : [],
      },
    }
  } catch (error) {
    return {
      title: 'Lawyer Profile | DivorceLawyer.com',
    }
  }
}

export default async function LawyerProfilePage({ params }: PageProps) {
  const { slug } = await params
  
  let lawyer
  try {
    lawyer = await getLawyerBySlug(slug)
  } catch (error) {
    console.error('Error fetching lawyer:', error)
    notFound()
  }

  if (!lawyer) {
    notFound()
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <LawyerProfileClient lawyer={lawyer} />
      </main>
      <TagDisplayServer contentType="lawyer" contentId={lawyer.id} />
      <Footer />
    </>
  )
}

