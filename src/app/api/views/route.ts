import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slugsParam = searchParams.get('slugs') ?? ''
  const slugs = slugsParam.split(',').filter(Boolean)

  if (slugs.length === 0) {
    return Response.json({ counts: {} })
  }

  try {
    const keys = slugs.map((slug) => `views:${slug}`)
    const values = await redis.mget<(number | null)[]>(...keys)

    const counts: Record<string, number> = {}
    slugs.forEach((slug, i) => {
      counts[slug] = values[i] ?? 0
    })

    return Response.json({ counts })
  } catch (error) {
    console.error('[views] Redis error:', error)
    return Response.json(
      { error: 'Failed to fetch view counts' },
      { status: 500 }
    )
  }
}
