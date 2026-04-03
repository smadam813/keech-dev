'use client'

import { norse, inter } from '@/lib/fonts'
import { cn } from '@/lib/utils'
import './globals.css'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('[global]', error)

  return (
    <html lang="en" className={cn(norse.variable, inter.variable)}>
      <body className="min-h-dvh flex flex-col bg-background text-foreground">
        <div className="min-h-dvh flex items-center justify-center px-6">
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
      </body>
    </html>
  )
}
