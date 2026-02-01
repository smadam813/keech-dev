import { posts } from '@/.velite'
import { PostCard } from '@/components/blog/post-card'

export const metadata = {
  title: 'Blog | keech.dev',
  description: 'Thoughts on code, creativity, and the cosmic journey of building things.'
}

export default function BlogPage() {
  // Filter out drafts and sort by date (newest first)
  const publishedPosts = posts
    .filter(post => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <main className="container mx-auto px-6 py-8">
      <header className="mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Blog</h1>
        <p className="text-muted text-lg max-w-2xl">
          Thoughts on code, creativity, and whatever else catches my interest.
        </p>
      </header>

      {publishedPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {publishedPosts.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-muted">No posts yet. Check back soon!</p>
      )}
    </main>
  )
}
