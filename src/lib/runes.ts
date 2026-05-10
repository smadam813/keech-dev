const RUNE = {
  othala: 'ᛟ',
  ansuz: 'ᚨ',
  kenaz: 'ᚲ',
  mannaz: 'ᛗ',
  raidho: 'ᚱ',
  sowilo: 'ᛊ',
  algiz: 'ᛉ',
  jera: 'ᛃ',
  dagaz: 'ᛞ',
} as const

export const NAV_RUNES = {
  '/': RUNE.othala,
  '/blog': RUNE.ansuz,
  '/projects': RUNE.kenaz,
  '/about': RUNE.mannaz,
} as const

export const BLOG_RUNES = { bullet: RUNE.ansuz } as const

export const PROJECT_RUNES = {
  bullet: RUNE.kenaz,
  liveDemo: RUNE.sowilo,
  source: RUNE.algiz,
} as const

export const POST_RUNES = { separator: RUNE.jera } as const

export const ABOUT_RUNES = {
  writing: RUNE.ansuz,
  craft: RUNE.kenaz,
  availability: RUNE.raidho,
  rssFeed: RUNE.sowilo,
} as const

export const DIVIDER_RUNES = { default: RUNE.dagaz } as const
