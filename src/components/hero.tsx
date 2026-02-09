'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import heroImage from '../../public/images/hero.webp'
import { cn } from '@/lib/utils'
import { RUNE_GLOWS, computeGlowPositions } from '@/lib/rune-glows'

// Power curve entrance delays with randomized order (Fisher-Yates shuffle).
// 3000ms total cascade, exponent 1.5 — same feel as original but spatial order varies each load.
function buildShuffledDelays(count: number): string[] {
  const indices = Array.from({ length: count }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices.map((order) => {
    const fraction = count > 1 ? order / (count - 1) : 0
    return `${Math.round(3000 * Math.pow(fraction, 1.5))}ms`
  })
}

export function Hero() {
  const imgRef = useRef<HTMLImageElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [revealStage, setRevealStage] = useState<'loading' | 'bg-reveal' | 'text-reveal'>('loading')
  const hasPlayedRef = useRef(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [glowsActive, setGlowsActive] = useState(false)
  const [positions, setPositions] = useState<Array<{ left: string; top: string; visible: boolean }>>([])
  const entranceDelays = useRef(buildShuffledDelays(RUNE_GLOWS.length))

  // Path 1: onLoad fires for fresh image loads (after img.decode())
  const handleLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  // Path 2: Check img.complete on mount for cached/bfcache images
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setImageLoaded(true)
    }
  }, [])

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

  // ResizeObserver: recalculate glow positions when section resizes
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const update = (w: number, h: number) => {
      setPositions(computeGlowPositions(RUNE_GLOWS, w, h))
    }

    // Initial calculation
    const rect = section.getBoundingClientRect()
    update(rect.width, rect.height)

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const { width, height } = entry.contentRect
        update(width, height)
      }
    })
    ro.observe(section)
    return () => ro.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative flex-1 flex items-center justify-center min-h-[calc(100svh-4rem)] overflow-hidden">
      {/* Background image with load-gated blur reveal */}
      <Image
        ref={imgRef}
        src={heroImage}
        alt=""
        fill
        sizes="100vw"
        preload
        placeholder="blur"
        className={cn(
          'object-cover',
          revealStage === 'loading' && 'hero-bg',
          revealStage === 'bg-reveal' && 'hero-bg hero-bg--revealed',
        )}
        quality={80}
        onLoad={handleLoad}
      />

      {/* Dark gradient scrim for WCAG AA text contrast */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.55) 100%)'
        }}
      />

      {/* Rune glow overlays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {glowsActive && positions.length > 0 && RUNE_GLOWS.map((rune, i) => {
          const pos = positions[i]
          if (!pos?.visible) return null
          return (
            <div
              key={rune.id}
              className={cn(
                'rune-glow',
                `rune-glow--${rune.color}`,
                glowsActive && 'rune-glow--active',
              )}
              style={{
                left: pos.left,
                top: pos.top,
                width: `${rune.size}rem`,
                height: `${rune.size}rem`,
                '--breath-duration': rune.breathDuration,
                '--entrance-delay': entranceDelays.current[i],
              } as React.CSSProperties}
            />
          )
        })}
      </div>

      {/* Centered text overlay with gated animation */}
      <div className={cn(
        'relative z-10 text-center',
        revealStage !== 'text-reveal' && 'hero-text--hidden',
        revealStage === 'text-reveal' && !prefersReducedMotion && 'hero-text--reveal',
      )}>
        <h1 className="font-display font-bold text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-white">
          keech
          <span className="text-accent-light">.dev</span>
        </h1>
      </div>
    </section>
  )
}
