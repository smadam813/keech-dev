import type { Metadata } from 'next'
import { Hero } from '@/components/hero'

export const metadata: Metadata = {
  description: 'Welcome to keech.dev - the personal portfolio and blog of Adam Keech, a software developer passionate about building tools and exploring technology.',
}

export default function Home() {
  return <Hero />
}
