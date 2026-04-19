import Link from 'next/link'
import { cn } from '@/lib/utils'
import { paletteFor } from '@/lib/tag-palette'

interface FilterChipProps {
  label: string
  href?: string
  active?: boolean
  onToggle?: () => void
  count?: number
  className?: string
  variant?: 'default' | 'sm' | 'clear'
}

function chipStyle(label: string, active?: boolean, variant: FilterChipProps['variant'] = 'default') {
  const hue = paletteFor(label)
  const base = {
    '--chip-bg': hue.bg,
    '--chip-fg': hue.fg,
    '--chip-border': hue.border,
  } as React.CSSProperties

  if (active) {
    return {
      ...base,
      backgroundColor: hue.fg,
      color: 'var(--color-bg-deep)',
      borderColor: hue.fg,
    }
  }

  if (variant === 'clear') {
    return {
      backgroundColor: 'transparent',
      color: 'var(--color-ink-dim)',
      borderColor: 'var(--color-hair-strong)',
    }
  }

  return {
    ...base,
    backgroundColor: hue.bg,
    color: hue.fg,
    borderColor: hue.border,
  }
}

export function FilterChip({
  label, href, active, onToggle, count, className, variant = 'default',
}: FilterChipProps) {
  const sizeCls = variant === 'sm' ? 'chip--sm' : ''
  const baseCls = cn(
    'chip inline-flex items-center gap-1 rounded-full border font-mono font-medium',
    'px-3 py-1 text-xs uppercase tracking-[0.08em]',
    'transition-transform transition-colors duration-[160ms]',
    sizeCls,
    className,
  )

  const style = chipStyle(label, active, variant)

  if (onToggle) {
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={onToggle}
        className={cn(baseCls, 'hover:-translate-y-[1px] cursor-pointer')}
        style={style}
      >
        <span>{label}</span>
        {count !== undefined && <span className="opacity-60">({count})</span>}
      </button>
    )
  }

  if (href) {
    return (
      <Link
        href={href}
        className={cn(baseCls, 'hover:-translate-y-[1px]')}
        style={style}
      >
        {label}
      </Link>
    )
  }

  return (
    <span className={baseCls} style={style}>
      {label}
    </span>
  )
}
