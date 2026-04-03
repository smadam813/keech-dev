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
      <div className="border-[3px] border-foreground bg-surface p-8 shadow-brutal text-center">
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
          Something went wrong
        </h2>
        <p className="text-muted text-lg mb-6">An unexpected error occurred.</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="border-[3px] border-foreground bg-white px-6 py-2 font-semibold shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-block border-[3px] border-foreground bg-accent text-white px-6 py-2 font-semibold shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
