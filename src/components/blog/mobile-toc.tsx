'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TocList } from '@/components/blog/toc'
import type { TocEntry } from '@/components/blog/toc'

interface MobileTocProps {
  entries: TocEntry[]
}

export function MobileToc({ entries }: MobileTocProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (entries.length === 0) {
    return null
  }

  return (
    <div className="lg:hidden mb-8">
      <div className={cn(
        'border-[3px] border-foreground shadow-brutal bg-surface',
      )}>
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="mobile-toc-content"
          className={cn(
            'w-full flex items-center justify-between px-4 py-3',
            'font-display font-bold text-lg',
            'text-foreground hover:text-accent transition-colors',
          )}
        >
          <span>Contents</span>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-accent transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>

        <div
          id="mobile-toc-content"
          role="region"
          aria-label="Table of contents"
          className={cn(
            'overflow-hidden transition-[max-height] duration-200 ease-in-out',
            isOpen ? 'max-h-[70vh]' : 'max-h-0',
          )}
        >
          <div className="px-4 pb-4 overflow-auto max-h-[60vh]">
            <TocList entries={entries} />
          </div>
        </div>
      </div>
    </div>
  )
}
