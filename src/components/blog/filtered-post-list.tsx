'use client'

import { useMemo } from 'react'
import { FilterBar } from '@/components/ui/filter-bar'
import { FilterChip } from '@/components/ui/filter-chip'
import { useFilteredList } from '@/hooks/use-filtered-list'
import { PostCard } from './post-card'
import { ListingViewCounts } from '@/lib/post-view-count/client'
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
    isPending,
    filterCounts: tagCounts,
    handleToggle,
    handleClear,
  } = useFilteredList({
    items: posts,
    allFilterValues: allTags,
    getItemValues: (post) => post.tags,
    paramName: 'tags',
  })

  const allSlugs = useMemo(() => posts.map((p) => p.slug), [posts])

  return (
    <ListingViewCounts slugs={allSlugs}>
      <div className="tag-bar">
        <FilterBar
          items={allTags}
          activeItems={activeTags}
          onToggle={handleToggle}
          onClear={handleClear}
          counts={tagCounts}
          renderChip={({ item, active, onToggle, count }) => (
            <FilterChip key={item} label={item} active={active} onToggle={onToggle} count={count} />
          )}
          label="Filter by tag"
        />
      </div>
      {isFiltering && (
        <p className="filter-status">
          Showing {filteredPosts.length} of {posts.length} posts
        </p>
      )}
      {filteredPosts.length > 0 ? (
        <div className={cn(
          'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
          'transition-opacity duration-200 filter-grid-fade',
          isPending ? 'opacity-0' : 'opacity-100'
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
          <p className="filter-status" style={{ marginBottom: 16 }}>
            No posts match the selected tags.
          </p>
          <button type="button" onClick={handleClear} className="btn btn--ghost">
            Clear filters
          </button>
        </div>
      )}
    </ListingViewCounts>
  )
}
