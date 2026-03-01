'use client'

import { type ReactNode } from 'react'

interface FilterBarProps {
  items: string[]
  activeItems: Set<string>
  onToggle: (item: string) => void
  onClear: () => void
  renderChip: (props: { item: string; active: boolean; onToggle: () => void; count?: number }) => ReactNode
  counts?: Record<string, number>
  label?: string
}

export function FilterBar({
  items,
  activeItems,
  onToggle,
  onClear,
  renderChip,
  counts,
  label = 'Filters',
}: FilterBarProps) {
  const hasActive = activeItems.size > 0

  return (
    <div role="group" aria-label={label} className="mb-6">
      <div className="flex flex-wrap gap-2 items-center">
        {items.map((item) =>
          renderChip({
            item,
            active: activeItems.has(item),
            onToggle: () => onToggle(item),
            count: counts?.[item],
          })
        )}
        {hasActive && (
          <button
            type="button"
            onClick={onClear}
            className="px-2 py-0.5 text-xs font-mono font-bold border-2 border-black bg-white shadow-brutal hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
