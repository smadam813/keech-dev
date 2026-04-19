export interface TagHue {
  name: 'rose' | 'mint' | 'amber' | 'lavender' | 'teal' | 'clay'
  bg: string
  fg: string
  border: string
}

export const TAG_HUE_PALETTE = [
  { name: 'rose',     bg: 'rgba(228, 164, 172, 0.14)', fg: '#e4a4ac', border: 'rgba(228,164,172,0.30)' },
  { name: 'mint',     bg: 'rgba(141, 203, 188, 0.14)', fg: '#8dcbbc', border: 'rgba(141,203,188,0.30)' },
  { name: 'amber',    bg: 'rgba(224, 188, 121, 0.14)', fg: '#e0bc79', border: 'rgba(224,188,121,0.30)' },
  { name: 'lavender', bg: 'rgba(178, 167, 207, 0.14)', fg: '#b2a7cf', border: 'rgba(178,167,207,0.30)' },
  { name: 'teal',     bg: 'rgba(120, 188, 188, 0.14)', fg: '#78bcbc', border: 'rgba(120,188,188,0.30)' },
  { name: 'clay',     bg: 'rgba(207, 145, 125, 0.14)', fg: '#cf917d', border: 'rgba(207,145,125,0.30)' },
] as const satisfies readonly TagHue[]

export function hashTag(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function paletteFor(tag: string): TagHue {
  return TAG_HUE_PALETTE[hashTag(tag) % TAG_HUE_PALETTE.length]
}
