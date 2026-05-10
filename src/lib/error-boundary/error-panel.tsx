'use client'

import { cn } from '@/lib/utils'
import { classifyError, selectStrategy } from './classify'

interface ErrorPanelProps {
  error: Error & { digest?: string }
  reset: () => void
  navigateTo: { href: string; label: string }
  fullViewport?: boolean
}

export function ErrorPanel({ error, reset, navigateTo, fullViewport }: ErrorPanelProps) {
  console.error(error)

  const category = classifyError(error)
  const strategy = selectStrategy(category)

  return (
    <div className={cn(fullViewport ? 'min-h-dvh' : 'min-h-[calc(100dvh-4rem)]', 'flex items-center justify-center px-6')}>
      <div
        className="text-center p-8"
        style={{
          border: '2px solid var(--color-accent-gold)',
          background: 'var(--color-surface-hi)',
          boxShadow: 'var(--shadow-brutal)',
        }}
      >
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
          {strategy.heading}
        </h2>
        <p style={{ color: 'var(--color-ink-dim)' }} className="text-lg mb-6">
          {strategy.message}
        </p>
        <div className="flex items-center justify-center gap-4">
          {strategy.retryable && (
            <button
              onClick={() => reset()}
              className="btn btn--ghost"
            >
              Try Again
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- plain <a> intentional: client-side routing may be broken in error state */}
          <a
            href={navigateTo.href}
            className="btn btn--primary"
          >
            {navigateTo.label}
          </a>
        </div>
      </div>
    </div>
  )
}
