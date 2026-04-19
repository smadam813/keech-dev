import { Suspense } from 'react'
import { FilteredPostList } from '@/components/blog/filtered-post-list'
import { publishedPosts } from '@/lib/posts'
import { BLOG_RUNES } from '@/components/runes/rune-config'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Technical articles, tutorials, and thoughts on software development, web technologies, and the craft of building things.',
}

export default function BlogPage() {
  const sortedPosts = [...publishedPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const allTags = [...new Set(sortedPosts.flatMap(p => p.tags))].sort()

  return (
    <section className="w-full mx-auto" style={{ maxWidth: 'var(--page-max)' }}>
      <h1 className="page-title">
        <span aria-hidden="true" className="page-title__rune">{BLOG_RUNES.bullet.char}</span>
        Blog
      </h1>
      <p className="home-lede" style={{ marginTop: 0 }}>
        Writing on software, AI tooling, and the craft of building.
      </p>
      <Suspense>
        <FilteredPostList posts={sortedPosts} allTags={allTags} />
      </Suspense>
    </section>
  )
}
