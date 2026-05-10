'use client'

import { useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_RUNES } from '@/lib/runes'
import { useMenuState } from '@/hooks/use-menu-state'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
]

export function Header() {
  const pathname = usePathname()
  const { isOpen, toggle, close, buttonRef, brandRef } = useMenuState()

  const isActive = useCallback(
    (href: string) =>
      pathname === href || (href !== '/' && pathname.startsWith(href)),
    [pathname]
  )

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand" aria-label="keech.dev home" ref={brandRef}>
          <span aria-hidden="true" className="site-header__brand-rune">
            {NAV_RUNES['/']}
          </span>
          <span>
            keech<span className="site-header__brand-dot">.dev</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'site-nav__link',
                isActive(item.href) && 'site-nav__link--active',
              )}
            >
              <span aria-hidden="true" className="site-nav__rune">
                {NAV_RUNES[item.href as keyof typeof NAV_RUNES]}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          ref={buttonRef}
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="site-hamburger"
        >
          {isOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
        </button>
      </div>

      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          'site-mobile-menu md:hidden',
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible',
        )}
      >
        <nav className="site-mobile-menu__nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={cn(
                'site-mobile-menu__link',
                isActive(item.href) && 'site-mobile-menu__link--active',
              )}
            >
              <span aria-hidden="true" className="site-nav__rune">
                {NAV_RUNES[item.href as keyof typeof NAV_RUNES]}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
