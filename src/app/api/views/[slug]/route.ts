import { redis } from '@/lib/redis'
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

  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() ?? '127.0.0.1'
    const ipHash = hashIP(ip)

    const p = redis.pipeline()
    p.set(`dedup:${slug}:${ipHash}`, '1', { ex: 86400, nx: true })
    p.incr(`views:${slug}`)
    const [dedupResult, viewCount] = await p.exec<[string | null, number]>()

    const deduplicated = dedupResult === null

    return Response.json({ slug, views: viewCount, deduplicated })
  } catch (error) {
    console.error('[views] Redis error:', error)
    return Response.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    )
  }
}
