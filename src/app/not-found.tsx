import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="font-display text-6xl md:text-8xl font-bold mb-4">404</h1>
        <p style={{ color: 'var(--color-ink-dim)' }} className="text-xl mb-8">Page not found</p>
        <Link
          href="/"
          className="btn btn--primary"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
