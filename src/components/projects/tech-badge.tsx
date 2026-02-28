import { cn } from '@/lib/utils'

interface TechBadgeProps {
  tech: string
  active?: boolean
  onToggle?: () => void
  className?: string
}

export function TechBadge({ tech, active, onToggle, className }: TechBadgeProps) {
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
        {tech}
      </button>
    )
  }

  // Display-only mode (existing behavior)
  return (
    <span className={cn(baseClasses, 'bg-accent/10', className)}>
      {tech}
    </span>
  )
}
