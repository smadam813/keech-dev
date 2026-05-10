'use client'

import { norse, inter } from '@/lib/fonts'
import { cn } from '@/lib/utils'
import { ErrorPanel } from '@/lib/error-boundary/error-panel'
import './globals.css'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className={cn(norse.variable, inter.variable)}>
      <body className="min-h-dvh flex flex-col" style={{ background: 'var(--color-bg-deep)', color: 'var(--color-ink)' }}>
        <ErrorPanel error={error} reset={reset} navigateTo={{ href: '/', label: 'Go Home' }} fullViewport />
      </body>
    </html>
  )
}
