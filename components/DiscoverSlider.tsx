'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface Slide {
  image: string
  title?: string
  subtitle: string
  description: string
  caption: string
  link: { title: string; url: string }
}

interface DiscoverSliderProps {
  slides: Slide[]
}

export default function DiscoverSlider({ slides }: DiscoverSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null)

  return (
    <section className="block-discover-slider block-spacing spacing-top-normal spacing-bottom-none bg-white">
      <div className="block-container container-size-medium overley-layout mx-auto">
        <div className="swiper-container discover-slider-container">
          {/* Custom Indicators */}
          <div className="custom-indicators">
            {slides.map((slide, index) => (
              <button
                key={index}
                className={`custom-indicator ${index === activeIndex ? 'active' : ''}`}
                onClick={() => swiperInstance?.slideTo(index)}
              >
                <span>{slide.caption}</span>
                {index < slides.length - 1 && <span className="caption-arrow" />}
              </button>
            ))}
          </div>

          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={50}
            slidesPerView={1}
            navigation={{
              nextEl: '.discover-button-next',
              prevEl: '.discover-button-prev',
            }}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            onSwiper={setSwiperInstance}
            className="swiper-wrapper"
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={index} className="swiper-slide items-center justify-center p-4">
                {/* Mobile content (shows before image) */}
                <div className="flex flex-col justify-end min-h-52 discover-slider-content lg:hidden">
                  {slide.title && <h2 className="font-proxima">{slide.title}</h2>}
                  <h3 className="font-libre">
                    <div
                      className="component-rich-text"
                      dangerouslySetInnerHTML={{ __html: slide.subtitle }}
                    />
                  </h3>
                  <div className="block-short-des">
                    <div className="component-rich-text">{slide.description}</div>
                  </div>
                </div>

                {/* Image/Thumbnail */}
                <div className="relative discover-slide-thumbnail">
                  <div className="component-image">
                    <Image
                      src={slide.image}
                      alt={slide.caption}
                      width={504}
                      height={600}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="mob-slider-navigation swiper-button-prev discover-button-prev" />
                  <div className="mob-slider-navigation swiper-button-next discover-button-next" />
                </div>

                {/* Desktop content (shows after image) */}
                <div className="discover-slider-content">
                  <div className="discover-slide-inner-content">
                    {slide.title && <h2 className="hidden font-proxima lg:block">{slide.title}</h2>}
                    <h3 className="hidden font-libre lg:block">
                      <div
                        className="component-rich-text"
                        dangerouslySetInnerHTML={{ __html: slide.subtitle }}
                      />
                    </h3>
                    <div className="hidden block-short-des lg:block">
                      <div className="component-rich-text">{slide.description}</div>
                    </div>
                  </div>
                  <div className="flex component-button-wrapper">
                    <Link href={slide.link.url} className="component-button style-primary">
                      <span>{slide.link.title}</span>
                    </Link>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Desktop Navigation Arrows */}
          <div className="hidden swiper-button-prev lg:block discover-button-prev" />
          <div className="hidden swiper-button-next lg:block discover-button-next" />
        </div>
      </div>
    </section>
  )
}

