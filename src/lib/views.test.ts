import { describe, it, expect, beforeEach } from 'vitest'
import { formatViewCount, getCachedViews, setCachedViews } from './views'

describe('formatViewCount', () => {
  it('pluralizes zero as views', () => {
    expect(formatViewCount(0)).toBe('0 views')
  })

  it('uses singular for exactly 1', () => {
    expect(formatViewCount(1)).toBe('1 view')
  })

  it('formats large numbers with locale separators', () => {
    expect(formatViewCount(1234)).toBe('1,234 views')
  })

  it('handles very large numbers', () => {
    expect(formatViewCount(1000000)).toBe('1,000,000 views')
  })
})

describe('getCachedViews / setCachedViews', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null for uncached slug', () => {
    expect(getCachedViews('nonexistent')).toBeNull()
  })

  it('round-trips a value', () => {
    setCachedViews('test-slug', 42)
    expect(getCachedViews('test-slug')).toBe(42)
  })

  it('overwrites previous value', () => {
    setCachedViews('slug', 10)
    setCachedViews('slug', 20)
    expect(getCachedViews('slug')).toBe(20)
  })

  it('stores under views: prefixed key', () => {
    setCachedViews('my-post', 5)
    expect(localStorage.getItem('views:my-post')).toBe('5')
  })
})
