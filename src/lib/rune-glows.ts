export interface RuneGlow {
  id: string
  imgX: number // 0-1 fraction of image width (position in original 2560x1429 image)
  imgY: number // 0-1 fraction of image height
  color: 'amber' | 'teal' | 'gold'
  size: number // CSS rem value for width/height
  breathDuration: string // e.g. '5.5s', '6.8s' -- varied per rune for organic feel
}

// Image natural dimensions (hero.webp static import)
const IMG_W = 2560
const IMG_H = 1429

/**
 * All 13 runes identified in the hero image.
 * Colors assigned by Elder Futhark aett grouping:
 *   Freyr (1st aett) = amber
 *   Hagal (2nd aett) = teal
 *   Tyr   (3rd aett) = gold
 *
 * Positions are image-space fractions from visual analysis of 2560x1429 hero.
 * Sizes varied: 6-8rem for open-sky runes, 5-6rem near tree/mountains.
 * Breath durations varied between 5.0s and 7.5s using non-round values to prevent sync.
 */
export const RUNE_GLOWS: RuneGlow[] = [
  { id: 'fehu', imgX: 0.08, imgY: 0.13, color: 'amber', size: 7, breathDuration: '5.5s' },
  { id: 'ansuz', imgX: 0.17, imgY: 0.09, color: 'amber', size: 6.5, breathDuration: '6.8s' },
  { id: 'raidho1', imgX: 0.25, imgY: 0.14, color: 'amber', size: 6, breathDuration: '5.2s' },
  { id: 'raidho2', imgX: 0.32, imgY: 0.11, color: 'amber', size: 6.5, breathDuration: '7.1s' },
  { id: 'kenaz', imgX: 0.44, imgY: 0.08, color: 'amber', size: 7, breathDuration: '6.3s' },
  { id: 'tiwaz', imgX: 0.20, imgY: 0.30, color: 'gold', size: 6, breathDuration: '5.8s' },
  { id: 'isa', imgX: 0.38, imgY: 0.25, color: 'teal', size: 5.5, breathDuration: '7.3s' },
  { id: 'nauthiz', imgX: 0.53, imgY: 0.20, color: 'teal', size: 5.5, breathDuration: '5.0s' },
  { id: 'hagalaz', imgX: 0.62, imgY: 0.09, color: 'teal', size: 7, breathDuration: '6.5s' },
  { id: 'algiz', imgX: 0.68, imgY: 0.11, color: 'teal', size: 6, breathDuration: '5.3s' },
  { id: 'berkanan', imgX: 0.75, imgY: 0.12, color: 'gold', size: 6, breathDuration: '7.0s' },
  { id: 'mannaz', imgX: 0.84, imgY: 0.09, color: 'gold', size: 7, breathDuration: '5.7s' },
  { id: 'ingwaz', imgX: 0.90, imgY: 0.14, color: 'gold', size: 6.5, breathDuration: '6.2s' },
]

/**
 * Compute glow overlay positions relative to the container, accounting for
 * object-fit: cover scaling and centering.
 *
 * The formula reproduces the exact same math the browser uses for
 * object-fit: cover with centered positioning (object-position: center).
 */
export function computeGlowPositions(
  runes: RuneGlow[],
  containerW: number,
  containerH: number,
): Array<{ left: string; top: string; visible: boolean }> {
  const scale = Math.max(containerW / IMG_W, containerH / IMG_H)
  const renderedW = IMG_W * scale
  const renderedH = IMG_H * scale
  const offsetX = (renderedW - containerW) / 2
  const offsetY = (renderedH - containerH) / 2

  return runes.map((rune) => {
    const cx = rune.imgX * renderedW - offsetX
    const cy = rune.imgY * renderedH - offsetY
    // Rune is visible if its center is within the container bounds (with some margin)
    const margin = 50 // px, allow glow to extend slightly outside
    const visible =
      cx > -margin && cx < containerW + margin && cy > -margin && cy < containerH + margin
    return {
      left: `${cx}px`,
      top: `${cy}px`,
      visible,
    }
  })
}

/**
 * Non-linear entrance delay using a power curve (exponent 1.5).
 * Earlier runes enter quickly, later ones progressively slower.
 * Total cascade spans ~3000ms from first to last.
 */
export function getEntranceDelay(index: number, total: number): string {
  const totalCascade = 3000
  const fraction = total > 1 ? index / (total - 1) : 0
  return `${Math.round(totalCascade * Math.pow(fraction, 1.5))}ms`
}
