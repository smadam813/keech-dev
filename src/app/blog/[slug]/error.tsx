'use client'

import { ErrorPanel } from '@/lib/error-boundary/error-panel'

export default function BlogPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorPanel error={error} reset={reset} navigateTo={{ href: '/blog', label: 'Back to Blog' }} />
}
