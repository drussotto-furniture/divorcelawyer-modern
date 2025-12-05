'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
      <div className={`nav-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
      <nav className="container flex items-center justify-between mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center w-full lg:flex-1 toplogo lg:w-auto lg:justify-normal">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
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

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden flex flex-col justify-center items-center w-10 h-10 text-white z-50 relative"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-white mt-1.5 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-white mt-1.5 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>

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

              {/* For Lawyers */}
              <li>
                <Link href="/claim-profile" className="pb-10 text-light font-proxima font-semibold capitalize whitespace-nowrap relative">
                  For Lawyers
                </Link>
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
                {userRole ? (
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
                    <button
                      onClick={async () => {
                        const supabase = createClient()
                        await supabase.auth.signOut()
                        window.location.href = '/'
                      }}
                      className="px-4 py-2 text-white hover:text-primary transition-colors text-sm font-medium"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/admin/login"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    Login
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

        {/* Mobile Menu */}
        <div className={`lg:hidden fixed top-[101px] left-0 right-0 bg-bluishlight z-40 transform transition-transform duration-300 overflow-y-auto max-h-[calc(100vh-101px)] ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="px-6 py-6 space-y-4">
            {/* Mobile Search */}
            <div className="mb-6">
              <form role="search" method="get" className="search-form" action="/search">
                <label>
                  <input 
                    type="search" 
                    className="search-field w-full" 
                    placeholder="Enter topic or keyword" 
                    name="s" 
                  />
                  <button type="submit" className="search-submit" aria-label="Search"></button>
                </label>
              </form>
            </div>

            {/* Mobile Navigation Links */}
            <div className="space-y-4">
              <div>
                <Link 
                  href="/learning-center" 
                  className="block py-3 text-white font-proxima font-semibold text-lg border-b border-white/20"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Learn
                </Link>
                <div className="pl-4 mt-2 space-y-2">
                  <Link href="/learning-center" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>Learning Center</Link>
                  <Link href="/learning-center/categories" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>Divorce Categories</Link>
                  <Link href="/learning-center/top-divorce-questions" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>Top Questions</Link>
                  <Link href="/learning-center/stages-of-divorce" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>Stages Of Divorce</Link>
                  <Link href="/learning-center/emotions" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>Emotional Path</Link>
                  <Link href="/learning-center/real-voices" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>Real Voices</Link>
                </div>
              </div>

              <div>
                <Link 
                  href="/connect-with-lawyer" 
                  className="block py-3 text-white font-proxima font-semibold text-lg border-b border-white/20"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Connect
                </Link>
                <div className="pl-4 mt-2 space-y-2">
                  <Link href="/connect-with-lawyer" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>Find a Divorce Lawyer</Link>
                  <Link href="/locations" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>Search by State</Link>
                  <Link href="/top-cities" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>Top Cities</Link>
                  <Link href="/vetting-process" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>Vetting Process</Link>
                </div>
              </div>

              <div>
                <Link 
                  href="/claim-profile" 
                  className="block py-3 text-white font-proxima font-semibold text-lg border-b border-white/20"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  For Lawyers
                </Link>
              </div>

              <div>
                <Link 
                  href="/about-us" 
                  className="block py-3 text-white font-proxima font-semibold text-lg border-b border-white/20"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <div className="pl-4 mt-2 space-y-2">
                  <Link href="/about-us" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
                  <Link href="/about-us/meet-the-team" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>Meet the Team</Link>
                  <Link href="/about-us/company-faq" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>Company FAQ</Link>
                  <Link href="/about-us/news-and-press" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>News and Press</Link>
                  <Link href="/councils" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>Councils</Link>
                  <Link href="/contact" className="block py-2 text-white/90 text-sm" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link>
                </div>
              </div>

              {/* Mobile Auth Buttons */}
              {!loading && (
                <div className="pt-4 border-t border-white/20">
                  {userRole ? (
                    <>
                      {userRole === 'super_admin' && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 bg-primary text-white rounded-lg text-center text-sm font-medium mb-2"
                          onClick={() => setMobileMenuOpen(false)}
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
                          className="block px-4 py-2 bg-primary text-white rounded-lg text-center text-sm font-medium mb-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Manage Profile
                        </Link>
                      )}
                      <button
                        onClick={async () => {
                          const supabase = createClient()
                          await supabase.auth.signOut()
                          setMobileMenuOpen(false)
                          window.location.href = '/'
                        }}
                        className="w-full px-4 py-2 text-white hover:text-primary transition-colors text-sm font-medium"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/admin/login"
                      className="block px-4 py-2 bg-primary text-white rounded-lg text-center text-sm font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
