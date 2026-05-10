import { describe, it, expect } from 'vitest'
import { classifyError, selectStrategy } from './classify'

describe('classifyError', () => {
  it('returns "content" for MDX parse errors', () => {
    expect(classifyError(new Error('MDX compilation failed'))).toBe('content')
  })

  it('returns "content" for Velite artifact errors', () => {
    expect(classifyError(new Error('velite build artifact not found'))).toBe('content')
  })

  it('returns "content" for "not found" errors', () => {
    expect(classifyError(new Error('Post not found'))).toBe('content')
  })

  it('returns "service" for Redis connection errors', () => {
    expect(classifyError(new Error('Redis connection refused'))).toBe('service')
  })

  it('returns "service" for Upstash errors', () => {
    expect(classifyError(new Error('Upstash request failed'))).toBe('service')
  })

  it('returns "service" for fetch/network errors', () => {
    expect(classifyError(new Error('fetch failed'))).toBe('service')
    expect(classifyError(new Error('NetworkError when attempting to fetch resource'))).toBe('service')
  })

  it('returns "service" for ECONNREFUSED', () => {
    expect(classifyError(new Error('connect ECONNREFUSED 127.0.0.1:6379'))).toBe('service')
  })

  it('returns "service" for timeout errors', () => {
    expect(classifyError(new Error('Request timeout after 5000ms'))).toBe('service')
  })

  it('returns "unknown" for generic errors', () => {
    expect(classifyError(new Error('Cannot read properties of null'))).toBe('unknown')
  })

  it('returns "unknown" for errors with empty message', () => {
    expect(classifyError(new Error(''))).toBe('unknown')
  })

  it('matches case-insensitively', () => {
    expect(classifyError(new Error('MDX COMPILATION FAILED'))).toBe('content')
    expect(classifyError(new Error('REDIS connection error'))).toBe('service')
  })
})

describe('selectStrategy', () => {
  it('returns a non-retryable strategy for content errors', () => {
    const strategy = selectStrategy('content')
    expect(strategy.retryable).toBe(false)
  })

  it('returns a content-specific heading for content errors', () => {
    const strategy = selectStrategy('content')
    expect(strategy.heading).toMatch(/content/i)
  })

  it('returns a retryable strategy for service errors', () => {
    const strategy = selectStrategy('service')
    expect(strategy.retryable).toBe(true)
  })

  it('returns a service-specific heading for service errors', () => {
    const strategy = selectStrategy('service')
    expect(strategy.heading).toMatch(/temporarily/i)
  })

  it('returns a retryable strategy for unknown errors', () => {
    const strategy = selectStrategy('unknown')
    expect(strategy.retryable).toBe(true)
  })

  it('returns a generic heading for unknown errors', () => {
    const strategy = selectStrategy('unknown')
    expect(strategy.heading).toMatch(/something went wrong/i)
  })

  it('always returns a non-empty message', () => {
    for (const category of ['content', 'service', 'unknown'] as const) {
      expect(selectStrategy(category).message.length).toBeGreaterThan(0)
    }
  })
})
