import { redis } from '@/lib/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { createHash } from 'crypto'

const VIEWS_PREFIX = 'views:'
const DEDUP_PREFIX = 'dedup:'
const DEDUP_TTL_SECONDS = 86400

const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'ratelimit:views',
})

function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

export class RateLimitError extends Error {
  constructor() {
    super('Rate limit exceeded')
    this.name = 'RateLimitError'
  }
}

export async function record(slug: string, ip: string): Promise<{ views: number; deduplicated: boolean }> {
  const { success } = await rateLimit.limit(ip)
  if (!success) {
    throw new RateLimitError()
  }

  const ipHash = hashIP(ip)
  const dedupResult = await redis.set(`${DEDUP_PREFIX}${slug}:${ipHash}`, '1', { ex: DEDUP_TTL_SECONDS, nx: true })

  if (dedupResult === 'OK') {
    const viewCount = await redis.incr(`${VIEWS_PREFIX}${slug}`)
    return { views: viewCount, deduplicated: false }
  } else {
    const views = await redis.get<number>(`${VIEWS_PREFIX}${slug}`) ?? 0
    return { views, deduplicated: true }
  }
}

export async function read(slugs: string | string[]): Promise<Record<string, number>> {
  const slugArray = Array.isArray(slugs) ? slugs : [slugs]
  if (slugArray.length === 0) return {}

  const keys = slugArray.map(s => `${VIEWS_PREFIX}${s}`)
  const values = await redis.mget<(number | null)[]>(...keys)

  const counts: Record<string, number> = {}
  slugArray.forEach((slug, i) => {
    counts[slug] = values[i] ?? 0
  })
  return counts
}
