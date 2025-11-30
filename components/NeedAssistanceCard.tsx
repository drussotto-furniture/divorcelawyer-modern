'use client'

import Link from 'next/link'

export default function NeedAssistanceCard() {
  return (
    <div className="flex-1 min-w-[280px] sm:min-w-[320px] lg:min-w-0 max-w-[450px] lg:max-w-none w-full lawyer-card-pack flex flex-col h-full law-firmscard comming-soon explore bg-white rounded-lg p-6 lg:p-8 shadow-sm">
      <div className="flex flex-col h-full">
        <div className="mb-6 lg:mb-8">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-serif text-bluish mb-2 font-normal">
            Need Assistance Sooner?
          </h2>
          <h3 className="text-2xl lg:text-3xl xl:text-4xl font-serif italic text-primary font-normal">
            We can help!
          </h3>
        </div>
        <p className="text-base lg:text-lg font-proxima text-black mb-6 lg:mb-8 flex-1 text-left">
          We're still building our network in your area – it takes time to select the best divorce lawyers. If you need support now, reach out and we'll make a connection.
        </p>
        <Link
          href="/about-us/request-a-call/"
          className="mt-auto component-button flex bg-bluish items-center transition-all !no-underline justify-center text-white py-3 px-6 rounded-full hover:bg-dark-bluish font-proxima font-bold text-sm lg:text-base uppercase tracking-wide"
        >
          <span className="button-wrapper">
            <span className="button-text">REQUEST AN INTRODUCTION</span>
          </span>
        </Link>
      </div>
    </div>
  )
}

