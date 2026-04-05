'use client'

import { useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
  isTransitioning: boolean
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

  const [isTransitioning, setIsTransitioning] = useState(false)
  const isInitialRender = useRef(true)

  // Derive a stable key from active filters to detect content changes
  const filteredKey = [...activeFilters].sort().join(',')

  useEffect(() => {
    // Skip fade on initial render (including URL-preloaded filters)
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }
    // Only fade when filters are active and content changes
    if (!isFiltering) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: sync transition flag triggers CSS fade before setTimeout clears it
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 150)
    return () => clearTimeout(timer)
  }, [filteredKey, isFiltering])

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
      window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
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
    isTransitioning,
    filterCounts,
    handleToggle,
    handleClear,
  }
}
