'use client'

import Link from 'next/link'

interface InfoCardProps {
  title: string
  subtitle: string
  body: React.ReactNode // Can be a paragraph or list
  ctaButton?: {
    text: string
    href: string
    className?: string
  }
}

export default function InfoCard({ title, subtitle, body, ctaButton }: InfoCardProps) {
  return (
    <div className="flex-1 min-w-[280px] sm:min-w-[320px] lg:min-w-0 max-w-[450px] lg:max-w-none w-full flex flex-col h-full bg-white rounded-lg p-6 lg:p-8 shadow-sm">
      <div className="flex flex-col h-full">
        {/* Section 1: Title - Top justified */}
        <div className="mb-2 flex-shrink-0">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-serif text-bluish font-normal text-left">
            {title}
          </h2>
        </div>

        {/* Section 2: Subtitle - Top justified, aligned with title */}
        <div className="mb-6 lg:mb-8 flex-shrink-0">
          <h3 className="text-2xl lg:text-3xl xl:text-4xl font-serif italic text-primary font-normal text-left">
            {subtitle}
          </h3>
        </div>

        {/* Section 3: Body - Top justified, aligned with above sections */}
        <div className="flex-1 text-left mb-6 lg:mb-8 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:lg:pl-8 [&_ul]:space-y-3 [&_ul]:lg:space-y-4 [&_li]:text-black [&_li]:font-proxima [&_li]:text-sm [&_li]:lg:text-base [&_li::marker]:text-primary [&_p]:text-black [&_p]:font-proxima [&_p]:text-base [&_p]:lg:text-lg">
          {body}
        </div>

        {/* Section 4: Call to Action Button - Bottom aligned */}
        {ctaButton && (
          <div className="mt-auto flex-shrink-0">
            <Link
              href={ctaButton.href}
              className={`component-button flex items-center transition-all !no-underline justify-center py-3 px-6 rounded-full font-proxima font-bold text-sm lg:text-base uppercase tracking-wide ${ctaButton.className || 'bg-bluish text-white hover:bg-dark-bluish'}`}
            >
              <span className="button-wrapper">
                <span className="button-text">{ctaButton.text}</span>
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

