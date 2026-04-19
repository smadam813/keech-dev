'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { RUNE_GLOWS, computeGlowPositions } from '@/lib/rune-glows'

// Fixed full-bleed ambient: hero watermark + color wash + gradient + vignette + rune glows + grain.
// Rune glows align with the runes in hero.webp via object-fit: cover math against the viewport.
export function AmbientBackground() {
  const [viewport, setViewport] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const positions = viewport
    ? computeGlowPositions(RUNE_GLOWS, viewport.w, viewport.h)
    : []

  return (
    <div aria-hidden="true" className="ambient">
      <div className="ambient__art" />
      <div className="ambient__wash" />
      <div className="ambient__gradient" />
      <div className="ambient__vignette" />
      <div className="ambient__runes">
        {viewport && RUNE_GLOWS.map((rune, i) => {
          const pos = positions[i]
          if (!pos?.visible) return null
          return (
            <div
              key={rune.id}
              className={cn('rune-glow', 'rune-glow--ambient', `rune-glow--${rune.color}`)}
              style={{
                left: pos.left,
                top: pos.top,
                width: `${rune.size}rem`,
                height: `${rune.size}rem`,
                '--glow-opacity': 0.4,
                '--breath-duration': rune.breathDuration,
              } as React.CSSProperties}
            />
          )
        })}
      </div>
      <div className="ambient__grain" />
    </div>
  )
}
