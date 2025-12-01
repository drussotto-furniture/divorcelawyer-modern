'use client'

import Image from 'next/image'
import Link from 'next/link'
import FirmName from './FirmName'
import { LawyerImageWithBlur } from './LawyerImageWithBlur'

interface Lawyer {
  id: string
  first_name: string
  last_name: string
  slug: string
  photo_url: string | null
  title: string | null
}

interface LawFirm {
  id: string
  name: string
  slug: string
}

interface LawyerSlideProps {
  lawyer: Lawyer
  firm: LawFirm
}

export default function LawyerSlide({ lawyer, firm }: LawyerSlideProps) {
  return (
    <div className="px-4 lg:px-8 flex flex-col h-full">
      <div className="flex justify-center title-container flex-shrink-0">
        <FirmName name={firm.name} />
      </div>
      <p className="text-xs underline font-proxima mb-4 flex-shrink-0">
        <Link href={`/law-firms/${firm.slug}`} className="text-primary underline">VIEW FIRM</Link>
      </p>
      <div className="relative flex flex-col items-center justify-center flex-1 min-h-0 pt-4 pb-8 overflow-visible">
        <div className="relative object-contain object-center overflow-hidden rounded-lg image-cover w-full">
          {lawyer.photo_url ? (
            <LawyerImageWithBlur
              src={lawyer.photo_url}
              alt={`${lawyer.first_name} ${lawyer.last_name}`}
              width={326}
              height={193}
              className="w-full h-auto"
            />
          ) : (
            <div className="w-full h-48 bg-gray-300 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No photo</span>
            </div>
          )}
          <div className="absolute top-0 left-0 w-full h-full overlay lawyer-img-overlay"></div>
          <div 
            className="absolute font-semibold overlay bottom-4 left-4 text-md font-proxima z-10 lawyer-name-overlay" 
            style={{ 
              color: '#ffffff',
              textShadow: '2px 2px 6px rgba(0, 0, 0, 0.95), 0 0 12px rgba(0, 0, 0, 0.8), 1px 1px 2px rgba(0, 0, 0, 1)',
              fontWeight: 600
            }}
          >
            {lawyer.first_name} {lawyer.last_name}
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-50" style={{ marginBottom: '-12px' }}>
          <Link 
            href={`/lawyers/${lawyer.slug}`}
            className="component-button style-vp-button font-proxima"
          >
            <span className="button-wrapper">
              <span>VIEW PROFILE</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

