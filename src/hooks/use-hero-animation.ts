'use client'

import { useRef, useState, useEffect, useCallback, type RefObject } from 'react'

type RevealStage = 'loading' | 'bg-reveal' | 'text-reveal'

interface UseHeroAnimationOptions {
  imgRef: RefObject<HTMLImageElement | null>
}

interface UseHeroAnimationResult {
  revealStage: RevealStage
  glowsActive: boolean
  prefersReducedMotion: boolean
  handleLoad: () => void
}

export function useHeroAnimation({ imgRef }: UseHeroAnimationOptions): UseHeroAnimationResult {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [revealStage, setRevealStage] = useState<RevealStage>('loading')
  const hasPlayedRef = useRef(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [glowsActive, setGlowsActive] = useState(false)

  // Path 1: onLoad fires for fresh image loads (after img.decode())
  const handleLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  // Path 2: Check img.complete on mount for cached/bfcache images
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setImageLoaded(true)
    }
  }, [imgRef])

  // Reduced-motion detection with live toggle support
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)

    const handler = () => setPrefersReducedMotion(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Reveal sequence orchestration
  useEffect(() => {
    if (!imageLoaded || hasPlayedRef.current) return
    hasPlayedRef.current = true

    if (prefersReducedMotion) {
      // Skip animation entirely -- CSS handles visibility via reduced-motion overrides
      setRevealStage('text-reveal')
      return
    }

    // Beat 1: Background blur-to-sharp (immediate)
    setRevealStage('bg-reveal')

    // Beat 2: Text fade-up (after blur transition + pause)
    // 350ms blur transition + 250ms pause = 600ms delay
    const timer = setTimeout(() => {
      setRevealStage('text-reveal')
    }, 600)

    return () => clearTimeout(timer)
  }, [imageLoaded, prefersReducedMotion])

  // Beat 3: Activate glow cascade after text reveal finishes (500ms)
  useEffect(() => {
    if (revealStage !== 'text-reveal' || prefersReducedMotion) return
    const timer = setTimeout(() => setGlowsActive(true), 500)
    return () => clearTimeout(timer)
  }, [revealStage, prefersReducedMotion])

  return { revealStage, glowsActive, prefersReducedMotion, handleLoad }
}
