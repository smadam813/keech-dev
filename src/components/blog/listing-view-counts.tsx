'use client'

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { formatViewCount, setCachedViews } from '@/lib/views'
import { POST_RUNES } from '@/components/runes/rune-config'

const ViewCountsContext = createContext<Record<string, number | null>>({})

export function useViewCount(slug: string): number | null {
  const counts = useContext(ViewCountsContext)
  return counts[slug] ?? null
}

interface ListingViewCountsProps {
  slugs: string[]
  children: React.ReactNode
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

export function ListingViewCounts({ slugs, children }: ListingViewCountsProps) {
  const [counts, setCounts] = useState<Record<string, number | null>>({})

  // Read cached counts via useSyncExternalStore — instant display on return visits
  const getCachedSnapshot = useCallback(() => {
    try {
      const result: Record<string, number> = {}
      let hasAny = false
      for (const slug of slugs) {
        const raw = localStorage.getItem(`views:${slug}`)
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

  // Fetch batch counts from API
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
          setCachedViews(slug, count)
        }
      })
      .catch(() => {
        // View counts are non-critical — fail silently.
        // Cached values (if any) remain displayed.
      })
  }, [slugs])

  const mergedCounts = { ...cachedCounts, ...counts }

  return (
    <ViewCountsContext value={mergedCounts}>
      {children}
    </ViewCountsContext>
  )
}

/**
 * Client component that reads a single slug's view count from ListingViewCounts context.
 * Renders the Jera rune separator and formatted count when available, nothing otherwise.
 */
export function PostCardViewCount({ slug }: { slug: string }) {
  const views = useViewCount(slug)

  if (views == null) return null

  return (
    <>
      <span aria-hidden="true" className="text-accent font-display font-bold">
        {POST_RUNES.separator.char}
      </span>
      <span>{formatViewCount(views)}</span>
    </>
  )
}
