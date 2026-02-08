import { ELDER_FUTHARK, type Rune } from './rune-config'
import { cn } from '@/lib/utils'

interface RuneDividerProps {
  rune?: Rune
  className?: string
}

export function RuneDivider({
  rune = ELDER_FUTHARK.dagaz,
  className,
}: RuneDividerProps) {
  return (
    <div
      className={cn('flex items-center gap-4 my-8', className)}
      role="separator"
    >
      <div className="flex-1 h-[2px] bg-foreground" />
      <span
        aria-hidden="true"
        className="font-display font-bold text-2xl text-accent select-none leading-none"
      >
        {rune.char}
      </span>
      <div className="flex-1 h-[2px] bg-foreground" />
    </div>
  )
}
