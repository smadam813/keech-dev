import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockRead } = vi.hoisted(() => ({
  mockRead: vi.fn(),
}))

vi.mock('@/lib/post-view-count/server', () => ({
  read: (...args: unknown[]) => mockRead(...args),
}))

import { GET } from './route'

describe('GET /api/views', () => {
  beforeEach(() => {
    mockRead.mockReset()
  })

  it('returns empty counts for empty slugs param', async () => {
    const request = new Request('http://localhost/api/views?slugs=')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ counts: {} })
    expect(mockRead).not.toHaveBeenCalled()
  })

  it('returns counts for valid slugs', async () => {
    mockRead.mockResolvedValue({ 'post-a': 10, 'post-b': 5 })

    const request = new Request('http://localhost/api/views?slugs=post-a,post-b')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ counts: { 'post-a': 10, 'post-b': 5 } })
    expect(mockRead).toHaveBeenCalledWith(['post-a', 'post-b'])
  })

  it('defaults null redis values to 0 (handled by module)', async () => {
    mockRead.mockResolvedValue({ 'has-views': 42, 'no-views': 0 })

    const request = new Request('http://localhost/api/views?slugs=has-views,no-views')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ counts: { 'has-views': 42, 'no-views': 0 } })
  })

  it('returns 400 for invalid slug format', async () => {
    const request = new Request('http://localhost/api/views?slugs=INVALID!')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Invalid slug parameter' })
  })

  it('returns 400 when batch limit exceeded', async () => {
    const slugs = Array.from({ length: 21 }, (_, i) => `slug-${i}`).join(',')
    const request = new Request(`http://localhost/api/views?slugs=${slugs}`)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Maximum 20 slugs')
  })

  it('returns 500 on Redis error', async () => {
    mockRead.mockRejectedValue(new Error('Connection refused'))

    const request = new Request('http://localhost/api/views?slugs=test-post')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to fetch view counts' })
  })
})
