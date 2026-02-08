'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_RUNES } from '@/components/runes/rune-config'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const prevIsOpenRef = useRef(false)

  const isActive = useCallback(
    (href: string) =>
      pathname === href || (href !== '/' && pathname.startsWith(href)),
    [pathname]
  )

  // Auto-close on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Scroll lock (iOS Safari safe: position fixed approach)
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

  // Focus management via inert attribute on main content
  useEffect(() => {
    const main = document.querySelector('main')

    if (isOpen) {
      main?.setAttribute('inert', '')
    } else {
      main?.removeAttribute('inert')
    }

    return () => {
      main?.removeAttribute('inert')
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus restoration: return focus to hamburger button when menu closes
  useEffect(() => {
    if (prevIsOpenRef.current && !isOpen) {
      buttonRef.current?.focus()
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b-[3px] border-foreground">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-display font-bold text-2xl">
          keech
          <span className="text-accent">.dev</span>
        </span>

        {/* Desktop navigation */}
        <nav className="hidden md:flex gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'font-display font-bold text-lg motion-safe:transition-colors',
                isActive(item.href)
                  ? 'text-accent'
                  : 'text-foreground hover:text-accent'
              )}
            >
              <span
                aria-hidden="true"
                className="font-display font-bold text-base opacity-60 mr-1.5 inline-block align-baseline"
              >
                {NAV_RUNES[item.href as keyof typeof NAV_RUNES]?.char}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className={cn(
            'md:hidden p-2 border-[3px] border-foreground bg-surface',
            'shadow-brutal hover:shadow-brutal-hover',
            'hover:translate-x-[2px] hover:translate-y-[2px]',
            'transition-all duration-150'
          )}
        >
          {isOpen ? (
            <X className="w-6 h-6" aria-hidden="true" />
          ) : (
            <Menu className="w-6 h-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile menu overlay */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          'fixed top-16 left-0 right-0 bg-foreground text-background',
          'border-t-[3px] border-b-[3px] border-foreground',
          'transition-all duration-300 ease-in-out',
          'md:hidden',
          isOpen
            ? 'opacity-100 visible'
            : 'opacity-0 invisible'
        )}
      >
        <nav className="flex flex-col items-center gap-8 py-12">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                'font-display text-3xl font-bold motion-safe:transition-colors',
                isActive(item.href)
                  ? 'text-accent'
                  : 'text-background hover:text-accent'
              )}
            >
              <span
                aria-hidden="true"
                className="font-display font-bold text-xl opacity-50 mr-2 inline-block align-baseline"
              >
                {NAV_RUNES[item.href as keyof typeof NAV_RUNES]?.char}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
