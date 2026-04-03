'use client'

import { useMemo } from 'react'
import { FilterBar } from '@/components/ui/filter-bar'
import { FilterChip } from '@/components/ui/filter-chip'
import { useFilteredList } from '@/hooks/use-filtered-list'
import { PostCard } from './post-card'
import { ListingViewCounts } from './listing-view-counts'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { cn } from '@/lib/utils'

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
  const {
    filteredItems: filteredPosts,
    activeFilters: activeTags,
    isFiltering,
    isTransitioning,
    filterCounts: tagCounts,
    handleToggle,
    handleClear,
  } = useFilteredList({
    items: posts,
    allFilterValues: allTags,
    getItemValues: (post) => post.tags,
    paramName: 'tags',
  })

  // Stable slugs for view count fetching (all posts, not filtered)
  const allSlugs = useMemo(() => posts.map((p) => p.slug), [posts])

  return (
    <ListingViewCounts slugs={allSlugs}>
      <FilterBar
        items={allTags}
        activeItems={activeTags}
        onToggle={handleToggle}
        onClear={handleClear}
        counts={tagCounts}
        renderChip={({ item, active, onToggle, count }) => (
          <FilterChip key={item} label={item} variant="tag" active={active} onToggle={onToggle} count={count} />
        )}
        label="Filter by tag"
      />
      {isFiltering && (
        <p className="text-sm font-mono text-muted mb-4">
          Showing {filteredPosts.length} of {posts.length} posts
        </p>
      )}
      {filteredPosts.length > 0 ? (
        <div className={cn(
          'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
          'transition-opacity duration-200 filter-grid-fade',
          isTransitioning ? 'opacity-0' : 'opacity-100'
        )}>
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
            className="px-3 py-1 text-sm font-mono font-bold border-2 border-black bg-white shadow-brutal hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150"
          >
            Clear filters
          </button>
        </div>
      )}
    </ListingViewCounts>
  )
}
