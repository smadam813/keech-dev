'use client'

import { useRef, useState, useEffect, useCallback, type RefObject } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'

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
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [glowsActive, setGlowsActive] = useState(false)

  // Path 1: onLoad fires for fresh image loads (after img.decode())
  const handleLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  // Path 2: Check img.complete on mount for cached/bfcache images
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync with browser image cache: imgRef.current.complete is an external DOM property read on mount
      setImageLoaded(true)
    }
  }, [imgRef])

  // Reveal sequence orchestration
  useEffect(() => {
    if (!imageLoaded || hasPlayedRef.current) return
    hasPlayedRef.current = true

    if (prefersReducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Skip animation: instantly show content when user prefers reduced motion
      setRevealStage('text-reveal')
      return
    }

    // Intentional animation orchestration: reveal sequence uses sequential setState
    // with setTimeout delays to coordinate CSS transitions. Not derivable state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRevealStage('bg-reveal')

    // Beat 2: Text fade-up (after blur transition + pause)
    // 350ms blur transition + 250ms pause = 600ms delay
    const timer = setTimeout(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
