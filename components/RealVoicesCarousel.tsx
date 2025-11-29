'use client'

import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface Story {
  title: string
  description: string
  author: string
}

interface RealVoicesCarouselProps {
  stories: Story[]
}

export default function RealVoicesCarousel({ stories }: RealVoicesCarouselProps) {
  return (
    <div className="relative mx-auto max-w-max">
      <div className="swiper real-voices-container">
        <Swiper
          modules={[Navigation, Pagination]}
          slidesPerView={1}
          navigation={{
            prevEl: '.real-voices-prev',
            nextEl: '.real-voices-next',
          }}
          pagination={{
            el: '.realvoices-dots-pagination',
            clickable: true,
          }}
          className="swiper-wrapper"
        >
          {stories.map((story, index) => (
            <SwiperSlide key={index} className="h-auto">
              <div className="real-voices-card-item">
                <h3>{story.title}</h3>
                <div className="short-description">
                  <div className="component-rich-text">{story.description}</div>
                </div>
                <h4>{story.author}</h4>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <div className="swiper-pagination realvoices-dots-pagination"></div>
      <div className="realvoices-arrow-navigation">
        <div className="swiper-button-prev real-voices-prev"></div>
        <div className="swiper-button-next real-voices-next"></div>
      </div>
    </div>
  )
}

