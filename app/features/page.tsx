import type { Metadata } from 'next'
import { FeaturesPage } from '@/components/site/features-page'
import { SiteFooter, SiteHeader } from '@/components/site/site-chrome'

export const metadata: Metadata = {
  title: 'Features | Study Material Hub',
  description: 'Explore the study resources and thoughtful tools that make Study Material Hub a simpler place to learn.',
}

export default function FeaturesRoute() {
  return <div className="min-h-screen bg-[#07111f] text-white"><SiteHeader activePage="features" /><FeaturesPage /><SiteFooter /></div>
}


