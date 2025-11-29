'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AuthUser } from '@/lib/auth/server'

interface AdminSidebarProps {
  auth: AuthUser
}

export default function AdminSidebar({ auth }: AdminSidebarProps) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

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
    ]},
    { name: 'Resources', href: '/admin/resources', icon: '📚', children: [
      { name: 'Stages', href: '/admin/resources/stages' },
      { name: 'Emotions', href: '/admin/resources/emotions' },
      { name: 'Categories', href: '/admin/resources/categories' },
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
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] fixed left-0 top-16 z-10 overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
                  ${isActive(item.href)
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
              {item.children && isActive(item.href) && (
                <ul className="ml-8 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className={`
                          block px-4 py-2 rounded-lg text-sm transition-colors
                          ${isActive(child.href)
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
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
  )
}

