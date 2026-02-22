'use client'

import { useEffect, useRef, useState } from 'react'

interface ViewCounterProps {
  slug: string
}

export function ViewCounter({ slug }: ViewCounterProps) {
  const [views, setViews] = useState<number | null>(null)
  const hasFired = useRef(false)

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
      })
      .catch(() => {
        // View count is non-critical UI — fail silently.
        // Shimmer stays visible; full degradation is Phase 5 scope.
      })
  }, [slug])

  if (views === null) {
    return (
      <span
        className="inline-block w-16 h-5 rounded-sm bg-muted/20 animate-shimmer"
        aria-hidden="true"
      />
    )
  }

  return (
    <span>
      {views.toLocaleString()} {views === 1 ? 'view' : 'views'}
    </span>
  )
}
