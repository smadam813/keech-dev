import { describe, it, expect } from 'vitest'
import {
  NAV_RUNES,
  BLOG_RUNES,
  PROJECT_RUNES,
  POST_RUNES,
  ABOUT_RUNES,
  DIVIDER_RUNES,
} from './runes'

describe('runes', () => {
  describe('NAV_RUNES', () => {
    it('maps each route to a rune character string', () => {
      expect(NAV_RUNES['/']).toBe('ᛟ')
      expect(NAV_RUNES['/blog']).toBe('ᚨ')
      expect(NAV_RUNES['/projects']).toBe('ᚲ')
      expect(NAV_RUNES['/about']).toBe('ᛗ')
    })

    it('covers exactly the four nav routes', () => {
      expect(Object.keys(NAV_RUNES)).toEqual(['/', '/blog', '/projects', '/about'])
    })
  })

  describe('BLOG_RUNES', () => {
    it('has bullet rune', () => {
      expect(BLOG_RUNES.bullet).toBe('ᚨ')
    })
  })

  describe('PROJECT_RUNES', () => {
    it('has bullet, liveDemo, and source runes', () => {
      expect(PROJECT_RUNES.bullet).toBe('ᚲ')
      expect(PROJECT_RUNES.liveDemo).toBe('ᛊ')
      expect(PROJECT_RUNES.source).toBe('ᛉ')
    })
  })

  describe('POST_RUNES', () => {
    it('has separator rune', () => {
      expect(POST_RUNES.separator).toBe('ᛃ')
    })
  })

  describe('ABOUT_RUNES', () => {
    it('has writing, craft, availability, and rssFeed runes', () => {
      expect(ABOUT_RUNES.writing).toBe('ᚨ')
      expect(ABOUT_RUNES.craft).toBe('ᚲ')
      expect(ABOUT_RUNES.availability).toBe('ᚱ')
      expect(ABOUT_RUNES.rssFeed).toBe('ᛊ')
    })
  })

  describe('DIVIDER_RUNES', () => {
    it('has default rune', () => {
      expect(DIVIDER_RUNES.default).toBe('ᛞ')
    })
  })

  describe('all exports are plain strings, not objects', () => {
    it('NAV_RUNES values are strings', () => {
      for (const v of Object.values(NAV_RUNES)) {
        expect(typeof v).toBe('string')
      }
    })

    it('context map values are strings', () => {
      expect(typeof BLOG_RUNES.bullet).toBe('string')
      expect(typeof PROJECT_RUNES.bullet).toBe('string')
      expect(typeof POST_RUNES.separator).toBe('string')
      expect(typeof ABOUT_RUNES.writing).toBe('string')
      expect(typeof DIVIDER_RUNES.default).toBe('string')
    })
  })
})
