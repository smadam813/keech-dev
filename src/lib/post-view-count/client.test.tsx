import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

function mockLocalStorage() {
  const mockStorage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => mockStorage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => mockStorage.set(key, value)),
    removeItem: vi.fn((key: string) => mockStorage.delete(key)),
    clear: vi.fn(() => mockStorage.clear()),
    length: 0,
    key: vi.fn(() => null),
  })
  return mockStorage
}

describe('PostViewCount', () => {
  beforeEach(() => {
    mockLocalStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('fetches independently when no provider is present', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ slug: 'solo', views: 42 }),
    }))

    const { PostViewCount } = await import('./client')
    render(<PostViewCount slug="solo" />)

    await waitFor(() => {
      expect(screen.getByText('42 views')).toBeDefined()
    })

    expect(fetch).toHaveBeenCalledWith('/api/views/solo', undefined)
  })

  it('reads from ViewCountProvider context when present', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ counts: { 'ctx-post': 99 } }),
    }))

    const { ViewCountProvider, PostViewCount } = await import('./client')
    render(
      <ViewCountProvider slugs={['ctx-post']}>
        <PostViewCount slug="ctx-post" />
      </ViewCountProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('99 views')).toBeDefined()
    })
  })

  it('records a view via POST when record prop is true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ views: 7 }),
    }))

    const { PostViewCount } = await import('./client')
    render(<PostViewCount slug="detail-post" record />)

    await waitFor(() => {
      expect(screen.getByText('7 views')).toBeDefined()
    })

    expect(fetch).toHaveBeenCalledWith('/api/views/detail-post', { method: 'POST' })
  })

  it('caches result in localStorage after fetch', async () => {
    const storage = mockLocalStorage()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ slug: 'cached', views: 15 }),
    }))

    const { PostViewCount } = await import('./client')
    render(<PostViewCount slug="cached" />)

    await waitFor(() => {
      expect(storage.get('views:cached')).toBe('15')
    })
  })

  it('shows cached value while fetching', async () => {
    const storage = mockLocalStorage()
    storage.set('views:warm', '50')

    let resolveJson: (v: unknown) => void
    const jsonPromise = new Promise(r => { resolveJson = r })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => jsonPromise,
    }))

    const { PostViewCount } = await import('./client')
    render(<PostViewCount slug="warm" />)

    expect(screen.getByText('50 views')).toBeDefined()

    resolveJson!({ slug: 'warm', views: 55 })
    await waitFor(() => {
      expect(screen.getByText('55 views')).toBeDefined()
    })
  })

  it('fails silently on fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const { PostViewCount } = await import('./client')
    const { container } = render(<PostViewCount slug="broken" />)

    await waitFor(() => {
      expect(container.querySelector('span')).toBeDefined()
    })
  })

  it('renders placeholder width when no count available', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(() => {})))

    const { PostViewCount } = await import('./client')
    const { container } = render(<PostViewCount slug="loading" />)

    const span = container.querySelector('span')
    expect(span?.className).toContain('w-12')
  })

  it('renders singular for exactly 1 view', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ slug: 'one', views: 1 }),
    }))

    const { PostViewCount } = await import('./client')
    render(<PostViewCount slug="one" />)

    await waitFor(() => {
      expect(screen.getByText('1 view')).toBeDefined()
    })
  })
})

describe('ViewCountProvider', () => {
  beforeEach(() => {
    mockLocalStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('batch-fetches counts and provides them to PostViewCount children', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ counts: { 'post-a': 10, 'post-b': 5 } }),
    }))

    const { ViewCountProvider, PostViewCount } = await import('./client')
    render(
      <ViewCountProvider slugs={['post-a', 'post-b']}>
        <PostViewCount slug="post-a" />
        <PostViewCount slug="post-b" />
      </ViewCountProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('10 views')).toBeDefined()
      expect(screen.getByText('5 views')).toBeDefined()
    })

    expect(fetch).toHaveBeenCalledWith('/api/views?slugs=post-a,post-b')
  })

  it('renders nothing for slug with no count in context', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ counts: {} }),
    }))

    const { ViewCountProvider, PostViewCount } = await import('./client')
    const { container } = render(
      <ViewCountProvider slugs={['missing']}>
        <PostViewCount slug="missing" />
      </ViewCountProvider>
    )

    await waitFor(() => {
      expect(container.textContent).toBe('')
    })
  })

  it('caches batch results to localStorage', async () => {
    const storage = mockLocalStorage()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ counts: { 'slug-x': 33 } }),
    }))

    const { ViewCountProvider, PostViewCount } = await import('./client')
    render(
      <ViewCountProvider slugs={['slug-x']}>
        <PostViewCount slug="slug-x" />
      </ViewCountProvider>
    )

    await waitFor(() => {
      expect(storage.get('views:slug-x')).toBe('33')
    })
  })

  it('shows cached values from localStorage while batch-fetching', async () => {
    const storage = mockLocalStorage()
    storage.set('views:cached-slug', '77')

    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(() => {})))

    const { ViewCountProvider, PostViewCount } = await import('./client')
    render(
      <ViewCountProvider slugs={['cached-slug']}>
        <PostViewCount slug="cached-slug" />
      </ViewCountProvider>
    )

    expect(screen.getByText('77 views')).toBeDefined()
  })
})
