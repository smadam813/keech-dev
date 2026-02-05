import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TagChipProps {
  tag: string
  href?: string
  className?: string
}

export function TagChip({ tag, href, className }: TagChipProps) {
  const chipClasses = cn(
    'inline-block px-2 py-0.5 text-xs font-mono font-bold',
    'border-2 border-black bg-accent/10',
    href && 'hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150',
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
