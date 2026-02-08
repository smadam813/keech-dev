import Image from 'next/image'
import heroImage from '../../public/images/hero.webp'

export function Hero() {
  return (
    <section className="relative flex-1 flex items-center justify-center min-h-[calc(100svh-4rem)] overflow-hidden">
      {/* Background image with automatic blur placeholder from static import */}
      <Image
        src={heroImage}
        alt=""
        fill
        sizes="100vw"
        preload
        placeholder="blur"
        className="object-cover"
        quality={80}
      />

      {/* Dark gradient scrim for WCAG AA text contrast */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.55) 100%)'
        }}
      />

      {/* Centered text overlay */}
      <div className="relative z-10 text-center animate-on-load">
        <h1 className="font-display font-bold text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-white">
          keech
          <span className="text-accent-light">.dev</span>
        </h1>
      </div>
    </section>
  )
}
