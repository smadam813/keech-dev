import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRef } from 'react'
import { useHeroAnimation } from './use-hero-animation'

describe('useHeroAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Default: reduced motion OFF
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('starts in loading stage with glows inactive', () => {
    const { result } = renderHook(() => {
      const imgRef = useRef<HTMLImageElement | null>(null)
      return useHeroAnimation({ imgRef })
    })
    expect(result.current.revealStage).toBe('loading')
    expect(result.current.glowsActive).toBe(false)
  })

  it('transitions from loading to bg-reveal to text-reveal after image loads', async () => {
    const { result } = renderHook(() => {
      const imgRef = useRef<HTMLImageElement | null>(null)
      return useHeroAnimation({ imgRef })
    })

    expect(result.current.revealStage).toBe('loading')

    // Trigger image load
    act(() => {
      result.current.handleLoad()
    })

    expect(result.current.revealStage).toBe('bg-reveal')

    // Advance past 600ms transition to text-reveal
    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    expect(result.current.revealStage).toBe('text-reveal')
  })

  it('activates glow cascade 500ms after text-reveal', async () => {
    const { result } = renderHook(() => {
      const imgRef = useRef<HTMLImageElement | null>(null)
      return useHeroAnimation({ imgRef })
    })

    act(() => {
      result.current.handleLoad()
    })

    // Advance to text-reveal
    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    expect(result.current.glowsActive).toBe(false)

    // Advance past glow cascade delay
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.glowsActive).toBe(true)
  })

  it('skips animation sequence and jumps to text-reveal when reduced motion is on', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: true, // reduced motion ON
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    )

    const { result } = renderHook(() => {
      const imgRef = useRef<HTMLImageElement | null>(null)
      return useHeroAnimation({ imgRef })
    })

    expect(result.current.prefersReducedMotion).toBe(true)

    act(() => {
      result.current.handleLoad()
    })

    // Should skip bg-reveal and go directly to text-reveal
    expect(result.current.revealStage).toBe('text-reveal')
    // Glows should NOT activate even after text-reveal when reduced motion is on
    expect(result.current.glowsActive).toBe(false)
  })

  it('does not replay animation if handleLoad is called twice', () => {
    const { result } = renderHook(() => {
      const imgRef = useRef<HTMLImageElement | null>(null)
      return useHeroAnimation({ imgRef })
    })

    act(() => {
      result.current.handleLoad()
    })
    expect(result.current.revealStage).toBe('bg-reveal')

    // Second call should not reset stage back to loading
    act(() => {
      result.current.handleLoad()
    })
    expect(result.current.revealStage).toBe('bg-reveal')
  })
})
