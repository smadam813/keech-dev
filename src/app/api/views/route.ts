import { read } from '@/lib/post-view-count/server'
import { validateSlugs } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slugsParam = searchParams.get('slugs') ?? ''
  const slugs = slugsParam.split(',').filter(Boolean)

  if (slugs.length === 0) {
    return Response.json({ counts: {} })
  }

  const validation = validateSlugs(slugs)
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 400 })
  }

  try {
    const counts = await read(slugs)
    return Response.json({ counts })
  } catch (error) {
    console.error('[views] Redis error:', error)
    return Response.json(
      { error: 'Failed to fetch view counts' },
      { status: 500 }
    )
  }
}
