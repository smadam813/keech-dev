import { describe, it, expect } from 'vitest'
import { validateSlug, validateSlugs } from './validation'

describe('validateSlug', () => {
  it('accepts a valid lowercase slug', () => {
    expect(validateSlug('my-blog-post')).toBe(true)
  })

  it('accepts a slug with numbers', () => {
    expect(validateSlug('post-123')).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(validateSlug('')).toBe(false)
  })

  it('rejects a slug with special characters', () => {
    expect(validateSlug("'; DROP TABLE posts--")).toBe(false)
  })

  it('rejects a slug with uppercase letters', () => {
    expect(validateSlug('My-Post')).toBe(false)
  })

  it('rejects a slug with spaces', () => {
    expect(validateSlug('my blog post')).toBe(false)
  })

  it('rejects a slug with a forward slash', () => {
    expect(validateSlug('../../etc/passwd')).toBe(false)
  })

  it('rejects a slug that exceeds 100 characters', () => {
    const tooLong = 'a'.repeat(101)
    expect(validateSlug(tooLong)).toBe(false)
  })

  it('accepts a slug at exactly 100 characters', () => {
    const atLimit = 'a'.repeat(100)
    expect(validateSlug(atLimit)).toBe(true)
  })
})

describe('validateSlugs batch limit', () => {
  it('accepts a batch of 20 valid slugs', () => {
    const slugs = Array.from({ length: 20 }, (_, i) => `slug-${i}`)
    const result = validateSlugs(slugs)
    expect(result.valid).toBe(true)
  })

  it('rejects a batch exceeding 20 slugs', () => {
    const slugs = Array.from({ length: 21 }, (_, i) => `slug-${i}`)
    const result = validateSlugs(slugs)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('20')
  })

  it('rejects a batch containing an invalid slug', () => {
    const slugs = ['valid-slug', 'INVALID_SLUG', 'another-valid']
    const result = validateSlugs(slugs)
    expect(result.valid).toBe(false)
  })

  it('accepts an empty batch', () => {
    const result = validateSlugs([])
    expect(result.valid).toBe(true)
  })
})
