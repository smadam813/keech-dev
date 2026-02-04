import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TagChipProps {
  tag: string
  href?: string
  className?: string
}

export function TagChip({ tag, href, className }: TagChipProps) {
  const chipClasses = cn(
    'inline-block px-3 py-1 text-sm font-bold',
    'border-[3px] border-black bg-surface',
    'hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px]',
    'transition-all duration-150',
    className
  )

  if (href) {
    return (
      <Link href={href} className={chipClasses}>
        {tag}
      </Link>
    )
  }

  return <span className={chipClasses}>{tag}</span>
}
