import { describe, it, expect } from 'vitest'
import { formatDate } from './format'

describe('formatDate', () => {
  it('formats ISO date to human-readable', () => {
    expect(formatDate('2024-01-15')).toBe('January 15, 2024')
  })

  it('strips time component from ISO datetime', () => {
    expect(formatDate('2024-06-01T12:00:00Z')).toBe('June 1, 2024')
  })

  it('handles end-of-year date', () => {
    expect(formatDate('2024-12-31')).toBe('December 31, 2024')
  })

  it('handles leap year date', () => {
    expect(formatDate('2024-02-29')).toBe('February 29, 2024')
  })
})
