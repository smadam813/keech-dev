export default function BlogLoading() {
  return (
    <section className="w-full mx-auto max-w-7xl px-6 pt-12 pb-16">
      <div
        className="h-12 w-32 animate-pulse mb-10"
        style={{
          background: 'var(--color-ink-fade)',
        }}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-6 animate-pulse"
            style={{
              border: '2px solid var(--color-accent-gold)',
              background: 'var(--color-surface-hi)',
              boxShadow: 'var(--shadow-brutal)',
              borderRadius: 4,
              opacity: 0.4,
            }}
          >
            <div className="h-6 w-3/4 mb-4" style={{ background: 'var(--color-ink-fade)' }} />
            <div className="h-4 w-full mb-2" style={{ background: 'var(--color-ink-fade)' }} />
            <div className="h-4 w-2/3 mb-4" style={{ background: 'var(--color-ink-fade)' }} />
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded" style={{ background: 'var(--color-ink-fade)' }} />
              <div className="h-5 w-12 rounded" style={{ background: 'var(--color-ink-fade)' }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
