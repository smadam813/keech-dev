import Link from 'next/link'
import { FilterChip } from '@/components/ui/filter-chip'
import { POST_RUNES } from '@/lib/runes'
import { PostViewCount } from '@/lib/post-view-count/client'
import { formatDate } from '@/lib/format'
import type { Post } from '@/lib/posts'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const formattedDate = formatDate(post.date)

  return (
    <Link href={`/blog/${post.slug}`} className="block h-full group">
      <article className="card">
        <header>
          <h2 className="card__title">{post.title}</h2>
          <div className="card__meta">
            <time dateTime={post.date}>{formattedDate}</time>
            <span aria-hidden="true" className="card__meta-sep">{POST_RUNES.separator}</span>
            <span>{post.readingTime} min read</span>
            <span aria-hidden="true" className="card__meta-sep">{POST_RUNES.separator}</span>
            <PostViewCount slug={post.slug} />
          </div>
        </header>

        <p className="card__excerpt">{post.description || post.excerpt}</p>

        {post.tags.length > 0 && (
          <div className="card__tags">
            {post.tags.map((tag) => (
              <FilterChip key={tag} label={tag} variant="sm" />
            ))}
          </div>
        )}
      </article>
    </Link>
  )
}
