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
import type { Post } from './posts'

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

describe('Post type re-export', () => {
  it('exposes Post type with expected fields', () => {
    const post: Post = {
      title: 'Test',
      slug: 'test',
      date: '2024-01-01',
      tags: [],
      draft: false,
      toc: [],
      metadata: { readingTime: 1, wordCount: 100 },
      excerpt: 'test',
      body: '',
      permalink: '/blog/test',
      readingTime: 1,
    }
    expect(post.title).toBe('Test')
    expect(post.slug).toBe('test')
    expect(post.readingTime).toBe(1)
  })
})
