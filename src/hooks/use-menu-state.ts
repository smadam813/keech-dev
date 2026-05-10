import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'

export interface UseMenuStateReturn {
  isOpen: boolean
  toggle: () => void
  close: () => void
  buttonRef: React.RefObject<HTMLButtonElement | null>
  brandRef: React.RefObject<HTMLAnchorElement | null>
}

export function useMenuState(): UseMenuStateReturn {
  const [menuPathname, setMenuPathname] = useState<string | null>(null)
  const pathname = usePathname()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const brandRef = useRef<HTMLAnchorElement>(null)
  const prevIsOpenRef = useRef(false)

  const isOpen = menuPathname !== null && menuPathname === pathname

  const toggle = useCallback(() => {
    setMenuPathname(prev => (prev === pathname ? null : pathname))
  }, [pathname])

  const close = useCallback(() => {
    setMenuPathname(null)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      if (prevIsOpenRef.current) buttonRef.current?.focus()
      prevIsOpenRef.current = false
      return
    }

    prevIsOpenRef.current = true

    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.overflow = 'hidden'

    const main = document.querySelector('main')
    const brand = brandRef.current
    main?.setAttribute('inert', '')
    brand?.setAttribute('inert', '')

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuPathname(null)
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)

      main?.removeAttribute('inert')
      brand?.removeAttribute('inert')

      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  return { isOpen, toggle, close, buttonRef, brandRef }
}
