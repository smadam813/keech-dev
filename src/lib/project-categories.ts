export const CATEGORY_LABEL = {
  'side-project': 'Side project',
  'professional': 'Professional',
  'open-source':  'Open source',
} as const

export type ProjectCategory = keyof typeof CATEGORY_LABEL
