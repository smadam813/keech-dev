'use client'

import { useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

interface UseFilteredListOptions<T> {
  items: T[]
  allFilterValues: string[]
  getItemValues: (item: T) => string[]
  paramName: string
}

interface UseFilteredListResult<T> {
  filteredItems: T[]
  activeFilters: Set<string>
  isFiltering: boolean
  isPending: boolean
  filterCounts: Record<string, number>
  handleToggle: (value: string) => void
  handleClear: () => void
}

export function useFilteredList<T>(options: UseFilteredListOptions<T>): UseFilteredListResult<T> {
  const { items, allFilterValues, getItemValues, paramName } = options
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Read filter state from URL
  const activeFilters = useMemo(
    () => new Set(searchParams.get(paramName)?.split(',').filter(Boolean) ?? []),
    [searchParams, paramName]
  )

  const isFiltering = activeFilters.size > 0

  // AND logic: items must contain ALL selected filter values
  const filteredItems =
    activeFilters.size === 0
      ? items
      : items.filter((item) =>
          [...activeFilters].every((v) => getItemValues(item).includes(v))
        )

  // Static counts: total items per filter value (not contextual to active filters)
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const value of allFilterValues) {
      counts[value] = items.filter((item) => getItemValues(item).includes(value)).length
    }
    return counts
  }, [items, allFilterValues, getItemValues])

  const [isPending, setIsPending] = useState(false)

  // Write new filter set to URL via replaceState (no server re-render)
  const updateURL = useCallback(
    (next: Set<string>) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next.size === 0) {
        params.delete(paramName)
      } else {
        params.set(paramName, [...next].sort().join(','))
      }
      const query = params.toString()
      // Set isPending synchronously — React batches this with the searchParams
      // re-render from replaceState, so new content renders at opacity-0
      setIsPending(true)
      window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
      // After paint, fade new content in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsPending(false)
        })
      })
    },
    [searchParams, pathname, paramName]
  )

  const handleToggle = useCallback(
    (value: string) => {
      const next = new Set(activeFilters)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      updateURL(next)
    },
    [activeFilters, updateURL]
  )

  const handleClear = useCallback(() => {
    updateURL(new Set())
  }, [updateURL])

  return {
    filteredItems,
    activeFilters,
    isFiltering,
    isPending,
    filterCounts,
    handleToggle,
    handleClear,
  }
}
