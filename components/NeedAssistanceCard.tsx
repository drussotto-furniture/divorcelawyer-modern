'use client'

import Link from 'next/link'

export default function NeedAssistanceCard() {
  return (
    <div className="flex-1 min-w-0 max-w-[450px] lg:max-w-none w-full mb-3 lawyer-card-pack flex flex-col lg:h-full law-firmscard comming-soon explore">
      <h2 className="text-[28px]">Need Assistance Sooner?</h2>
      <h3>We can help!</h3>
      <p className="text-sm font-normal text-dark font-proxima lg:text-base">
        We're still building our network in your area – it takes time to select the best divorce lawyers. If you need support now, reach out and we'll make a connection.
      </p>
      <Link
        href="/about-us/request-a-call/"
        className="m-auto component-button flex bg-bluish items-center transition-all !no-underline justify-center text-white mt-2 hover:bg-dark"
      >
        <span className="button-wrapper">
          <span className="text-sm font-semibold button-text">Request A Connection</span>
        </span>
      </Link>
    </div>
  )
}

