import { describe, it, expect } from 'vitest'
import { TAG_HUE_PALETTE, hashTag, paletteFor } from './tag-palette'

describe('tag-palette', () => {
  it('exposes six named hues in fixed order', () => {
    expect(TAG_HUE_PALETTE.map(h => h.name)).toEqual([
      'rose', 'mint', 'amber', 'lavender', 'teal', 'clay',
    ])
  })

  it('every hue has bg, fg, border strings', () => {
    for (const hue of TAG_HUE_PALETTE) {
      expect(hue.bg).toMatch(/^rgba\(/)
      expect(hue.fg).toMatch(/^#/)
      expect(hue.border).toMatch(/^rgba\(/)
    }
  })

  it('hashTag is deterministic', () => {
    expect(hashTag('react')).toBe(hashTag('react'))
    expect(hashTag('typescript')).toBe(hashTag('typescript'))
  })

  it('hashTag returns a non-negative integer', () => {
    for (const tag of ['', 'a', 'react', 'some-very-long-tag-string']) {
      const h = hashTag(tag)
      expect(Number.isInteger(h)).toBe(true)
      expect(h).toBeGreaterThanOrEqual(0)
    }
  })

  it('paletteFor returns same palette for same tag', () => {
    expect(paletteFor('react')).toBe(paletteFor('react'))
  })

  it('paletteFor returns one of the six hues', () => {
    const names = new Set(TAG_HUE_PALETTE.map(h => h.name))
    expect(names.has(paletteFor('react').name)).toBe(true)
    expect(names.has(paletteFor('').name)).toBe(true)
  })

  it('paletteFor distributes across hues for a spread of inputs', () => {
    const seen = new Set<string>()
    for (const t of ['react', 'typescript', 'css', 'next', 'mdx', 'norse', 'ai', 'redis']) {
      seen.add(paletteFor(t).name)
    }
    expect(seen.size).toBeGreaterThanOrEqual(3)
  })
})
