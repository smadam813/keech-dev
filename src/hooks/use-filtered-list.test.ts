import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFilteredList } from './use-filtered-list'

// Mock next/navigation
const mockGet = vi.fn()
const mockSearchParamsToString = vi.fn(() => '')
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
    toString: mockSearchParamsToString,
  }),
  usePathname: () => '/blog',
}))

type TestItem = { id: string; tags: string[] }

const items: TestItem[] = [
  { id: 'a', tags: ['react', 'typescript'] },
  { id: 'b', tags: ['react', 'css'] },
  { id: 'c', tags: ['typescript', 'css'] },
  { id: 'd', tags: ['javascript'] },
]

const allFilterValues = ['react', 'typescript', 'css', 'javascript']

function makeOptions(paramValue: string | null = null) {
  mockGet.mockReturnValue(paramValue)
  return {
    items,
    allFilterValues,
    getItemValues: (item: TestItem) => item.tags,
    paramName: 'tags',
  }
}

describe('useFilteredList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParamsToString.mockReturnValue('')
    // Stub window.history.replaceState
    vi.stubGlobal('history', {
      replaceState: vi.fn(),
    })
  })

  it('returns all items when no filters are active', () => {
    mockGet.mockReturnValue(null)
    const { result } = renderHook(() => useFilteredList(makeOptions(null)))
    expect(result.current.filteredItems).toHaveLength(4)
    expect(result.current.isFiltering).toBe(false)
  })

  it('reads active filters from URL param on mount', () => {
    mockGet.mockReturnValue('react')
    const { result } = renderHook(() =>
      useFilteredList(makeOptions('react'))
    )
    expect(result.current.activeFilters.has('react')).toBe(true)
    expect(result.current.isFiltering).toBe(true)
  })

  it('applies AND-filtering: only items matching ALL active filters are returned', () => {
    mockGet.mockReturnValue('react,typescript')
    const { result } = renderHook(() =>
      useFilteredList(makeOptions('react,typescript'))
    )
    // Only item 'a' has both react and typescript
    expect(result.current.filteredItems).toHaveLength(1)
    expect(result.current.filteredItems[0].id).toBe('a')
  })

  it('computes static filter counts regardless of active filters', () => {
    mockGet.mockReturnValue(null)
    const { result } = renderHook(() => useFilteredList(makeOptions(null)))
    expect(result.current.filterCounts['react']).toBe(2)
    expect(result.current.filterCounts['typescript']).toBe(2)
    expect(result.current.filterCounts['css']).toBe(2)
    expect(result.current.filterCounts['javascript']).toBe(1)
  })

  it('handleToggle adds a filter and calls replaceState to sync URL', () => {
    mockGet.mockReturnValue(null)
    mockSearchParamsToString.mockReturnValue('')
    const { result } = renderHook(() => useFilteredList(makeOptions(null)))

    act(() => {
      result.current.handleToggle('react')
    })

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      expect.stringContaining('react')
    )
  })

  it('handleClear removes all filters and calls replaceState without param', () => {
    mockGet.mockReturnValue('react')
    mockSearchParamsToString.mockReturnValue('tags=react')
    const { result } = renderHook(() => useFilteredList(makeOptions('react')))

    act(() => {
      result.current.handleClear()
    })

    expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/blog')
  })

  it('exposes isPending as false initially (no transition on first render)', () => {
    mockGet.mockReturnValue('react')
    const { result } = renderHook(() => useFilteredList(makeOptions('react')))
    // On initial render, isPending should be false (useTransition starts idle)
    expect(result.current.isPending).toBe(false)
  })
})
