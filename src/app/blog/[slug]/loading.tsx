export default function BlogPostLoading() {
  return (
    <article className="w-full mx-auto max-w-6xl px-6 pt-12 pb-16">
      {/* Back link skeleton */}
      <div
        className="h-4 w-32 animate-pulse mb-8"
        style={{ background: 'var(--color-ink-fade)' }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_16rem] gap-12 lg:gap-16">
        <div>
          {/* Header skeleton */}
          <div className="mb-10">
            <div
              className="h-10 w-3/4 animate-pulse mb-4"
              style={{
                background: 'var(--color-surface-hi)',
                border: '2px solid var(--color-accent-gold)',
                boxShadow: 'var(--shadow-brutal)',
                borderRadius: 4,
                opacity: 0.4,
              }}
            />
            <div className="flex gap-3 mb-4">
              <div className="h-4 w-28 animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
              <div className="h-4 w-20 animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
              <div className="h-4 w-16 animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
            </div>
            <div className="flex gap-2">
              <div className="h-5 w-16 animate-pulse rounded" style={{ background: 'var(--color-ink-fade)' }} />
              <div className="h-5 w-20 animate-pulse rounded" style={{ background: 'var(--color-ink-fade)' }} />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="space-y-4">
            <div className="h-4 w-full animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
            <div className="h-4 w-5/6 animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
            <div className="h-4 w-full animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
            <div className="h-4 w-2/3 animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
            <div
              className="h-8 w-1/2 animate-pulse mt-8"
              style={{
                background: 'var(--color-surface-hi)',
                border: '2px solid var(--color-accent-gold)',
                boxShadow: 'var(--shadow-brutal)',
                borderRadius: 4,
                opacity: 0.4,
              }}
            />
            <div className="h-4 w-full animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
            <div className="h-4 w-4/5 animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
            <div className="h-4 w-full animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
            <div className="h-4 w-3/4 animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
          </div>
        </div>

        {/* TOC sidebar skeleton */}
        <aside className="hidden lg:block">
          <div className="space-y-3 pt-2">
            <div className="h-4 w-24 animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
            <div className="h-3 w-32 animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
            <div className="h-3 w-28 animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
            <div className="h-3 w-36 animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
            <div className="h-3 w-24 animate-pulse" style={{ background: 'var(--color-ink-fade)' }} />
          </div>
        </aside>
      </div>
    </article>
  )
}
