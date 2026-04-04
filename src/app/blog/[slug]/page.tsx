import { posts } from '@/.velite'
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
  return posts.map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = posts.find(p => p.slug === slug)

  if (!post) {
    return {
      title: 'Post Not Found'
    }
  }

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
  const post = posts.find(p => p.slug === slug)

  if (!post) {
    notFound()
  }

  const formattedDate = formatDate(post.date)
  const formattedUpdated = post.updated ? formatDate(post.updated) : null

  return (
    <article className="w-full mx-auto max-w-6xl px-6 pt-12 pb-16">
      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        <span>All Blog Posts</span>
      </Link>

      {/* Mobile table of contents - visible below lg breakpoint */}
      <MobileToc entries={post.toc} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_16rem] gap-12 lg:gap-16">
        {/* Main content */}
        <div>
          <header className="mb-10">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted mb-4">
              <time dateTime={post.date}>{formattedDate}</time>
              <span aria-hidden="true" className="text-accent font-display font-bold">
                {POST_RUNES.separator.char}
              </span>
              <span>{post.readingTime} min read</span>
              <span aria-hidden="true" className="text-accent font-display font-bold">
                {POST_RUNES.separator.char}
              </span>
              <ViewCounter slug={slug} />
              {formattedUpdated && (
                <>
                  <span aria-hidden="true" className="text-accent font-display font-bold">
                    {POST_RUNES.separator.char}
                  </span>
                  <span>Updated {formattedUpdated}</span>
                </>
              )}
            </div>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <FilterChip key={tag} label={tag} href={`/blog?tags=${tag}`} />
                ))}
              </div>
            )}
          </header>

          <div className="prose">
            <MDXContent html={post.body} />
          </div>
        </div>

        {/* Sidebar with TOC - hidden on mobile */}
        <aside className="hidden lg:block">
          <TableOfContents entries={post.toc} />
        </aside>
      </div>
    </article>
  )
}
