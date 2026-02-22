'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { formatViewCount } from '@/lib/views'

interface ViewCounterProps {
  slug: string
}

function getCachedViews(slug: string): number | null {
  try {
    const raw = localStorage.getItem(`views:${slug}`)
    return raw !== null ? Number(raw) : null
  } catch {
    return null
  }
}

function setCachedViews(slug: string, count: number) {
  try {
    localStorage.setItem(`views:${slug}`, String(count))
  } catch {
    // Storage full or unavailable — non-critical
  }
}

export function ViewCounter({ slug }: ViewCounterProps) {
  const [views, setViews] = useState<number | null>(null)
  const hasFired = useRef(false)

  // Read cached count before paint — prevents flash on repeat visits
  useLayoutEffect(() => {
    const cached = getCachedViews(slug)
    if (cached !== null) setViews(cached)
  }, [slug])

  useEffect(() => {
    if (hasFired.current) return
    hasFired.current = true

    fetch(`/api/views/${slug}`, { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error(`View count failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setViews(data.views)
        setCachedViews(slug, data.views)
      })
      .catch(() => {
        // View count is non-critical UI — fail silently.
        // Cached value (if any) remains displayed.
      })
  }, [slug])

  return (
    <span className={views === null ? 'inline-block w-12' : undefined}>
      {views !== null && formatViewCount(views)}
    </span>
  )
}
