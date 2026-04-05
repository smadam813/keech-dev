'use client'

import { useRef, useMemo } from 'react'
import Image from 'next/image'
import heroImage from '../../public/images/hero.webp'
import { cn } from '@/lib/utils'
import { RUNE_GLOWS } from '@/lib/rune-glows'
import { useHeroAnimation } from '@/hooks/use-hero-animation'
import { useGlowPositions } from '@/hooks/use-glow-positions'

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
  const entranceDelays = useMemo(() => buildShuffledDelays(RUNE_GLOWS.length), [])

  const { revealStage, glowsActive, prefersReducedMotion, handleLoad } = useHeroAnimation({ imgRef })
  const positions = useGlowPositions({ sectionRef })

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
                '--entrance-delay': entranceDelays[i],
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
