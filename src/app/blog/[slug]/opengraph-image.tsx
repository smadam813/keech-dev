import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { notFound } from 'next/navigation'
import { publishedPosts } from '@/lib/posts'
import { formatDate } from '@/lib/format'

export const alt = 'Blog post'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = publishedPosts.find(p => p.slug === slug)
  if (!post) {
    notFound()
  }

  const interBold = await readFile(
    join(process.cwd(), 'src/assets/fonts/Inter-Bold.ttf')
  )

  const title = post.title
  const date = post.date ? formatDate(post.date) : ''

  return new ImageResponse(
    (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E8B4B8',
        padding: '60px',
      }}>
        {/* Offset shadow layer */}
        <div style={{
          display: 'flex',
          position: 'absolute',
          top: '72px',
          left: '72px',
          width: '1072px',
          height: '502px',
          backgroundColor: '#000000',
        }} />
        {/* Card */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#F5E6E8',
          border: '4px solid #000000',
          padding: '48px',
          width: '1072px',
          height: '502px',
        }}>
          {/* Title area */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              fontSize: title.length > 60 ? 36 : title.length > 40 ? 44 : 52,
              fontWeight: 700,
              fontFamily: 'Inter',
              color: '#000000',
              lineHeight: 1.2,
            }}>
              {title}
            </div>
            {date && (
              <div style={{
                fontSize: 22,
                fontFamily: 'Inter',
                fontWeight: 700,
                color: '#4A4A4A',
                marginTop: 16,
              }}>
                {date}
              </div>
            )}
          </div>
          {/* Footer with branding */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{
              fontSize: 24,
              fontWeight: 700,
              fontFamily: 'Inter',
              color: '#2D8B8B',
            }}>
              keech.dev
            </div>
            {/* Teal accent bar */}
            <div style={{
              width: '80px',
              height: '6px',
              backgroundColor: '#2D8B8B',
            }} />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Inter', data: interBold, style: 'normal' as const, weight: 700 as const },
      ],
    }
  )
}

export function generateStaticParams() {
  return publishedPosts.map(post => ({ slug: post.slug }))
}
