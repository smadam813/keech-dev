import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockRecord, mockRead } = vi.hoisted(() => ({
  mockRecord: vi.fn(),
  mockRead: vi.fn(),
}))

vi.mock('@/lib/post-view-count/server', () => ({
  record: (...args: unknown[]) => mockRecord(...args),
  read: (...args: unknown[]) => mockRead(...args),
  RateLimitError: class RateLimitError extends Error {
    constructor() { super('Rate limit exceeded'); this.name = 'RateLimitError' }
  },
}))

import { GET, POST } from './route'
import { RateLimitError } from '@/lib/post-view-count/server'

const makeParams = (slug: string) => ({ params: Promise.resolve({ slug }) })

describe('GET /api/views/[slug]', () => {
  beforeEach(() => {
    mockRecord.mockReset()
    mockRead.mockReset()
  })

  it('returns views for a valid slug', async () => {
    mockRead.mockResolvedValue({ 'test-post': 42 })

    const request = new NextRequest('http://localhost/api/views/test-post')
    const response = await GET(request, makeParams('test-post'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ slug: 'test-post', views: 42 })
  })

  it('returns 0 views when count is zero', async () => {
    mockRead.mockResolvedValue({ 'test-post': 0 })

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
    mockRead.mockRejectedValue(new Error('Connection refused'))

    const request = new NextRequest('http://localhost/api/views/test-post')
    const response = await GET(request, makeParams('test-post'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to fetch view count' })
  })
})

describe('POST /api/views/[slug]', () => {
  beforeEach(() => {
    mockRecord.mockReset()
    mockRead.mockReset()
  })

  it('increments view count on first visit', async () => {
    mockRecord.mockResolvedValue({ views: 1, deduplicated: false })

    const request = new NextRequest('http://localhost/api/views/test-post', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })
    const response = await POST(request, makeParams('test-post'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ slug: 'test-post', views: 1, deduplicated: false })
    expect(mockRecord).toHaveBeenCalledWith('test-post', '1.2.3.4')
  })

  it('returns current count without incrementing on repeat visit', async () => {
    mockRecord.mockResolvedValue({ views: 42, deduplicated: true })

    const request = new NextRequest('http://localhost/api/views/test-post', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })
    const response = await POST(request, makeParams('test-post'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ slug: 'test-post', views: 42, deduplicated: true })
  })

  it('returns 429 when rate limited', async () => {
    mockRecord.mockRejectedValue(new RateLimitError())

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
    mockRecord.mockRejectedValue(new Error('Connection refused'))

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
