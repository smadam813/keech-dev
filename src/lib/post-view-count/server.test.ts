import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGet, mockSet, mockIncr, mockMget, mockRateLimit } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockIncr: vi.fn(),
  mockMget: vi.fn(),
  mockRateLimit: vi.fn(),
}))

vi.mock('@/lib/redis', () => ({
  redis: {
    get: (...args: unknown[]) => mockGet(...args),
    set: (...args: unknown[]) => mockSet(...args),
    incr: (...args: unknown[]) => mockIncr(...args),
    mget: (...args: unknown[]) => mockMget(...args),
  },
}))

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    limit = mockRateLimit
    static slidingWindow() { return {} }
  },
}))

import { record, read, RateLimitError } from './server'

describe('PostViewCount.record', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockSet.mockReset()
    mockIncr.mockReset()
    mockMget.mockReset()
    mockRateLimit.mockReset()
  })

  it('increments on first visit and returns deduplicated: false', async () => {
    mockRateLimit.mockResolvedValue({ success: true })
    mockSet.mockResolvedValue('OK')
    mockIncr.mockResolvedValue(1)

    const result = await record('test-post', '1.2.3.4')

    expect(result).toEqual({ views: 1, deduplicated: false })
    expect(mockSet).toHaveBeenCalledWith(
      expect.stringMatching(/^dedup:test-post:[a-f0-9]{64}$/),
      '1',
      { ex: 86400, nx: true }
    )
    expect(mockIncr).toHaveBeenCalledWith('views:test-post')
  })

  it('returns current count without incrementing on repeat visit', async () => {
    mockRateLimit.mockResolvedValue({ success: true })
    mockSet.mockResolvedValue(null)
    mockGet.mockResolvedValue(42)

    const result = await record('test-post', '1.2.3.4')

    expect(result).toEqual({ views: 42, deduplicated: true })
    expect(mockIncr).not.toHaveBeenCalled()
  })

  it('throws RateLimitError when rate limited', async () => {
    mockRateLimit.mockResolvedValue({ success: false })

    await expect(record('test-post', '1.2.3.4')).rejects.toThrow(RateLimitError)
  })

  it('propagates Redis errors', async () => {
    mockRateLimit.mockResolvedValue({ success: true })
    mockSet.mockRejectedValue(new Error('Connection refused'))

    await expect(record('test-post', '1.2.3.4')).rejects.toThrow('Connection refused')
  })

  it('uses consistent IP hashing for dedup keys', async () => {
    mockRateLimit.mockResolvedValue({ success: true })
    mockSet.mockResolvedValue('OK')
    mockIncr.mockResolvedValue(1)

    await record('slug-a', '10.0.0.1')
    const firstKey = mockSet.mock.calls[0][0]

    mockSet.mockClear()
    mockIncr.mockClear()
    await record('slug-a', '10.0.0.1')
    const secondKey = mockSet.mock.calls[0][0]

    expect(firstKey).toBe(secondKey)
  })
})

describe('PostViewCount.read', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockMget.mockReset()
  })

  it('returns count for a single slug', async () => {
    mockMget.mockResolvedValue([42])

    const result = await read('test-post')
    expect(result).toEqual({ 'test-post': 42 })
    expect(mockMget).toHaveBeenCalledWith('views:test-post')
  })

  it('returns counts for multiple slugs', async () => {
    mockMget.mockResolvedValue([10, 5])

    const result = await read(['post-a', 'post-b'])
    expect(result).toEqual({ 'post-a': 10, 'post-b': 5 })
    expect(mockMget).toHaveBeenCalledWith('views:post-a', 'views:post-b')
  })

  it('defaults null values to 0', async () => {
    mockMget.mockResolvedValue([42, null])

    const result = await read(['has-views', 'no-views'])
    expect(result).toEqual({ 'has-views': 42, 'no-views': 0 })
  })

  it('returns empty object for empty array', async () => {
    const result = await read([])
    expect(result).toEqual({})
    expect(mockMget).not.toHaveBeenCalled()
  })

  it('propagates Redis errors', async () => {
    mockMget.mockRejectedValue(new Error('Connection refused'))

    await expect(read('test-post')).rejects.toThrow('Connection refused')
  })
})
