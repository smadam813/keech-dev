'use client'

import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react'
import { formatViewCount } from '@/lib/views'
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

export function ListingViewCounts({ slugs, children }: ListingViewCountsProps) {
  const [counts, setCounts] = useState<Record<string, number | null>>({})

  // Read cached counts before paint — instant display on return visits
  useLayoutEffect(() => {
    const cached: Record<string, number | null> = {}
    let hasAny = false
    for (const slug of slugs) {
      const val = getCachedViews(slug)
      if (val !== null) {
        cached[slug] = val
        hasAny = true
      }
    }
    if (hasAny) setCounts(cached)
  }, [slugs])

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

  return (
    <ViewCountsContext value={counts}>
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
