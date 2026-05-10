'use client'

import { useMemo } from 'react'
import { FilteredList } from '@/components/ui/filtered-list'
import { PostCard } from './post-card'
import { ListingViewCounts } from '@/lib/post-view-count/client'
import type { Post } from '@/lib/posts'

interface FilteredPostListProps {
  posts: Post[]
  allTags: string[]
}

export function FilteredPostList({ posts, allTags }: FilteredPostListProps) {
  const allSlugs = useMemo(() => posts.map((p) => p.slug), [posts])

  return (
    <ListingViewCounts slugs={allSlugs}>
      <FilteredList
        items={posts}
        allFilterValues={allTags}
        getItemValues={(post) => post.tags}
        paramName="tags"
        filterLabel="Filter by tag"
        gridClassName="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        statusFormat={(n, total) => `Showing ${n} of ${total} posts`}
        emptyMessage="No posts match the selected tags."
        getKey={(post) => post.slug}
        renderItem={(post) => <PostCard post={post} />}
      />
    </ListingViewCounts>
  )
}
