import { describe, it, expect, vi } from 'vitest'

vi.mock('@/.velite', () => ({
  posts: [
    { slug: 'published-one', title: 'Published One', draft: false },
    { slug: 'draft-one',     title: 'Draft One',     draft: true  },
    { slug: 'published-two', title: 'Published Two', draft: false },
    { slug: 'draft-two',     title: 'Draft Two',     draft: true  },
  ],
}))

// Import AFTER the mock so the helper sees the mocked posts
import { publishedPosts } from './posts'

describe('publishedPosts (GAP-01)', () => {
  it('excludes all entries with draft: true', () => {
    expect(publishedPosts.find(p => p.draft === true)).toBeUndefined()
  })

  it('includes all entries with draft: false', () => {
    const slugs = publishedPosts.map(p => p.slug)
    expect(slugs).toContain('published-one')
    expect(slugs).toContain('published-two')
    expect(slugs).not.toContain('draft-one')
    expect(slugs).not.toContain('draft-two')
  })

  it('returns exactly 2 published entries from the 4-entry fixture', () => {
    expect(publishedPosts).toHaveLength(2)
  })
})
