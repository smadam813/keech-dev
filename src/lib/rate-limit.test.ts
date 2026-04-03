import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @upstash/redis before importing the module under test
vi.mock('@/lib/redis', () => ({
  redis: {},
}))

// Capture constructor args for assertion
const mockRatelimitConstructor = vi.fn()
const mockSlidingWindow = vi.fn().mockReturnValue({ type: 'slidingWindow', tokens: 10, window: '60 s' })

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class MockRatelimit {
    static slidingWindow = mockSlidingWindow
    constructor(args: unknown) {
      mockRatelimitConstructor(args)
    }
    limit = vi.fn()
  },
}))

describe('viewsRateLimit configuration (SEC-06)', () => {
  beforeEach(() => {
    vi.resetModules()
    mockRatelimitConstructor.mockClear()
    mockSlidingWindow.mockClear()
  })

  it('is configured with a sliding window of 10 requests per 60 seconds', async () => {
    // Re-import after resetting modules so the mock applies cleanly
    const { Ratelimit } = await import('@upstash/ratelimit')
    await import('./rate-limit')

    expect(Ratelimit.slidingWindow).toHaveBeenCalledWith(10, '60 s')
  })

  it('is constructed with the correct prefix for namespacing', async () => {
    await import('./rate-limit')

    expect(mockRatelimitConstructor).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'ratelimit:views' })
    )
  })

  it('exports a rate limiter instance', async () => {
    const { viewsRateLimit } = await import('./rate-limit')
    expect(viewsRateLimit).toBeDefined()
  })
})
