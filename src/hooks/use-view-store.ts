'use client'

import { useSyncExternalStore, useCallback } from 'react'

function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

export function useViewStore(slug: string): number | null {
  const getSnapshot = useCallback(() => {
    try {
      const raw = localStorage.getItem(`views:${slug}`)
      return raw !== null ? Number(raw) : null
    } catch {
      return null
    }
  }, [slug])

  return useSyncExternalStore(subscribeToStorage, getSnapshot, () => null)
}
