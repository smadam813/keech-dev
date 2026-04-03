import { describe, it, expect } from 'vitest'
import { computeGlowPositions, RUNE_GLOWS } from './rune-glows'

describe('computeGlowPositions', () => {
  it('returns a position for every rune', () => {
    const positions = computeGlowPositions(RUNE_GLOWS, 1920, 1080)
    expect(positions).toHaveLength(RUNE_GLOWS.length)
  })

  it('returns string pixel values for left and top', () => {
    const positions = computeGlowPositions(RUNE_GLOWS, 1920, 1080)
    for (const pos of positions) {
      expect(pos.left).toMatch(/^-?\d+(\.\d+)?px$/)
      expect(pos.top).toMatch(/^-?\d+(\.\d+)?px$/)
    }
  })

  it('marks all runes visible in a large container', () => {
    const positions = computeGlowPositions(RUNE_GLOWS, 2560, 1429)
    expect(positions.every((p) => p.visible)).toBe(true)
  })

  it('computes correct position at exact image dimensions', () => {
    // At exact image size, scale=1, offset=0, so left = imgX * 2560
    const positions = computeGlowPositions(RUNE_GLOWS, 2560, 1429)
    const first = positions[0] // fehu: imgX=0.0425
    expect(parseFloat(first.left)).toBeCloseTo(0.0425 * 2560, 0)
  })

  it('handles zero-dimension container gracefully', () => {
    const positions = computeGlowPositions(RUNE_GLOWS, 0, 0)
    expect(positions).toHaveLength(RUNE_GLOWS.length)
  })

  it('handles wide container (landscape scaling)', () => {
    // 3840/2560 = 1.5, 1080/1429 ~= 0.756 -> scale = 1.5
    const positions = computeGlowPositions(RUNE_GLOWS, 3840, 1080)
    expect(positions).toHaveLength(14)
    // All positions should be valid pixel strings
    for (const pos of positions) {
      expect(pos.left).toMatch(/^-?\d+(\.\d+)?px$/)
    }
  })
})
