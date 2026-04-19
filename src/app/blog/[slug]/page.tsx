import { publishedPosts } from '@/lib/posts'
import { notFound } from 'next/navigation'
import { MDXContent } from '@/components/blog/mdx-content'
import { TableOfContents } from '@/components/blog/toc'
import { MobileToc } from '@/components/blog/mobile-toc'
import { FilterChip } from '@/components/ui/filter-chip'
import { ViewCounter } from '@/components/blog/view-counter'
import { POST_RUNES } from '@/components/runes/rune-config'
import { formatDate } from '@/lib/format'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return publishedPosts.map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = publishedPosts.find(p => p.slug === slug)
  if (!post) return { title: 'Post Not Found' }

  const description = post.description || (post.excerpt?.slice(0, 160) ?? '')
  return {
    title: post.title,
    description,
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      publishedTime: post.date,
      tags: post.tags,
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = publishedPosts.find(p => p.slug === slug)
  if (!post) notFound()

  const formattedDate = formatDate(post.date)
  const formattedUpdated = post.updated ? formatDate(post.updated) : null

  return (
    <section className="w-full mx-auto" style={{ maxWidth: 'var(--page-max)' }}>
      <Link href="/blog" className="back-link">
        <ArrowLeft size={14} />
        <span>All blog posts</span>
      </Link>

      <MobileToc entries={post.toc} />

      <div className="post-detail__grid">
        <div>
          <article className="post-detail__main">
            <header>
              <h1 className="post-detail__title">{post.title}</h1>
              <div className="post-detail__meta">
                <time dateTime={post.date}>{formattedDate}</time>
                <span aria-hidden="true" className="post-detail__meta-sep">{POST_RUNES.separator.char}</span>
                <span>{post.readingTime} min read</span>
                <span aria-hidden="true" className="post-detail__meta-sep">{POST_RUNES.separator.char}</span>
                <ViewCounter slug={slug} />
                {formattedUpdated && (
                  <>
                    <span aria-hidden="true" className="post-detail__meta-sep">{POST_RUNES.separator.char}</span>
                    <span>Updated {formattedUpdated}</span>
                  </>
                )}
              </div>
              {post.tags.length > 0 && (
                <div className="tag-bar" style={{ marginTop: 4, marginBottom: 20 }}>
                  {post.tags.map((tag) => (
                    <FilterChip key={tag} label={tag} href={`/blog?tags=${encodeURIComponent(tag)}`} variant="sm" />
                  ))}
                </div>
              )}
            </header>

            <div className="prose">
              <MDXContent html={post.body} />
            </div>
          </article>
        </div>

        <aside className="post-detail__toc hidden lg:block">
          <TableOfContents entries={post.toc} />
        </aside>
      </div>
    </section>
  )
}
