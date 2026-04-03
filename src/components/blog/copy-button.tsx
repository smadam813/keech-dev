'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  getText: () => string
  className?: string
}

export function CopyButton({ getText, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = getText()
    if (text) {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'absolute right-2 top-2 p-2 rounded border-2 border-black bg-surface',
        'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity',
        'hover:bg-accent hover:text-background',
        className
      )}
      aria-label={copied ? 'Copied!' : 'Copy code'}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}
