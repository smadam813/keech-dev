'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react'

const CACHE_PREFIX = 'views:'

export function formatCount(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? 'view' : 'views'}`
}

function getCached(slug: string): number | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${slug}`)
    return raw !== null ? Number(raw) : null
  } catch {
    return null
  }
}

function setCache(slug: string, count: number): void {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${slug}`, String(count))
  } catch {}
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

export function usePostViewCount(slug: string): number | null {
  const getSnapshot = useCallback(() => getCached(slug), [slug])
  return useSyncExternalStore(subscribeToStorage, getSnapshot, () => null)
}

export function ViewCounter({ slug }: { slug: string }) {
  const cachedViews = usePostViewCount(slug)
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
        setCache(slug, data.views)
      })
      .catch(() => {})
  }, [slug])

  return (
    <span className={views === null && cachedViews === null ? 'inline-block w-12' : undefined}>
      {(views ?? cachedViews) !== null && formatCount((views ?? cachedViews)!)}
    </span>
  )
}

const ViewCountsContext = createContext<Record<string, number | null>>({})

interface ListingViewCountsProps {
  slugs: string[]
  children: React.ReactNode
}

export function ListingViewCounts({ slugs, children }: ListingViewCountsProps) {
  const [counts, setCounts] = useState<Record<string, number | null>>({})

  const getCachedSnapshot = useCallback(() => {
    try {
      const result: Record<string, number> = {}
      let hasAny = false
      for (const slug of slugs) {
        const raw = localStorage.getItem(`${CACHE_PREFIX}${slug}`)
        if (raw !== null) {
          result[slug] = Number(raw)
          hasAny = true
        }
      }
      return hasAny ? JSON.stringify(result) : null
    } catch {
      return null
    }
  }, [slugs])

  const cachedSnapshot = useSyncExternalStore(subscribeToStorage, getCachedSnapshot, () => null)
  const cachedCounts = cachedSnapshot ? JSON.parse(cachedSnapshot) as Record<string, number> : {}

  useEffect(() => {
    if (slugs.length === 0) return

    fetch(`/api/views?slugs=${slugs.join(',')}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Batch view fetch failed: ${res.status}`)
        return res.json()
      })
      .then((data: { counts: Record<string, number> }) => {
        setCounts(data.counts)
        for (const [slug, count] of Object.entries(data.counts)) {
          setCache(slug, count)
        }
      })
      .catch(() => {})
  }, [slugs])

  const mergedCounts = { ...cachedCounts, ...counts }

  return (
    <ViewCountsContext value={mergedCounts}>
      {children}
    </ViewCountsContext>
  )
}

export function PostCardViewCount({ slug }: { slug: string }) {
  const counts = useContext(ViewCountsContext)
  const views = counts[slug] ?? null

  if (views == null) return null

  return <span>{formatCount(views)}</span>
}
