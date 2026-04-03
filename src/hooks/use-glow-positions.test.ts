import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRef } from 'react'
import { useGlowPositions } from './use-glow-positions'

// Mock rune-glows module so we don't depend on real glow data
vi.mock('@/lib/rune-glows', () => ({
  RUNE_GLOWS: [{ id: 'glow-1', x: 0.5, y: 0.5, rune: 'A', label: 'Ansuz' }],
  computeGlowPositions: vi.fn((_glows, w, h) => [
    { left: `${w * 0.5}px`, top: `${h * 0.5}px`, visible: true },
  ]),
}))

describe('useGlowPositions', () => {
  let observeSpy: ReturnType<typeof vi.fn>
  let disconnectSpy: ReturnType<typeof vi.fn>
  let resizeObserverCallback: ResizeObserverCallback

  beforeEach(() => {
    observeSpy = vi.fn()
    disconnectSpy = vi.fn()

    // ResizeObserver must be a class (constructor), not a plain function
    class MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        resizeObserverCallback = cb
      }
      observe = observeSpy
      disconnect = disconnectSpy
    }

    vi.stubGlobal('ResizeObserver', MockResizeObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('returns empty array when sectionRef has no element', () => {
    const { result } = renderHook(() => {
      const sectionRef = useRef<HTMLElement | null>(null)
      return useGlowPositions({ sectionRef })
    })
    expect(result.current).toHaveLength(0)
  })

  it('computes initial glow positions from element bounding rect', () => {
    const { result } = renderHook(() => {
      const sectionRef = useRef<HTMLElement | null>(null)
      // Attach a fake element
      const fakeEl = {
        getBoundingClientRect: () => ({ width: 800, height: 400 }),
      } as unknown as HTMLElement
      sectionRef.current = fakeEl
      return useGlowPositions({ sectionRef })
    })

    expect(result.current).toHaveLength(1)
    expect(result.current[0]).toMatchObject({ left: '400px', top: '200px', visible: true })
  })

  it('registers a ResizeObserver on the section element', () => {
    renderHook(() => {
      const sectionRef = useRef<HTMLElement | null>(null)
      const fakeEl = {
        getBoundingClientRect: () => ({ width: 800, height: 400 }),
      } as unknown as HTMLElement
      sectionRef.current = fakeEl
      return useGlowPositions({ sectionRef })
    })

    expect(observeSpy).toHaveBeenCalledOnce()
  })

  it('recalculates positions when ResizeObserver fires with new dimensions', () => {
    const { result } = renderHook(() => {
      const sectionRef = useRef<HTMLElement | null>(null)
      const fakeEl = {
        getBoundingClientRect: () => ({ width: 800, height: 400 }),
      } as unknown as HTMLElement
      sectionRef.current = fakeEl
      return useGlowPositions({ sectionRef })
    })

    // Initial positions
    expect(result.current[0].left).toBe('400px')

    // Simulate resize to 1200x600
    act(() => {
      resizeObserverCallback(
        [{ contentRect: { width: 1200, height: 600 } }] as unknown as ResizeObserverEntry[],
        {} as ResizeObserver
      )
    })

    expect(result.current[0].left).toBe('600px')
    expect(result.current[0].top).toBe('300px')
  })

  it('disconnects ResizeObserver on unmount', () => {
    const { unmount } = renderHook(() => {
      const sectionRef = useRef<HTMLElement | null>(null)
      const fakeEl = {
        getBoundingClientRect: () => ({ width: 800, height: 400 }),
      } as unknown as HTMLElement
      sectionRef.current = fakeEl
      return useGlowPositions({ sectionRef })
    })

    unmount()
    expect(disconnectSpy).toHaveBeenCalledOnce()
  })
})
