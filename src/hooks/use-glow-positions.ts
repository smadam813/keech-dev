'use client'

import { useState, useEffect, type RefObject } from 'react'
import { RUNE_GLOWS, computeGlowPositions } from '@/lib/rune-glows'

interface UseGlowPositionsOptions {
  sectionRef: RefObject<HTMLElement | null>
}

export function useGlowPositions({ sectionRef }: UseGlowPositionsOptions): Array<{ left: string; top: string; visible: boolean }> {
  const [positions, setPositions] = useState<Array<{ left: string; top: string; visible: boolean }>>([])

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
  }, [sectionRef])

  return positions
}
