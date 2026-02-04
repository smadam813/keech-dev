import { cn } from '@/lib/utils'

interface TechBadgeProps {
  tech: string
  className?: string
}

export function TechBadge({ tech, className }: TechBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 text-xs font-mono font-bold',
        'border-2 border-black bg-accent/10',
        className
      )}
    >
      {tech}
    </span>
  )
}
