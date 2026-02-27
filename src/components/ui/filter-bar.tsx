'use client'

import { type ReactNode } from 'react'

interface FilterBarProps {
  items: string[]
  activeItems: Set<string>
  onToggle: (item: string) => void
  onClear: () => void
  renderChip: (props: { item: string; active: boolean; onToggle: () => void }) => ReactNode
  label?: string
}

export function FilterBar({
  items,
  activeItems,
  onToggle,
  onClear,
  renderChip,
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
          })
        )}
        {hasActive && (
          <button
            type="button"
            onClick={onClear}
            className="px-2 py-0.5 text-xs font-mono font-bold text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
