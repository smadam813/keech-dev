'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_RUNES } from '@/lib/runes'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
]

export function Header() {
  const [menuPathname, setMenuPathname] = useState<string | null>(null)
  const pathname = usePathname()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const brandRef = useRef<HTMLAnchorElement>(null)
  const prevIsOpenRef = useRef(false)

  const isOpen = menuPathname !== null && menuPathname === pathname

  const isActive = useCallback(
    (href: string) =>
      pathname === href || (href !== '/' && pathname.startsWith(href)),
    [pathname]
  )

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  useEffect(() => {
    const main = document.querySelector('main')
    const brand = brandRef.current
    if (isOpen) {
      main?.setAttribute('inert', '')
      brand?.setAttribute('inert', '')
    } else {
      main?.removeAttribute('inert')
      brand?.removeAttribute('inert')
    }
    return () => {
      main?.removeAttribute('inert')
      brand?.removeAttribute('inert')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuPathname(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  useEffect(() => {
    if (prevIsOpenRef.current && !isOpen) buttonRef.current?.focus()
    prevIsOpenRef.current = isOpen
  }, [isOpen])

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
          onClick={() => setMenuPathname(prev => prev === pathname ? null : pathname)}
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
              onClick={() => setMenuPathname(null)}
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
