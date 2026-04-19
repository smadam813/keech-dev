'use client'

export default function BlogPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('[blog-post]', error)

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
        <h2 className="font-display text-2xl mb-4">
          This post couldn&apos;t be displayed
        </h2>
        <p style={{ color: 'var(--color-ink-dim)' }} className="mb-6">
          Something went wrong while loading this blog post.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="btn btn--ghost"
          >
            Try Again
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- plain <a> intentional: client-side routing may be broken in error state */}
          <a
            href="/blog"
            className="btn btn--primary"
          >
            Back to Blog
          </a>
        </div>
      </div>
    </div>
  )
}
