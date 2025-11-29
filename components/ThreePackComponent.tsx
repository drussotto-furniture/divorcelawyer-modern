'use client'

import Link from 'next/link'
import FirmCard from './FirmCard'
import VettingProcessCard from './VettingProcessCard'
import ComingSoonCard from './ComingSoonCard'
import NeedAssistanceCard from './NeedAssistanceCard'

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
  lawyers: Lawyer[]
  cities?: {
    name: string
    slug: string
    states: {
      code: string
    }
  }
}

interface ThreePackComponentProps {
  lawFirms?: LawFirm[]
  city?: string
  stateCode?: string
  backgroundColor?: 'bg-bluish' | 'bg-white'
}

export default function ThreePackComponent({ 
  lawFirms = [],
  city = 'Atlanta', 
  stateCode = 'GA',
  backgroundColor = 'bg-bluish'
}: ThreePackComponentProps) {
  const textColor = backgroundColor === 'bg-bluish' ? 'text-white' : 'text-black'
  const bgCondition = backgroundColor === 'bg-bluish' ? 'bg-seashell' : 'bg-bluish'
  const textCondition = backgroundColor === 'bg-bluish' ? 'text-black' : 'text-white'

  // Build cards array based on lawFirms
  const cards: Array<{ type: 'firm' | 'vetting-process' | 'coming-soon' | 'need-assistance'; data?: LawFirm }> = []
  
  if (lawFirms.length > 0) {
    // Add law firm cards first
    lawFirms.slice(0, 3).forEach((firm) => {
      cards.push({ type: 'firm', data: firm })
    })
    
    // Fill remaining slots based on how many firms we have
    if (lawFirms.length === 1) {
      cards.push({ type: 'coming-soon' })
      cards.push({ type: 'vetting-process' })
    } else if (lawFirms.length === 2) {
      cards.push({ type: 'vetting-process' })
    }
  } else {
    // No law firms - show default cards
    cards.push({ type: 'vetting-process' })
    cards.push({ type: 'need-assistance' })
  }

  return (
    <section id="3pack" className="top-law-firms-section block-spacing spacing-top-large spacing-bottom-none lg:px-10 xl:px-10 md:px-4 sm:px-0 px-5">
      <div className={`pack-component block-container px-6 py-20 rounded-xl slideup ${backgroundColor} overley-layout`}>
        <div className="flex justify-center align-center">
          <div className="container-size-small w-full">
            <div className="px-0 text-center lg:px-0">
              <h2 className={`${textColor} title-pack`}>
                The Top Divorce Lawyers in your Area
              </h2>
              <h2 className={`${textColor} title-pack`}>
                <span>{city}, {stateCode}</span>
              </h2>
              <div className="mb-4 lg:px-24">
                <a 
                  href="#" 
                  id="open-change-location-modal" 
                  className="italic underline underline-offset-2 cursor-pointer text-white font-proxima hover:text-primary"
                >
                  Change location
                </a>
              </div>
            </div>
            
            <div className="px-4 mb-3 text-center xl:px-64 lg:px-64 md:px-20 sm:px-4">
              <div className={`max-w-6xl text-center p-0 component-rich-text ${backgroundColor === 'bg-bluish' ? 'text-white' : ''}`}>
                Divorce can be complex, and choosing a lawyer among many is often overwhelming. We've done the initial screening for you, selecting the right representation, carefully vetted and handpicked for you.
              </div>
            </div>
            
            <div className="container flex flex-row flex-nowrap gap-4 px-0 top-law-firmscard-wrapper slide-container lg:gap-2 lg:px-0 xl:gap-4 xl:px-0 lg:items-stretch justify-center">
              {cards.map((card, cardIndex) => {
                if (card.type === 'firm' && card.data) {
                  return <FirmCard key={cardIndex} firm={card.data} cardIndex={cardIndex} />
                }

                if (card.type === 'vetting-process') {
                  return <VettingProcessCard key={cardIndex} bgCondition={bgCondition} textCondition={textCondition} />
                }

                if (card.type === 'coming-soon') {
                  return <ComingSoonCard key={cardIndex} />
                }

                if (card.type === 'need-assistance') {
                  return <NeedAssistanceCard key={cardIndex} />
                }

                return null
              })}
            </div>
            
            <div className="flex justify-center mb-0 text-center mt-9">
              <Link
                href={`/locations/${stateCode.toLowerCase()}/${city.toLowerCase().replace(/ /g, '-')}`}
                className="component-button style-bottom-button"
              >
                <span className="button-wrapper">
                  <span>Explore All in {city}, {stateCode}</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
