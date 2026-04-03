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
      <div className="border-[3px] border-foreground bg-surface p-8 shadow-brutal text-center">
        <h2 className="font-display text-2xl mb-4">
          This post couldn&apos;t be displayed
        </h2>
        <p className="text-muted mb-6">
          Something went wrong while loading this blog post.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="border-[3px] border-foreground bg-white px-6 py-2 font-semibold shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Try Again
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- plain <a> intentional: client-side routing may be broken in error state */}
          <a
            href="/blog"
            className="inline-block border-[3px] border-foreground bg-accent text-white px-6 py-2 font-semibold shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Back to Blog
          </a>
        </div>
      </div>
    </div>
  )
}
