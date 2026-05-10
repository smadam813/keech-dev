'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react'

const CACHE_PREFIX = 'views:'

function formatCount(count: number): string {
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

function usePostViewCount(slug: string): number | null {
  const getSnapshot = useCallback(() => getCached(slug), [slug])
  return useSyncExternalStore(subscribeToStorage, getSnapshot, () => null)
}

const NO_PROVIDER = Symbol('no-provider')
type ContextValue = Record<string, number | null> | typeof NO_PROVIDER
const ViewCountsContext = createContext<ContextValue>(NO_PROVIDER)

interface ViewCountProviderProps {
  slugs: string[]
  children: React.ReactNode
}

export function ViewCountProvider({ slugs, children }: ViewCountProviderProps) {
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

interface PostViewCountProps {
  slug: string
  record?: boolean
}

export function PostViewCount({ slug, record }: PostViewCountProps) {
  const context = useContext(ViewCountsContext)

  if (context === NO_PROVIDER) {
    return <StandaloneCounter slug={slug} record={record} />
  }

  return <ContextConsumer slug={slug} counts={context} />
}

function ContextConsumer({ slug, counts }: { slug: string; counts: Record<string, number | null> }) {
  const views = counts[slug] ?? null
  if (views == null) return null
  return <span>{formatCount(views)}</span>
}

function StandaloneCounter({ slug, record }: { slug: string; record?: boolean }) {
  const cachedViews = usePostViewCount(slug)
  const [views, setViews] = useState<number | null>(null)
  const hasFired = useRef(false)

  useEffect(() => {
    if (hasFired.current) return
    hasFired.current = true

    fetch(`/api/views/${slug}`, record ? { method: 'POST' } : undefined)
      .then((res) => {
        if (!res.ok) throw new Error(`View count failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setViews(data.views)
        setCache(slug, data.views)
      })
      .catch(() => {})
  }, [slug, record])

  const displayCount = views ?? cachedViews

  return (
    <span className={displayCount === null ? 'inline-block w-12' : undefined}>
      {displayCount !== null && formatCount(displayCount)}
    </span>
  )
}
