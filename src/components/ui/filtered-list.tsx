'use client'

import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { FilterBar } from '@/components/ui/filter-bar'
import { FilterChip } from '@/components/ui/filter-chip'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { cn } from '@/lib/utils'

function serializeFilters(filters: Set<string>): string | null {
  if (filters.size === 0) return null
  return [...filters].sort().join(',')
}

function parseFilters(value: string | null): Set<string> {
  if (!value) return new Set()
  return new Set(value.split(',').filter(Boolean))
}

interface FilteredListProps<T> {
  items: T[]
  allFilterValues: string[]
  getItemValues: (item: T) => string[]
  paramName: string
  filterLabel: string
  gridClassName: string
  statusFormat: (matched: number, total: number) => string
  emptyMessage: string
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
}

export function FilteredList<T>({
  items,
  allFilterValues,
  getItemValues,
  paramName,
  filterLabel,
  gridClassName,
  statusFormat,
  emptyMessage,
  getKey,
  renderItem,
}: FilteredListProps<T>) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const activeFilters = useMemo(
    () => parseFilters(searchParams.get(paramName)),
    [searchParams, paramName]
  )
  const isFiltering = activeFilters.size > 0

  const filteredItems =
    activeFilters.size === 0
      ? items
      : items.filter((item) =>
          [...activeFilters].every((v) => getItemValues(item).includes(v))
        )

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const value of allFilterValues) {
      counts[value] = items.filter((item) =>
        getItemValues(item).includes(value)
      ).length
    }
    return counts
  }, [items, allFilterValues, getItemValues])

  const [isPending, setIsPending] = useState(false)

  const updateURL = useCallback(
    (next: Set<string>) => {
      const params = new URLSearchParams(searchParams.toString())
      const serialized = serializeFilters(next)
      if (serialized === null) {
        params.delete(paramName)
      } else {
        params.set(paramName, serialized)
      }
      const query = params.toString()
      setIsPending(true)
      window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
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

  return (
    <>
      <div className="tag-bar">
        <FilterBar
          items={allFilterValues}
          activeItems={activeFilters}
          onToggle={handleToggle}
          onClear={handleClear}
          counts={filterCounts}
          renderChip={({ item, active, onToggle, count }) => (
            <FilterChip key={item} label={item} active={active} onToggle={onToggle} count={count} />
          )}
          label={filterLabel}
        />
      </div>
      {isFiltering && (
        <p className="filter-status">
          {statusFormat(filteredItems.length, items.length)}
        </p>
      )}
      {filteredItems.length > 0 ? (
        <div className={cn(
          gridClassName,
          'transition-opacity duration-200 filter-grid-fade',
          isPending ? 'opacity-0' : 'opacity-100'
        )}>
          {filteredItems.map((item) => {
            const key = getKey(item)
            return isFiltering ? (
              <div key={key}>{renderItem(item)}</div>
            ) : (
              <ScrollReveal key={key}>
                {renderItem(item)}
              </ScrollReveal>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="filter-status" style={{ marginBottom: 16 }}>
            {emptyMessage}
          </p>
          <button type="button" onClick={handleClear} className="btn btn--ghost">
            Clear filters
          </button>
        </div>
      )}
    </>
  )
}
