import { posts } from '@/.velite'
import { PostCard } from '@/components/blog/post-card'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Technical articles, tutorials, and thoughts on software development, web technologies, and the craft of building things.',
}

export default function BlogPage() {
  // Filter out drafts and sort by date (newest first)
  const publishedPosts = posts
    .filter(post => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <section className="w-full mx-auto max-w-7xl px-6 pt-12 pb-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-10">Blog</h1>

      {publishedPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {publishedPosts.map(post => (
            <ScrollReveal key={post.slug}>
              <PostCard post={post} />
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <p className="text-muted">No posts yet. Check back soon!</p>
      )}
    </section>
  )
}
