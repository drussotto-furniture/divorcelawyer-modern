'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AuthUser } from '@/lib/auth/server'

interface AdminSidebarProps {
  auth: AuthUser
}

export default function AdminSidebar({ auth }: AdminSidebarProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  useEffect(() => {
    const toggleButton = document.getElementById('sidebar-toggle')
    const sidebar = document.getElementById('admin-sidebar')
    const overlay = document.getElementById('sidebar-overlay')

    const updateSidebar = (open: boolean) => {
      if (sidebar) {
        if (open) {
          sidebar.classList.remove('-translate-x-full')
        } else {
          sidebar.classList.add('-translate-x-full')
        }
      }
      if (overlay) {
        if (open) {
          overlay.classList.remove('hidden')
        } else {
          overlay.classList.add('hidden')
        }
      }
    }

    const handleToggle = () => {
      setSidebarOpen(prev => {
        const newState = !prev
        updateSidebar(newState)
        return newState
      })
    }

    const handleOverlayClick = () => {
      setSidebarOpen(false)
      updateSidebar(false)
    }

    toggleButton?.addEventListener('click', handleToggle)
    overlay?.addEventListener('click', handleOverlayClick)

    // Close sidebar on route change (mobile only)
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
      updateSidebar(false)
    }

    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
        updateSidebar(false)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      toggleButton?.removeEventListener('click', handleToggle)
      overlay?.removeEventListener('click', handleOverlayClick)
      window.removeEventListener('resize', handleResize)
    }
  }, [pathname]) // Re-run when pathname changes

  interface NavItem {
    name: string
    href: string
    icon: string
    children?: Array<{ name: string; href: string }>
  }

  const superAdminNav: NavItem[] = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Content', href: '/admin/content', icon: '📝', children: [
      { name: 'Homepage', href: '/admin/content/homepage' },
      { name: 'Articles', href: '/admin/content/articles' },
      { name: 'Videos', href: '/admin/content/videos' },
      { name: 'Questions/FAQ', href: '/admin/content/questions' },
    ]},
    { name: 'Directory', href: '/admin/directory', icon: '🏢', children: [
      { name: 'Law Firms', href: '/admin/directory/law-firms' },
      { name: 'Lawyers', href: '/admin/directory/lawyers' },
      { name: 'Locations', href: '/admin/directory/locations' },
      { name: 'Fallback Lawyers', href: '/admin/fallback-lawyers' },
    ]},
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: '💳', children: [
      { name: 'Subscription Types', href: '/admin/subscriptions/types' },
      { name: 'Subscription Limits', href: '/admin/subscriptions/limits' },
    ]},
    { name: 'Resources', href: '/admin/resources', icon: '📚', children: [
      { name: 'Stages', href: '/admin/resources/stages' },
      { name: 'Emotions', href: '/admin/resources/emotions' },
      { name: 'Categories', href: '/admin/resources/categories' },
    ]},
    { name: 'Tags', href: '/admin/tags', icon: '🏷️', children: [
      { name: 'Manage Tags', href: '/admin/tags' },
      { name: 'Page Tags', href: '/admin/tags/pages' },
    ]},
    { name: 'Media Library', href: '/admin/media', icon: '🖼️' },
    { name: 'Components', href: '/admin/components', icon: '🧩' },
    { name: 'Team', href: '/admin/team', icon: '👥' },
    { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
    { name: 'Forms', href: '/admin/forms', icon: '📋' },
  ]

  const lawFirmNav: NavItem[] = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'My Firm', href: `/admin/directory/law-firms/${auth.lawFirmId}`, icon: '🏢' },
    { name: 'My Lawyers', href: '/admin/directory/lawyers', icon: '👨‍⚖️' },
  ]

  const lawyerNav: NavItem[] = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'My Profile', href: `/admin/directory/lawyers/${auth.lawyerId}`, icon: '👤' },
  ]

  const navItems: NavItem[] = auth.isSuperAdmin 
    ? superAdminNav 
    : auth.isLawFirm 
    ? lawFirmNav 
    : lawyerNav

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <div className="lg:hidden fixed inset-0 bg-black/50 z-40 hidden" id="sidebar-overlay"></div>
      
      {/* Sidebar */}
      <aside 
        id="admin-sidebar"
        className="w-64 bg-bluish text-white h-[calc(100vh-101px)] fixed lg:sticky top-[101px] left-0 lg:left-auto z-30 overflow-y-auto transform -translate-x-full lg:translate-x-0 transition-transform duration-300 flex-shrink-0 self-start"
      >
        <nav className="p-4">
          <div className="mb-6 px-4 py-3 border-b border-white/20">
            <h2 className="text-lg font-bold text-white">Admin Panel</h2>
            <p className="text-sm text-white/70 mt-1">
              {auth.isSuperAdmin ? 'Super Admin' : auth.isLawFirm ? 'Law Firm Admin' : 'Lawyer'}
            </p>
          </div>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-proxima
                    ${isActive(item.href)
                      ? 'bg-primary text-black font-bold'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
                {item.children && isActive(item.href) && (
                  <ul className="ml-8 mt-2 space-y-1 border-l-2 border-white/20 pl-4">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={`
                            block px-4 py-2 rounded-lg text-sm transition-colors
                            ${isActive(child.href)
                              ? 'bg-primary/20 text-primary font-bold'
                              : 'text-white/80 hover:bg-white/5 hover:text-white'
                            }
                          `}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      
      {/* Mobile Menu Toggle Button */}
      <button
        id="sidebar-toggle"
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-primary text-black p-4 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Toggle admin menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  )
}

