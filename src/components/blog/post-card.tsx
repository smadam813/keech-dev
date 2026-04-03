import Link from 'next/link'
import { TagChip } from './tag-chip'
import { POST_RUNES } from '@/components/runes/rune-config'
import { PostCardViewCount } from './listing-view-counts'
import { formatDate } from '@/lib/format'

interface PostCardProps {
  post: {
    title: string
    slug: string
    date: string
    description?: string
    excerpt: string
    tags: string[]
    readingTime: number
  }
}

export function PostCard({ post }: PostCardProps) {
  const formattedDate = formatDate(post.date)

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block h-full group"
    >
      <article
        className="h-full p-6 bg-surface border-[3px] border-black shadow-brutal
                   hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]
                   transition-all duration-150 flex flex-col"
      >
        <header className="mb-4">
          <h2 className="font-display text-xl font-bold group-hover:text-accent transition-colors">
            {post.title}
          </h2>
          <div className="text-sm text-muted mt-2 flex items-center gap-2">
            <time dateTime={post.date}>{formattedDate}</time>
            <span aria-hidden="true" className="text-accent font-display font-bold">
              {POST_RUNES.separator.char}
            </span>
            <span>{post.readingTime} min read</span>
            <PostCardViewCount slug={post.slug} />
          </div>
        </header>

        <p className="text-foreground/80 mb-4 line-clamp-3">
          {post.description || post.excerpt}
        </p>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-auto">
            {post.tags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>
        )}
      </article>
    </Link>
  )
}
