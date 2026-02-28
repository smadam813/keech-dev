'use client'

import { useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { FilterBar } from '@/components/ui/filter-bar'
import { TagChip } from '@/components/blog/tag-chip'
import { PostCard } from './post-card'
import { ListingViewCounts } from './listing-view-counts'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

interface FilteredPostListProps {
  posts: Array<{
    title: string
    slug: string
    date: string
    description?: string
    excerpt: string
    tags: string[]
    readingTime: number
  }>
  allTags: string[]
}

export function FilteredPostList({ posts, allTags }: FilteredPostListProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Read filter state from URL
  const activeTags = useMemo(
    () => new Set(searchParams.get('tags')?.split(',').filter(Boolean) ?? []),
    [searchParams]
  )

  // Stable slugs for view count fetching (all posts, not filtered)
  const allSlugs = useMemo(() => posts.map((p) => p.slug), [posts])

  // AND logic: posts must contain ALL selected tags
  const filteredPosts =
    activeTags.size === 0
      ? posts
      : posts.filter((post) => [...activeTags].every((tag) => post.tags.includes(tag)))

  const isFiltering = activeTags.size > 0

  // Write new tag set to URL via replaceState (no server re-render)
  const updateURL = useCallback(
    (next: Set<string>) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next.size === 0) {
        params.delete('tags')
      } else {
        params.set('tags', [...next].sort().join(','))
      }
      const query = params.toString()
      window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
    },
    [searchParams, pathname]
  )

  const handleToggle = useCallback(
    (tag: string) => {
      const next = new Set(activeTags)
      if (next.has(tag)) {
        next.delete(tag)
      } else {
        next.add(tag)
      }
      updateURL(next)
    },
    [activeTags, updateURL]
  )

  const handleClear = useCallback(() => {
    updateURL(new Set())
  }, [updateURL])

  return (
    <ListingViewCounts slugs={allSlugs}>
      <FilterBar
        items={allTags}
        activeItems={activeTags}
        onToggle={handleToggle}
        onClear={handleClear}
        renderChip={({ item, active, onToggle }) => (
          <TagChip key={item} tag={item} active={active} onToggle={onToggle} />
        )}
        label="Filter by tag"
      />
      {filteredPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) =>
            isFiltering ? (
              <PostCard key={post.slug} post={post} />
            ) : (
              <ScrollReveal key={post.slug}>
                <PostCard post={post} />
              </ScrollReveal>
            )
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted text-lg mb-4">No posts match the selected tags.</p>
          <button
            type="button"
            onClick={handleClear}
            className="text-accent hover:text-accent-hover font-mono font-bold underline underline-offset-2 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </ListingViewCounts>
  )
}
