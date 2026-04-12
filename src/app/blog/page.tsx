import { Suspense } from 'react'
import { FilteredPostList } from '@/components/blog/filtered-post-list'
import { publishedPosts } from '@/lib/posts'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Technical articles, tutorials, and thoughts on software development, web technologies, and the craft of building things.',
}

export default function BlogPage() {
  // Sort by date (newest first) — spread first so we don't mutate the shared export
  const sortedPosts = [...publishedPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const allTags = [...new Set(sortedPosts.flatMap(p => p.tags))].sort()

  return (
    <section className="w-full mx-auto max-w-7xl px-6 pt-12 pb-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-10">Blog</h1>
      <Suspense>
        <FilteredPostList posts={sortedPosts} allTags={allTags} />
      </Suspense>
    </section>
  )
}
