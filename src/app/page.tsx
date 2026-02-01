import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Welcome to keech.dev - the personal portfolio and blog of Adam Keech, a software developer passionate about building tools and exploring technology.',
}

export default function Home() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 md:pb-16">
      <div className="text-center scroll-reveal">
        <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight">
          keech
          <span className="text-accent">.dev</span>
        </h1>
      </div>
    </div>
  )
}
