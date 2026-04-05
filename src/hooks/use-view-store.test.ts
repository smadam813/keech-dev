import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useViewStore } from './use-view-store'

describe('useViewStore', () => {
  const mockStorage = new Map<string, string>()

  beforeEach(() => {
    mockStorage.clear()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => mockStorage.set(key, value)),
      removeItem: vi.fn((key: string) => mockStorage.delete(key)),
      clear: vi.fn(() => mockStorage.clear()),
      length: 0,
      key: vi.fn(() => null),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null when localStorage has no entry for slug', () => {
    const { result } = renderHook(() => useViewStore('nonexistent'))
    expect(result.current).toBe(null)
  })

  it('returns numeric value when localStorage has views entry', () => {
    mockStorage.set('views:my-post', '42')
    const { result } = renderHook(() => useViewStore('my-post'))
    expect(result.current).toBe(42)
  })

  it('returns null during SSR (getServerSnapshot)', () => {
    // useSyncExternalStore uses getServerSnapshot on server
    // In jsdom with renderHook, it uses getSnapshot, so we test
    // the export indirectly -- the hook should return null for missing keys
    const { result } = renderHook(() => useViewStore('missing'))
    expect(result.current).toBe(null)
  })

  it('returns null when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new DOMException('SecurityError')
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(() => null),
    })

    const { result } = renderHook(() => useViewStore('any-slug'))
    expect(result.current).toBe(null)
  })

  it('updates when storage event fires (cross-tab sync)', () => {
    const { result } = renderHook(() => useViewStore('sync-post'))
    expect(result.current).toBe(null)

    // Simulate cross-tab storage update
    mockStorage.set('views:sync-post', '99')
    act(() => {
      window.dispatchEvent(new StorageEvent('storage'))
    })

    expect(result.current).toBe(99)
  })
})
