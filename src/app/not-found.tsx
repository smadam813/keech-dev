import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="font-display text-6xl md:text-8xl font-bold mb-4">404</h1>
        <p className="text-muted text-xl mb-8">Page not found</p>
        <Link
          href="/"
          className="inline-block bg-accent text-white px-6 py-3 border-[3px] border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-display font-semibold"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
