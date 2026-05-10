import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilteredList } from './filtered-list'

const mockGet = vi.fn()
const mockSearchParamsToString = vi.fn(() => '')
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
    toString: mockSearchParamsToString,
  }),
  usePathname: () => '/blog',
}))

vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

vi.stubGlobal('IntersectionObserver', class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
})

type TestItem = { id: string; tags: string[] }

const items: TestItem[] = [
  { id: 'a', tags: ['react', 'typescript'] },
  { id: 'b', tags: ['react', 'css'] },
  { id: 'c', tags: ['typescript', 'css'] },
  { id: 'd', tags: ['javascript'] },
]

const allFilterValues = ['css', 'javascript', 'react', 'typescript']

function renderList(paramValue: string | null = null) {
  mockGet.mockReturnValue(paramValue)
  return render(
    <FilteredList
      items={items}
      allFilterValues={allFilterValues}
      getItemValues={(item: TestItem) => item.tags}
      paramName="tags"
      filterLabel="Filter by tag"
      gridClassName="grid gap-4 md:grid-cols-2"
      statusFormat={(n, total) => `Showing ${n} of ${total} posts`}
      emptyMessage="No posts match the selected tags."
      getKey={(item: TestItem) => item.id}
      renderItem={(item: TestItem) => <div data-testid={`item-${item.id}`}>{item.id}</div>}
    />
  )
}

describe('FilteredList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParamsToString.mockReturnValue('')
    vi.stubGlobal('history', { replaceState: vi.fn() })
  })

  it('renders all items when no filters are active', () => {
    renderList(null)
    expect(screen.getByTestId('item-a')).toBeInTheDocument()
    expect(screen.getByTestId('item-b')).toBeInTheDocument()
    expect(screen.getByTestId('item-c')).toBeInTheDocument()
    expect(screen.getByTestId('item-d')).toBeInTheDocument()
  })

  it('renders filter chips for all filter values', () => {
    renderList(null)
    for (const value of allFilterValues) {
      expect(screen.getByRole('button', { name: new RegExp(value, 'i') })).toBeInTheDocument()
    }
  })

  it('filters items when a chip is clicked', () => {
    renderList(null)
    fireEvent.click(screen.getByRole('button', { name: /javascript/i }))
    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      expect.stringContaining('javascript')
    )
  })

  it('reads active filters from URL on mount', () => {
    renderList('react')
    expect(screen.getByTestId('item-a')).toBeInTheDocument()
    expect(screen.getByTestId('item-b')).toBeInTheDocument()
    expect(screen.queryByTestId('item-c')).not.toBeInTheDocument()
    expect(screen.queryByTestId('item-d')).not.toBeInTheDocument()
  })

  it('applies AND-filtering for multiple active filters', () => {
    renderList('react,typescript')
    expect(screen.getByTestId('item-a')).toBeInTheDocument()
    expect(screen.queryByTestId('item-b')).not.toBeInTheDocument()
    expect(screen.queryByTestId('item-c')).not.toBeInTheDocument()
  })

  it('shows status message when filtering', () => {
    renderList('react')
    expect(screen.getByText('Showing 2 of 4 posts')).toBeInTheDocument()
  })

  it('does not show status message when not filtering', () => {
    renderList(null)
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()
  })

  it('shows empty state when no items match', () => {
    renderList('react,javascript')
    expect(screen.getByText('No posts match the selected tags.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
  })

  it('clears filters via Clear all button in filter bar', () => {
    mockSearchParamsToString.mockReturnValue('tags=react')
    renderList('react')
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }))
    expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/blog')
  })

  it('clears filters via empty-state Clear filters button', () => {
    mockSearchParamsToString.mockReturnValue('tags=react,javascript')
    renderList('react,javascript')
    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }))
    expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/blog')
  })

  it('ignores empty segments from malformed URL params', () => {
    renderList('react,,typescript,')
    expect(screen.getByTestId('item-a')).toBeInTheDocument()
    expect(screen.queryByTestId('item-b')).not.toBeInTheDocument()
    expect(screen.queryByTestId('item-c')).not.toBeInTheDocument()
    expect(screen.queryByTestId('item-d')).not.toBeInTheDocument()
  })

  it('writes filter values sorted alphabetically to URL', () => {
    mockSearchParamsToString.mockReturnValue('tags=typescript')
    renderList('typescript')
    fireEvent.click(screen.getByRole('button', { name: /^css/i }))
    const url = (window.history.replaceState as ReturnType<typeof vi.fn>).mock.calls[0][2] as string
    const params = new URLSearchParams(url.split('?')[1])
    expect(params.get('tags')).toBe('css,typescript')
  })
})
