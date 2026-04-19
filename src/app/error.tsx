'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('[app]', error)

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-6">
      <div
        className="text-center p-8"
        style={{
          border: '2px solid var(--color-accent-gold)',
          background: 'var(--color-surface-hi)',
          boxShadow: 'var(--shadow-brutal)',
        }}
      >
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
          Something went wrong
        </h2>
        <p style={{ color: 'var(--color-ink-dim)' }} className="text-lg mb-6">An unexpected error occurred.</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="btn btn--ghost"
          >
            Try Again
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- plain <a> intentional: client-side routing may be broken in error state */}
          <a
            href="/"
            className="btn btn--primary"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
