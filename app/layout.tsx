import { Analytics } from '@vercel/analytics/next'
import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Study Material Hub — Learn smarter. Study better. Achieve more.',
  description: 'Everything you need to learn in one place. Explore notes, practicals, assignments, previous-year papers, and academic resources.',
  icons: { icon: '/eduportal-mark.svg' },
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#07111f',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body className={`${inter.className} antialiased`}>{children}<Toaster position="top-right" toastOptions={{ duration: 3200 }} />{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
