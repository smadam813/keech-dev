// Elder Futhark Rune Configuration
// Single source of truth for all rune data and context mappings.
// Server-safe module (no client directive needed).

export interface Rune {
  char: string // Unicode character (e.g., '\u16A0')
  code: string // Unicode code point string (e.g., 'U+16A0')
  name: string // Proto-Germanic name (e.g., 'Fehu')
  meaning: string // Primary meaning (e.g., 'Wealth')
  keywords: string[] // 2-3 keywords for the rune
  aett: 1 | 2 | 3 // Which aett (group of 8)
}

/**
 * All 24 Elder Futhark runes, keyed by lowercase Proto-Germanic name.
 * Ordered within each aett (Freyr's, Hagal's, Tyr's).
 */
export const ELDER_FUTHARK = {
  // ── First Aett (Freyr's) ──────────────────────────────────────────────
  fehu: {
    char: '\u16A0',
    code: 'U+16A0',
    name: 'Fehu',
    meaning: 'Wealth',
    keywords: ['abundance', 'success', 'resources'],
    aett: 1,
  },
  uruz: {
    char: '\u16A2',
    code: 'U+16A2',
    name: 'Uruz',
    meaning: 'Strength',
    keywords: ['endurance', 'power', 'vitality'],
    aett: 1,
  },
  thurisaz: {
    char: '\u16A6',
    code: 'U+16A6',
    name: 'Thurisaz',
    meaning: 'Protection',
    keywords: ['defense', 'conflict', 'thorn'],
    aett: 1,
  },
  ansuz: {
    char: '\u16A8',
    code: 'U+16A8',
    name: 'Ansuz',
    meaning: 'Wisdom',
    keywords: ['communication', 'inspiration', 'divine speech'],
    aett: 1,
  },
  raidho: {
    char: '\u16B1',
    code: 'U+16B1',
    name: 'Raidho',
    meaning: 'Journey',
    keywords: ['travel', 'movement', 'progress'],
    aett: 1,
  },
  kenaz: {
    char: '\u16B2',
    code: 'U+16B2',
    name: 'Kenaz',
    meaning: 'Knowledge',
    keywords: ['craft', 'enlightenment', 'creativity'],
    aett: 1,
  },
  gebo: {
    char: '\u16B7',
    code: 'U+16B7',
    name: 'Gebo',
    meaning: 'Gift',
    keywords: ['exchange', 'generosity', 'reciprocity'],
    aett: 1,
  },
  wunjo: {
    char: '\u16B9',
    code: 'U+16B9',
    name: 'Wunjo',
    meaning: 'Joy',
    keywords: ['harmony', 'success', 'celebration'],
    aett: 1,
  },

  // ── Second Aett (Hagal's) ─────────────────────────────────────────────
  hagalaz: {
    char: '\u16BA',
    code: 'U+16BA',
    name: 'Hagalaz',
    meaning: 'Disruption',
    keywords: ['change', 'catalyst', 'hail'],
    aett: 2,
  },
  nauthiz: {
    char: '\u16BE',
    code: 'U+16BE',
    name: 'Nauthiz',
    meaning: 'Need',
    keywords: ['necessity', 'constraint', 'hardship'],
    aett: 2,
  },
  isa: {
    char: '\u16C1',
    code: 'U+16C1',
    name: 'Isa',
    meaning: 'Ice',
    keywords: ['stillness', 'patience', 'preservation'],
    aett: 2,
  },
  jera: {
    char: '\u16C3',
    code: 'U+16C3',
    name: 'Jera',
    meaning: 'Harvest',
    keywords: ['rewards', 'cycles', 'fruition'],
    aett: 2,
  },
  eihwaz: {
    char: '\u16C7',
    code: 'U+16C7',
    name: 'Eihwaz',
    meaning: 'Renewal',
    keywords: ['transformation', 'initiation', 'yew tree'],
    aett: 2,
  },
  perthro: {
    char: '\u16C8',
    code: 'U+16C8',
    name: 'Perthro',
    meaning: 'Mystery',
    keywords: ['secrets', 'chance', 'destiny'],
    aett: 2,
  },
  algiz: {
    char: '\u16C9',
    code: 'U+16C9',
    name: 'Algiz',
    meaning: 'Guardian',
    keywords: ['protection', 'sanctuary', 'instinct'],
    aett: 2,
  },
  sowilo: {
    char: '\u16CA',
    code: 'U+16CA',
    name: 'Sowilo',
    meaning: 'Sun',
    keywords: ['victory', 'illumination', 'achievement'],
    aett: 2,
  },

  // ── Third Aett (Tyr's) ────────────────────────────────────────────────
  tiwaz: {
    char: '\u16CF',
    code: 'U+16CF',
    name: 'Tiwaz',
    meaning: 'Justice',
    keywords: ['leadership', 'honor', 'Tyr'],
    aett: 3,
  },
  berkano: {
    char: '\u16D2',
    code: 'U+16D2',
    name: 'Berkano',
    meaning: 'Growth',
    keywords: ['nurturing', 'creativity', 'birch'],
    aett: 3,
  },
  ehwaz: {
    char: '\u16D6',
    code: 'U+16D6',
    name: 'Ehwaz',
    meaning: 'Partnership',
    keywords: ['progress', 'trust', 'horse'],
    aett: 3,
  },
  mannaz: {
    char: '\u16D7',
    code: 'U+16D7',
    name: 'Mannaz',
    meaning: 'Identity',
    keywords: ['community', 'social order', 'human'],
    aett: 3,
  },
  laguz: {
    char: '\u16DA',
    code: 'U+16DA',
    name: 'Laguz',
    meaning: 'Flow',
    keywords: ['intuition', 'adaptability', 'water'],
    aett: 3,
  },
  ingwaz: {
    char: '\u16DC',
    code: 'U+16DC',
    name: 'Ingwaz',
    meaning: 'Potential',
    keywords: ['fertility', 'completion', 'Ing'],
    aett: 3,
  },
  othala: {
    char: '\u16DF',
    code: 'U+16DF',
    name: 'Othala',
    meaning: 'Heritage',
    keywords: ['inheritance', 'ancestry', 'legacy'],
    aett: 3,
  },
  dagaz: {
    char: '\u16DE',
    code: 'U+16DE',
    name: 'Dagaz',
    meaning: 'Dawn',
    keywords: ['new beginnings', 'awakening', 'breakthrough'],
    aett: 3,
  },
} as const satisfies Record<string, Rune>

// ── Context Mappings ──────────────────────────────────────────────────────
// Runes chosen for symbolic association with each site section.

/** Navigation runes — journey/identity theme */
export const NAV_RUNES = {
  '/': ELDER_FUTHARK.othala, // Home = heritage, one's domain
  '/blog': ELDER_FUTHARK.ansuz, // Blog = wisdom, communication
  '/projects': ELDER_FUTHARK.kenaz, // Projects = craft, creative fire
  '/about': ELDER_FUTHARK.mannaz, // About = self, identity
} as const

/** Blog section runes — wisdom/knowledge theme */
export const BLOG_RUNES = {
  bullet: ELDER_FUTHARK.ansuz, // Wisdom for knowledge items
  divider: ELDER_FUTHARK.kenaz, // Enlightenment between sections
} as const

/** Project section runes — craft/creation theme */
export const PROJECT_RUNES = {
  bullet: ELDER_FUTHARK.kenaz, // Craft for project items
  divider: ELDER_FUTHARK.fehu, // Wealth of work between sections
} as const

/** General/shared runes */
export const DIVIDER_RUNES = {
  default: ELDER_FUTHARK.dagaz, // New beginnings — transition between sections
} as const

/** Background texture runes */
export const TEXTURE_RUNES = [
  ELDER_FUTHARK.raidho, // Journey
  ELDER_FUTHARK.algiz, // Protection
  ELDER_FUTHARK.wunjo, // Joy
] as const
