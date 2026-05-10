import { describe, it, expect } from 'vitest'
import { serializeFilters, parseFilters } from './filter-url'

describe('serializeFilters', () => {
  it('returns null for an empty set', () => {
    expect(serializeFilters(new Set())).toBeNull()
  })

  it('serializes a single value', () => {
    expect(serializeFilters(new Set(['react']))).toBe('react')
  })

  it('sorts values alphabetically', () => {
    expect(serializeFilters(new Set(['typescript', 'css', 'react']))).toBe(
      'css,react,typescript'
    )
  })

  it('joins values with commas', () => {
    expect(serializeFilters(new Set(['a', 'b']))).toBe('a,b')
  })
})

describe('parseFilters', () => {
  it('returns an empty set for null', () => {
    const result = parseFilters(null)
    expect(result).toBeInstanceOf(Set)
    expect(result.size).toBe(0)
  })

  it('returns an empty set for an empty string', () => {
    expect(parseFilters('').size).toBe(0)
  })

  it('parses a single value', () => {
    const result = parseFilters('react')
    expect(result.has('react')).toBe(true)
    expect(result.size).toBe(1)
  })

  it('parses comma-separated values', () => {
    const result = parseFilters('css,react,typescript')
    expect(result).toEqual(new Set(['css', 'react', 'typescript']))
  })

  it('ignores empty segments from trailing commas', () => {
    const result = parseFilters('react,,typescript,')
    expect(result).toEqual(new Set(['react', 'typescript']))
  })
})
