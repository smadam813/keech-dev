export default function BlogPostLoading() {
  return (
    <article className="w-full mx-auto max-w-6xl px-6 pt-12 pb-16">
      {/* Back link skeleton */}
      <div className="h-4 w-32 bg-foreground/5 animate-pulse mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_16rem] gap-12 lg:gap-16">
        <div>
          {/* Header skeleton */}
          <div className="mb-10">
            <div className="h-10 w-3/4 bg-surface border-[3px] border-foreground/10 animate-pulse mb-4" />
            <div className="flex gap-3 mb-4">
              <div className="h-4 w-28 bg-foreground/5 animate-pulse" />
              <div className="h-4 w-20 bg-foreground/5 animate-pulse" />
              <div className="h-4 w-16 bg-foreground/5 animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-foreground/5 animate-pulse rounded" />
              <div className="h-5 w-20 bg-foreground/5 animate-pulse rounded" />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="space-y-4">
            <div className="h-4 w-full bg-foreground/5 animate-pulse" />
            <div className="h-4 w-5/6 bg-foreground/5 animate-pulse" />
            <div className="h-4 w-full bg-foreground/5 animate-pulse" />
            <div className="h-4 w-2/3 bg-foreground/5 animate-pulse" />
            <div className="h-8 w-1/2 bg-surface border-[3px] border-foreground/10 animate-pulse mt-8" />
            <div className="h-4 w-full bg-foreground/5 animate-pulse" />
            <div className="h-4 w-4/5 bg-foreground/5 animate-pulse" />
            <div className="h-4 w-full bg-foreground/5 animate-pulse" />
            <div className="h-4 w-3/4 bg-foreground/5 animate-pulse" />
          </div>
        </div>

        {/* TOC sidebar skeleton */}
        <aside className="hidden lg:block">
          <div className="space-y-3 pt-2">
            <div className="h-4 w-24 bg-foreground/5 animate-pulse" />
            <div className="h-3 w-32 bg-foreground/5 animate-pulse" />
            <div className="h-3 w-28 bg-foreground/5 animate-pulse" />
            <div className="h-3 w-36 bg-foreground/5 animate-pulse" />
            <div className="h-3 w-24 bg-foreground/5 animate-pulse" />
          </div>
        </aside>
      </div>
    </article>
  )
}
