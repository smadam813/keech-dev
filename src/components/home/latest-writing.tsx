import Link from 'next/link'
import { posts } from '@/.velite'
import { PostCard } from '@/components/blog/post-card'
import { ListingViewCounts } from '@/components/blog/listing-view-counts'
import { POST_RUNES } from '@/components/runes/rune-config'

export function LatestWriting() {
  const latest = [...posts]
    .filter(p => !p.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  if (latest.length === 0) return null

  return (
    <section className="mt-8">
      <div className="section-head">
        <span aria-hidden="true" className="section-head__rune">
          {POST_RUNES.separator.char}
        </span>
        <h2 className="section-head__title">Latest writing</h2>
        <Link href="/blog" className="section-head__more">All posts →</Link>
      </div>
      <ListingViewCounts slugs={latest.map(p => p.slug)}>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {latest.map(post => (
            <PostCard
              key={post.slug}
              post={{
                title: post.title,
                slug: post.slug,
                date: post.date,
                description: post.description,
                excerpt: post.excerpt,
                tags: post.tags,
                readingTime: post.readingTime,
              }}
            />
          ))}
        </div>
      </ListingViewCounts>
    </section>
  )
}
