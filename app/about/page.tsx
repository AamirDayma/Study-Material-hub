import type { Metadata } from 'next'
import { AboutPage } from '@/components/site/about-page'
import { SiteFooter, SiteHeader } from '@/components/site/site-chrome'

export const metadata: Metadata = {
  title: 'About | Study Material Hub',
  description: 'Learn about the mission, vision, and values behind Study Material Hub.',
}

export default function AboutRoute() {
  return <div className="min-h-screen bg-[#07111f] text-white"><SiteHeader activePage="about" /><AboutPage /><SiteFooter /></div>
}


