import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '@/lib/redis'

export const viewsRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'ratelimit:views',
})
