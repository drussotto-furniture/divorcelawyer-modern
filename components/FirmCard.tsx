'use client'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import LawyerSlide from './LawyerSlide'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

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
}

interface FirmCardProps {
  firm: LawFirm
  cardIndex: number
}

export default function FirmCard({ firm, cardIndex }: FirmCardProps) {
  return (
    <div className="flex-1 min-w-[280px] sm:min-w-[320px] max-w-[450px] lg:max-w-none 2xl:max-w-[550px] w-full mb-3 lawyer-card-pack flex flex-col lg:h-full">
      <div 
        className="relative w-full h-full pt-5 pb-10 m-auto overflow-visible text-center bg-top bg-no-repeat bg-cover rounded-lg lg:pb-8 lawfirm box-shad-card flex flex-col"
        style={{ backgroundImage: 'url(/images/lawyer-box-long.svg)' }}
      >
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={0}
          slidesPerView={1}
          navigation={{
            nextEl: `.threepack-button-next-${cardIndex}`,
            prevEl: `.threepack-button-prev-${cardIndex}`,
          }}
          pagination={{
            el: `.threepack-pagination-${cardIndex}`,
            clickable: true
          }}
          className={`swiper-${cardIndex} flex-1 flex flex-col`}
        >
          {firm.lawyers && firm.lawyers.map((lawyer) => (
            <SwiperSlide key={lawyer.id}>
              <LawyerSlide lawyer={lawyer} firm={firm} />
            </SwiperSlide>
          ))}
        </Swiper>
        
        <div 
          className={`swiper-button-prev threepack-button-prev-${cardIndex} bg-contain bg-no-repeat bg-center xl:mt-1 w-10 xl:top-2/4`}
          style={{ backgroundImage: "url('/images/arrow-prev.svg')" }}
        ></div>
        <div className={`swiper-pagination threepack-pagination-${cardIndex} xl:mb-1 lg:mb-2 md:mb-2 sm:mb-2 mb-2`}></div>
        <div 
          className={`swiper-button-next threepack-button-next-${cardIndex} bg-contain bg-no-repeat bg-center xl:mt-1 w-10 xl:top-2/4`}
          style={{ backgroundImage: "url('/images/arrow-next.svg')" }}
        ></div>
      </div>
    </div>
  )
}

