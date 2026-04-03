import { describe, it, expect } from 'vitest'
import nextConfig from '../../next.config'

describe('security headers configuration (SEC-01)', () => {
  it('exports an async headers function', () => {
    expect(typeof nextConfig.headers).toBe('function')
  })

  it('applies headers to all routes via catch-all source pattern', async () => {
    const headerRules = await nextConfig.headers!()
    expect(headerRules.length).toBeGreaterThan(0)
    const catchAllRule = headerRules.find(r => r.source === '/(.*)')
    expect(catchAllRule).toBeDefined()
  })

  it('includes a Content-Security-Policy header', async () => {
    const headerRules = await nextConfig.headers!()
    const allHeaders = headerRules.flatMap(r => r.headers)
    const csp = allHeaders.find(h => h.key === 'Content-Security-Policy')
    expect(csp).toBeDefined()
    expect(csp!.value).toBeTruthy()
  })

  it('includes X-Frame-Options set to DENY', async () => {
    const headerRules = await nextConfig.headers!()
    const allHeaders = headerRules.flatMap(r => r.headers)
    const xfo = allHeaders.find(h => h.key === 'X-Frame-Options')
    expect(xfo).toBeDefined()
    expect(xfo!.value).toBe('DENY')
  })

  it('includes X-Content-Type-Options set to nosniff', async () => {
    const headerRules = await nextConfig.headers!()
    const allHeaders = headerRules.flatMap(r => r.headers)
    const xcto = allHeaders.find(h => h.key === 'X-Content-Type-Options')
    expect(xcto).toBeDefined()
    expect(xcto!.value).toBe('nosniff')
  })

  it('includes Referrer-Policy header', async () => {
    const headerRules = await nextConfig.headers!()
    const allHeaders = headerRules.flatMap(r => r.headers)
    const rp = allHeaders.find(h => h.key === 'Referrer-Policy')
    expect(rp).toBeDefined()
    expect(rp!.value).toBeTruthy()
  })
})
