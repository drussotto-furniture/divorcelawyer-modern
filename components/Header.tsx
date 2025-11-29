'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'super_admin' | 'law_firm' | 'lawyer' | null>(null)
  const [lawFirmId, setLawFirmId] = useState<string | null>(null)
  const [lawyerId, setLawyerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles' as any)
          .select('role, law_firm_id, lawyer_id')
          .eq('id', user.id)
          .single()
        
        // Type assertion for profile
        const typedProfile = profile as unknown as { role?: string; law_firm_id?: string | null; lawyer_id?: string | null } | null
        
        if (typedProfile) {
          setUserRole(typedProfile.role as 'super_admin' | 'law_firm' | 'lawyer')
          setLawFirmId(typedProfile.law_firm_id || null)
          setLawyerId(typedProfile.lawyer_id || null)
        }
      }
      
      setLoading(false)
    }
    
    checkAuth()
    
    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth()
    })
    
    return () => subscription.unsubscribe()
  }, [])

  const handleMenuHover = (menu: string) => {
    setActiveMenu(menu)
  }

  const handleMenuLeave = () => {
    setActiveMenu(null)
  }

  return (
    <header className="shadow-md bg-bluishlight topheader topheaderfunction">
      <div className="nav-overlay"></div>
      <nav className="container flex items-center justify-between mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center w-full lg:flex-1 toplogo lg:w-auto lg:justify-normal">
          <Link href="/">
            <Image 
              src="/images/HeaderWhte-logo.svg" 
              alt="DivorceLawyer.com" 
              width={280} 
              height={40}
              className="Header-logo white-logo"
              priority
            />
            <Image 
              src="/images/DLS-logo-Black.svg" 
              alt="DivorceLawyer.com" 
              width={280} 
              height={40}
              className="hidden Header-logo black-logo"
              id="headerBlackLogo"
            />
          </Link>
        </div>

        {/* Desktop Navigation and Search */}
        <div className="flex items-center mx-auto">
          <div className="desktop-menu">
            <ul className="flex">
              {/* Learn */}
              <li 
                className={`menu-item-has-children ${activeMenu === 'learn' ? 'active-menu' : ''}`}
                onMouseEnter={() => handleMenuHover('learn')}
                onMouseLeave={handleMenuLeave}
              >
                <Link href="/learning-center" className="pb-10 text-light font-proxima font-semibold capitalize whitespace-nowrap relative">
                  Learn
                </Link>
                <ul className={`sub-menu ${activeMenu === 'learn' ? 'visible-submenu' : ''}`}>
                  <li><Link href="/learning-center">Learning Center</Link></li>
                  <li><Link href="/learning-center/categories">Divorce Categories</Link></li>
                  <li><Link href="/learning-center/top-divorce-questions">Top Questions</Link></li>
                  <li><Link href="/learning-center/stages-of-divorce">Stages Of Divorce</Link></li>
                  <li><Link href="/learning-center/emotions">Emotional Path</Link></li>
                  <li><Link href="/learning-center/real-voices">Real Voices</Link></li>
                </ul>
              </li>

              {/* Connect */}
              <li 
                className={`menu-item-has-children ${activeMenu === 'connect' ? 'active-menu' : ''}`}
                onMouseEnter={() => handleMenuHover('connect')}
                onMouseLeave={handleMenuLeave}
              >
                <Link href="/connect-with-lawyer" className="pb-10 text-light font-proxima font-semibold capitalize whitespace-nowrap relative">
                  Connect
                </Link>
                <ul className={`sub-menu ${activeMenu === 'connect' ? 'visible-submenu' : ''}`}>
                  <li><Link href="/connect-with-lawyer">Find a Divorce Lawyer</Link></li>
                  <li><Link href="/locations">Search by State</Link></li>
                  <li><Link href="/top-cities">Top Cities</Link></li>
                  <li><Link href="/vetting-process">Vetting Process</Link></li>
                </ul>
              </li>

              {/* About */}
              <li 
                className={`menu-item-has-children ${activeMenu === 'about' ? 'active-menu' : ''}`}
                onMouseEnter={() => handleMenuHover('about')}
                onMouseLeave={handleMenuLeave}
              >
                <Link href="/about-us" className="pb-10 text-light font-proxima font-semibold capitalize whitespace-nowrap relative">
                  About
                </Link>
                <ul className={`sub-menu ${activeMenu === 'about' ? 'visible-submenu' : ''}`}>
                  <li><Link href="/about-us">About Us</Link></li>
                  <li><Link href="/about-us/meet-the-team">Meet the Team</Link></li>
                  <li><Link href="/about-us/company-faq">Company FAQ</Link></li>
                  <li><Link href="/about-us/news-and-press">News and Press</Link></li>
                  <li><Link href="/councils">Councils</Link></li>
                  <li><Link href="/for-lawyers" className="font-bold">For Lawyers</Link></li>
                  <li><Link href="/contact">Contact Us</Link></li>
                </ul>
              </li>
            </ul>
          </div>

          {/* Search Box and Auth Buttons */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4">
            {/* Auth Buttons */}
            {!loading && (
              <>
                {userRole === 'super_admin' && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    Admin Panel
                  </Link>
                )}
                {(userRole === 'law_firm' || userRole === 'lawyer') && (
                  <Link
                    href={
                      userRole === 'law_firm' && lawFirmId
                        ? `/admin/directory/law-firms/${lawFirmId}`
                        : userRole === 'lawyer' && lawyerId
                        ? `/admin/directory/lawyers/${lawyerId}`
                        : '/admin'
                    }
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    Manage Profile
                  </Link>
                )}
              </>
            )}
            
            {/* Search Box */}
            <div className="search-header-box">
              <form role="search" method="get" className="search-form" action="/search">
                <label>
                  <input 
                    type="search" 
                    className="search-field" 
                    placeholder="Enter topic or keyword" 
                    name="s" 
                  />
                  <button type="submit" className="search-submit" aria-label="Search"></button>
                </label>
              </form>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
