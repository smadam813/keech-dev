'use client'

import { useEffect, useRef, useState } from 'react'
import { formatViewCount, setCachedViews } from '@/lib/views'
import { useViewStore } from '@/hooks/use-view-store'

interface ViewCounterProps {
  slug: string
}

export function ViewCounter({ slug }: ViewCounterProps) {
  const cachedViews = useViewStore(slug)
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
        setCachedViews(slug, data.views)
      })
      .catch(() => {
        // View count is non-critical UI — fail silently.
        // Cached value (if any) remains displayed.
      })
  }, [slug])

  return (
    <span className={views === null && cachedViews === null ? 'inline-block w-12' : undefined}>
      {(views ?? cachedViews) !== null && formatViewCount((views ?? cachedViews)!)}
    </span>
  )
}
