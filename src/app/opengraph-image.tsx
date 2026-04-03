import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'keech.dev'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const interBold = await readFile(
    join(process.cwd(), 'src/assets/fonts/Inter-Bold.ttf')
  )

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
          top: '108px',
          left: '168px',
          width: '880px',
          height: '430px',
          backgroundColor: '#000000',
        }} />
        {/* Card */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F5E6E8',
          border: '4px solid #000000',
          padding: '48px',
          width: '880px',
          height: '430px',
        }}>
          <div style={{
            fontSize: 72,
            fontWeight: 700,
            fontFamily: 'Inter',
            color: '#000000',
          }}>
            keech.dev
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            fontFamily: 'Inter',
            color: '#4A4A4A',
            marginTop: 20,
            textAlign: 'center',
          }}>
            Personal portfolio and blog of Adam Keech
          </div>
          {/* Teal accent bar */}
          <div style={{
            width: '120px',
            height: '6px',
            backgroundColor: '#2D8B8B',
            marginTop: 24,
          }} />
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
