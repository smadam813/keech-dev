import { renderHook, act } from '@testing-library/react'
import { useMenuState } from './use-menu-state'

let mockPathname = '/'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

beforeEach(() => {
  mockPathname = '/'
  document.body.style.cssText = ''
  document.body.innerHTML = '<main></main>'
  vi.stubGlobal('scrollY', 0)
  vi.stubGlobal('scrollTo', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useMenuState', () => {
  it('starts closed', () => {
    const { result } = renderHook(() => useMenuState())
    expect(result.current.isOpen).toBe(false)
  })

  it('opens on toggle', () => {
    const { result } = renderHook(() => useMenuState())
    act(() => result.current.toggle())
    expect(result.current.isOpen).toBe(true)
  })

  it('closes on second toggle', () => {
    const { result } = renderHook(() => useMenuState())
    act(() => result.current.toggle())
    act(() => result.current.toggle())
    expect(result.current.isOpen).toBe(false)
  })

  it('closes via close()', () => {
    const { result } = renderHook(() => useMenuState())
    act(() => result.current.toggle())
    expect(result.current.isOpen).toBe(true)
    act(() => result.current.close())
    expect(result.current.isOpen).toBe(false)
  })

  it('closes when pathname changes', () => {
    const { result, rerender } = renderHook(() => useMenuState())
    act(() => result.current.toggle())
    expect(result.current.isOpen).toBe(true)
    mockPathname = '/blog'
    rerender()
    expect(result.current.isOpen).toBe(false)
  })

  it('locks scroll when open', () => {
    vi.stubGlobal('scrollY', 120)
    const { result } = renderHook(() => useMenuState())
    act(() => result.current.toggle())
    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.top).toBe('-120px')
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores scroll when closed', () => {
    vi.stubGlobal('scrollY', 120)
    const { result } = renderHook(() => useMenuState())
    act(() => result.current.toggle())
    act(() => result.current.close())
    expect(document.body.style.position).toBe('')
    expect(document.body.style.overflow).toBe('')
    expect(window.scrollTo).toHaveBeenCalledWith(0, 120)
  })

  it('sets inert on main and brand when open', () => {
    const brand = document.createElement('a')
    const { result } = renderHook(() => useMenuState())
    ;(result.current.brandRef as React.MutableRefObject<HTMLAnchorElement | null>).current = brand
    act(() => result.current.toggle())
    expect(document.querySelector('main')?.hasAttribute('inert')).toBe(true)
    expect(brand.hasAttribute('inert')).toBe(true)
  })

  it('removes inert when closed', () => {
    const brand = document.createElement('a')
    const { result } = renderHook(() => useMenuState())
    ;(result.current.brandRef as React.MutableRefObject<HTMLAnchorElement | null>).current = brand
    act(() => result.current.toggle())
    act(() => result.current.close())
    expect(document.querySelector('main')?.hasAttribute('inert')).toBe(false)
    expect(brand.hasAttribute('inert')).toBe(false)
  })

  it('closes on Escape key', () => {
    const { result } = renderHook(() => useMenuState())
    act(() => result.current.toggle())
    expect(result.current.isOpen).toBe(true)
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('ignores non-Escape keys', () => {
    const { result } = renderHook(() => useMenuState())
    act(() => result.current.toggle())
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })
    expect(result.current.isOpen).toBe(true)
  })

  it('restores focus to button on close', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus = vi.fn()
    const { result } = renderHook(() => useMenuState())
    ;(result.current.buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = button
    act(() => result.current.toggle())
    act(() => result.current.close())
    expect(button.focus).toHaveBeenCalled()
  })
})
