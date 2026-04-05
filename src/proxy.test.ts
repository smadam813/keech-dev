import { describe, it, expect } from 'vitest'
import proxy, { config } from './proxy'

describe('security headers via proxy (MID-01, MID-02, MID-03)', () => {
  it('exports a proxy function', () => {
    expect(typeof proxy).toBe('function')
  })

  it('exports a config with matcher excluding static assets', () => {
    expect(config).toBeDefined()
    expect(config.matcher).toBeDefined()
    expect(config.matcher.length).toBeGreaterThan(0)
    expect(config.matcher[0]).toContain('_next/static')
  })

  it('sets Content-Security-Policy header', () => {
    const response = proxy()
    const csp = response.headers.get('Content-Security-Policy')
    expect(csp).toBeDefined()
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("script-src 'self' 'unsafe-inline'")
    expect(csp).not.toContain('unsafe-eval')
  })

  it('sets X-Frame-Options to DENY', () => {
    const response = proxy()
    expect(response.headers.get('X-Frame-Options')).toBe('DENY')
  })

  it('sets X-Content-Type-Options to nosniff', () => {
    const response = proxy()
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('sets Referrer-Policy header', () => {
    const response = proxy()
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })
})
