'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/business-profile', label: 'Business Profile' },
  { href: '/assumptions', label: 'Assumptions' },
  { href: '/data-sheets', label: 'Data Sheets' },
]

export default function Navbar() {
  const pathname = usePathname()
  return (
    <nav className="main-nav">
      <div className="container nav-inner">
        <div className="nav-logo">
          <span className="logo-text">loxomo</span>
        </div>
        <ul className="nav-list">
          {navItems.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  pathname === item.href
                    ? 'nav-link nav-link-active'
                    : 'nav-link'
                }
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
} 