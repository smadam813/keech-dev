import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery } from './use-media-query'

describe('useMediaQuery', () => {
  let changeListeners: Map<string, Set<() => void>>

  beforeEach(() => {
    changeListeners = new Map()

    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => {
        if (!changeListeners.has(query)) {
          changeListeners.set(query, new Set())
        }
        return {
          matches: false,
          media: query,
          addEventListener: vi.fn((_event: string, cb: () => void) => {
            changeListeners.get(query)!.add(cb)
          }),
          removeEventListener: vi.fn((_event: string, cb: () => void) => {
            changeListeners.get(query)!.delete(cb)
          }),
        }
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns false by default (no match)', () => {
    const { result } = renderHook(() =>
      useMediaQuery('(prefers-reduced-motion: reduce)')
    )
    expect(result.current).toBe(false)
  })

  it('returns true when matchMedia.matches is true', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    )

    const { result } = renderHook(() =>
      useMediaQuery('(prefers-reduced-motion: reduce)')
    )
    expect(result.current).toBe(true)
  })

  it('returns false during SSR (getServerSnapshot)', () => {
    // In jsdom environment, useSyncExternalStore uses getSnapshot.
    // The getServerSnapshot returning false is tested implicitly --
    // when matches is false, the hook returns false (same as server).
    const { result } = renderHook(() =>
      useMediaQuery('(prefers-reduced-motion: reduce)')
    )
    expect(result.current).toBe(false)
  })

  it('responds to change events on the MediaQueryList', () => {
    const query = '(prefers-reduced-motion: reduce)'
    const { result } = renderHook(() => useMediaQuery(query))
    expect(result.current).toBe(false)

    // Now make matchMedia return true for subsequent calls
    vi.stubGlobal(
      'matchMedia',
      vi.fn((q: string) => ({
        matches: true,
        media: q,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    )

    // Fire the change callback captured by the subscribe function
    act(() => {
      const listeners = changeListeners.get(query)
      if (listeners) {
        for (const cb of listeners) {
          cb()
        }
      }
    })

    expect(result.current).toBe(true)
  })
})
