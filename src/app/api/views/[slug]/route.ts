import { record, read, RateLimitError } from '@/lib/post-view-count/server'
import { validateSlug } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!validateSlug(slug)) {
    return Response.json({ error: 'Invalid slug' }, { status: 400 })
  }

  try {
    const counts = await read(slug)
    return Response.json({ slug, views: counts[slug] })
  } catch (error) {
    console.error('[views] Redis error:', error)
    return Response.json(
      { error: 'Failed to fetch view count' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!validateSlug(slug)) {
    return Response.json({ error: 'Invalid slug' }, { status: 400 })
  }

  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? '127.0.0.1'

  try {
    const result = await record(slug, ip)
    return Response.json({ slug, ...result })
  } catch (error) {
    if (error instanceof RateLimitError) {
      return Response.json({ error: 'Too many requests' }, { status: 429 })
    }
    console.error('[views] Redis error:', error)
    return Response.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    )
  }
}
