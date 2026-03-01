import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TagChipProps {
  tag: string
  href?: string
  active?: boolean
  onToggle?: () => void
  count?: number
  className?: string
}

export function TagChip({ tag, href, active, onToggle, count, className }: TagChipProps) {
  const baseClasses = 'inline-block px-2 py-0.5 text-xs font-mono font-bold border-2 border-black'

  // Toggle button mode (for filter bar)
  if (onToggle) {
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={onToggle}
        className={cn(
          baseClasses,
          'transition-all duration-150 cursor-pointer',
          active
            ? 'bg-accent text-white shadow-brutal-hover translate-x-[2px] translate-y-[2px]'
            : 'bg-accent/10 shadow-brutal hover:bg-accent/20 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-hover',
          className
        )}
      >
        {tag}
        {count !== undefined && (
          <span className="ml-1 opacity-60">({count})</span>
        )}
      </button>
    )
  }

  // Link mode (existing behavior)
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          baseClasses,
          'bg-accent/10',
          'hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150',
          className
        )}
      >
        {tag}
      </Link>
    )
  }

  // Display-only mode (existing behavior)
  return <span className={cn(baseClasses, 'bg-accent/10', className)}>{tag}</span>
}
