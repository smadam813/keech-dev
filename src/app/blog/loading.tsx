export default function BlogLoading() {
  return (
    <section className="w-full mx-auto max-w-7xl px-6 pt-12 pb-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-10">Blog</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="border-[3px] border-foreground/10 bg-surface p-6 animate-pulse"
          >
            <div className="h-6 w-3/4 bg-foreground/5 mb-4" />
            <div className="h-4 w-full bg-foreground/5 mb-2" />
            <div className="h-4 w-2/3 bg-foreground/5 mb-4" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-foreground/5 rounded" />
              <div className="h-5 w-12 bg-foreground/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
