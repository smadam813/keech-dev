'use client'

import { ErrorPanel } from '@/lib/error-boundary/error-panel'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorPanel error={error} reset={reset} navigateTo={{ href: '/', label: 'Go Home' }} />
}
