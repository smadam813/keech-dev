import { redis } from '@/lib/redis'
import { validateSlug } from '@/lib/validation'
import { viewsRateLimit } from '@/lib/rate-limit'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!validateSlug(slug)) {
    return Response.json({ error: 'Invalid slug' }, { status: 400 })
  }

  try {
    const views = await redis.get<number>(`views:${slug}`) ?? 0
    return Response.json({ slug, views })
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

  const { success } = await viewsRateLimit.limit(ip)
  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const ipHash = hashIP(ip)

    // Step 1: Check/set dedup key (NX = only if not exists, 24h TTL)
    const dedupResult = await redis.set(`dedup:${slug}:${ipHash}`, '1', { ex: 86400, nx: true })

    if (dedupResult === 'OK') {
      // First visit from this IP within 24h — increment
      const viewCount = await redis.incr(`views:${slug}`)
      return Response.json({ slug, views: viewCount, deduplicated: false })
    } else {
      // Repeat visit — return current count without incrementing
      const views = await redis.get<number>(`views:${slug}`) ?? 0
      return Response.json({ slug, views, deduplicated: true })
    }
  } catch (error) {
    console.error('[views] Redis error:', error)
    return Response.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    )
  }
}
