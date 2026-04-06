import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockGet = vi.fn()
const mockSet = vi.fn()
const mockIncr = vi.fn()
const mockRateLimit = vi.fn()

vi.mock('@/lib/redis', () => ({
  redis: {
    get: (...args: unknown[]) => mockGet(...args),
    set: (...args: unknown[]) => mockSet(...args),
    incr: (...args: unknown[]) => mockIncr(...args),
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  viewsRateLimit: {
    limit: (...args: unknown[]) => mockRateLimit(...args),
  },
}))

import { GET, POST } from './route'

const makeParams = (slug: string) => ({ params: Promise.resolve({ slug }) })

describe('GET /api/views/[slug] (TEST-02)', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockSet.mockReset()
    mockIncr.mockReset()
    mockRateLimit.mockReset()
  })

  it('returns views for a valid slug', async () => {
    mockGet.mockResolvedValue(42)

    const request = new NextRequest('http://localhost/api/views/test-post')
    const response = await GET(request, makeParams('test-post'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ slug: 'test-post', views: 42 })
  })

  it('returns 0 views when redis value is null', async () => {
    mockGet.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/views/test-post')
    const response = await GET(request, makeParams('test-post'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ slug: 'test-post', views: 0 })
  })

  it('returns 400 for invalid slug', async () => {
    const request = new NextRequest('http://localhost/api/views/INVALID!')
    const response = await GET(request, makeParams('INVALID!'))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Invalid slug' })
  })

  it('returns 500 on Redis error', async () => {
    mockGet.mockRejectedValue(new Error('Connection refused'))

    const request = new NextRequest('http://localhost/api/views/test-post')
    const response = await GET(request, makeParams('test-post'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to fetch view count' })
  })
})

describe('POST /api/views/[slug] (TEST-02)', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockSet.mockReset()
    mockIncr.mockReset()
    mockRateLimit.mockReset()
  })

  it('increments view count on first visit', async () => {
    mockRateLimit.mockResolvedValue({ success: true })
    mockSet.mockResolvedValue('OK')
    mockIncr.mockResolvedValue(1)

    const request = new NextRequest('http://localhost/api/views/test-post', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })
    const response = await POST(request, makeParams('test-post'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ slug: 'test-post', views: 1, deduplicated: false })
    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining('dedup:test-post:'),
      '1',
      { ex: 86400, nx: true }
    )
    expect(mockIncr).toHaveBeenCalledWith('views:test-post')
  })

  it('returns current count without incrementing on repeat visit', async () => {
    mockRateLimit.mockResolvedValue({ success: true })
    mockSet.mockResolvedValue(null)
    mockGet.mockResolvedValue(42)

    const request = new NextRequest('http://localhost/api/views/test-post', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })
    const response = await POST(request, makeParams('test-post'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ slug: 'test-post', views: 42, deduplicated: true })
    expect(mockIncr).not.toHaveBeenCalled()
  })

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockResolvedValue({ success: false })

    const request = new NextRequest('http://localhost/api/views/test-post', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })
    const response = await POST(request, makeParams('test-post'))
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data).toEqual({ error: 'Too many requests' })
  })

  it('returns 400 for invalid slug on POST', async () => {
    const request = new NextRequest('http://localhost/api/views/INVALID!', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })
    const response = await POST(request, makeParams('INVALID!'))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Invalid slug' })
  })

  it('returns 500 on Redis error in POST', async () => {
    mockRateLimit.mockResolvedValue({ success: true })
    mockSet.mockRejectedValue(new Error('Connection refused'))

    const request = new NextRequest('http://localhost/api/views/test-post', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })
    const response = await POST(request, makeParams('test-post'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to increment view count' })
  })
})
