// Fixed full-bleed watermark: hero art + color wash + gradient + vignette + grain.
// Purely decorative — aria-hidden, pointer-events none, z-index 0.
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="ambient">
      <div className="ambient__art" />
      <div className="ambient__wash" />
      <div className="ambient__gradient" />
      <div className="ambient__vignette" />
      <div className="ambient__grain" />
    </div>
  )
}
