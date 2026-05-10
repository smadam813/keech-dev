import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, render, screen, act, waitFor } from '@testing-library/react'

describe('formatCount', () => {
  it('pluralizes zero as views', async () => {
    const { formatCount } = await import('./client')
    expect(formatCount(0)).toBe('0 views')
  })

  it('uses singular for exactly 1', async () => {
    const { formatCount } = await import('./client')
    expect(formatCount(1)).toBe('1 view')
  })

  it('formats large numbers with locale separators', async () => {
    const { formatCount } = await import('./client')
    expect(formatCount(1234)).toBe('1,234 views')
  })

  it('handles very large numbers', async () => {
    const { formatCount } = await import('./client')
    expect(formatCount(1000000)).toBe('1,000,000 views')
  })
})

describe('usePostViewCount', () => {
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

  it('returns null when localStorage has no entry', async () => {
    const { usePostViewCount } = await import('./client')
    const { result } = renderHook(() => usePostViewCount('nonexistent'))
    expect(result.current).toBe(null)
  })

  it('returns cached numeric value', async () => {
    mockStorage.set('views:my-post', '42')
    const { usePostViewCount } = await import('./client')
    const { result } = renderHook(() => usePostViewCount('my-post'))
    expect(result.current).toBe(42)
  })

  it('returns null during SSR', async () => {
    const { usePostViewCount } = await import('./client')
    const { result } = renderHook(() => usePostViewCount('missing'))
    expect(result.current).toBe(null)
  })

  it('returns null when localStorage throws', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => { throw new DOMException('SecurityError') }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(() => null),
    })

    const { usePostViewCount } = await import('./client')
    const { result } = renderHook(() => usePostViewCount('any'))
    expect(result.current).toBe(null)
  })

  it('updates when storage event fires (cross-tab sync)', async () => {
    const { usePostViewCount } = await import('./client')
    const { result } = renderHook(() => usePostViewCount('sync-post'))
    expect(result.current).toBe(null)

    mockStorage.set('views:sync-post', '99')
    act(() => {
      window.dispatchEvent(new StorageEvent('storage'))
    })

    expect(result.current).toBe(99)
  })
})

describe('ViewCounter', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(() => null),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('fires POST and displays returned view count', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ views: 7 }),
    }))

    const { ViewCounter } = await import('./client')
    render(<ViewCounter slug="test-post" />)

    await waitFor(() => {
      expect(screen.getByText('7 views')).toBeDefined()
    })

    expect(fetch).toHaveBeenCalledWith('/api/views/test-post', { method: 'POST' })
  })

  it('caches result in localStorage after POST', async () => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem,
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(() => null),
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ views: 15 }),
    }))

    const { ViewCounter } = await import('./client')
    render(<ViewCounter slug="cached-post" />)

    await waitFor(() => {
      expect(setItem).toHaveBeenCalledWith('views:cached-post', '15')
    })
  })

  it('fails silently on fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const { ViewCounter } = await import('./client')
    const { container } = render(<ViewCounter slug="broken" />)

    await waitFor(() => {
      expect(container.querySelector('span')).toBeDefined()
    })
  })
})

describe('ListingViewCounts + PostCardViewCount', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(() => null),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('fetches batch counts and provides them to PostCardViewCount', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ counts: { 'post-a': 10, 'post-b': 5 } }),
    }))

    const { ListingViewCounts, PostCardViewCount } = await import('./client')
    render(
      <ListingViewCounts slugs={['post-a', 'post-b']}>
        <PostCardViewCount slug="post-a" />
        <PostCardViewCount slug="post-b" />
      </ListingViewCounts>
    )

    await waitFor(() => {
      expect(screen.getByText('10 views')).toBeDefined()
      expect(screen.getByText('5 views')).toBeDefined()
    })

    expect(fetch).toHaveBeenCalledWith('/api/views?slugs=post-a,post-b')
  })

  it('renders nothing for slug with no count', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ counts: {} }),
    }))

    const { ListingViewCounts, PostCardViewCount } = await import('./client')
    const { container } = render(
      <ListingViewCounts slugs={['missing']}>
        <PostCardViewCount slug="missing" />
      </ListingViewCounts>
    )

    await waitFor(() => {
      expect(container.textContent).toBe('')
    })
  })

  it('caches batch results to localStorage', async () => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem,
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(() => null),
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ counts: { 'slug-x': 33 } }),
    }))

    const { ListingViewCounts, PostCardViewCount } = await import('./client')
    render(
      <ListingViewCounts slugs={['slug-x']}>
        <PostCardViewCount slug="slug-x" />
      </ListingViewCounts>
    )

    await waitFor(() => {
      expect(setItem).toHaveBeenCalledWith('views:slug-x', '33')
    })
  })
})
