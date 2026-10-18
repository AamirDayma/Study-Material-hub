'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export type AuthMode = 'login' | 'register'

const studyMaterialHubLogo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-EFf42KwxuVtwXYhTpFeyUIkMd4ByiB.png'

export function SiteLogo({ compact = false, className = '', priority = false }: { compact?: boolean; className?: string; priority?: boolean }) {
  if (compact) {
    return <span role="img" aria-label="Study Material Hub" className={`relative block size-10 shrink-0 overflow-hidden ${className}`}>
      <Image src={studyMaterialHubLogo} alt="" width={785} height={227} unoptimized priority={priority} className="absolute left-[-19px] top-[-28px] h-[85px] w-[294px] max-w-none" />
    </span>
  }

  return <Image src={studyMaterialHubLogo} alt="Study Material Hub — Notes, Papers, Resources" width={785} height={227} unoptimized priority={priority} className={`h-auto shrink-0 ${className || 'w-[clamp(10.5rem,19vw,16.25rem)]'}`} />
}

const navigation = [
  { label: 'Home', href: '/#top', page: 'home' },
  { label: 'Features', href: '/features', page: 'features' },
  { label: 'Departments', href: '/#departments', page: 'departments' },
  { label: 'About', href: '/about', page: 'about' },
]

export function SiteHeader({ onAuth, activePage }: { onAuth?: (mode: AuthMode) => void; activePage?: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 12)
    updateScroll()
    window.addEventListener('scroll', updateScroll, { passive: true })
    return () => window.removeEventListener('scroll', updateScroll)
  }, [])

  const authAction = (mode: AuthMode, label: string, className: string) => onAuth
    ? <button type="button" onClick={() => { setMenuOpen(false); onAuth(mode) }} className={className}>{label}</button>
    : <a href={`/?view=${mode}`} onClick={() => setMenuOpen(false)} className={className}>{label}</a>

  return <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${scrolled ? 'border-white/10 bg-[#0b1220] shadow-lg shadow-black/10 backdrop-blur-2xl' : 'border-white/[0.06] bg-[#0b1220] backdrop-blur-xl'}`}>
    <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
      <Link href="/" aria-label="Study Material Hub home" onClick={() => setMenuOpen(false)}><SiteLogo priority /></Link>
      <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
        {navigation.map(({ label, href, page }) => <Link key={label} href={href} className={`text-[13px] font-medium transition-colors hover:text-white ${activePage === page ? 'text-white' : 'text-slate-400'}`}>{label}</Link>)}
      </nav>
      <div className="hidden items-center gap-5 lg:flex">
        {authAction('login', 'Sign in', 'text-[13px] font-medium text-slate-300 transition-colors hover:text-white')}
        {authAction('register', 'Create account', 'text-[13px] font-medium text-slate-300 transition-colors hover:text-white')}
        <Link href="/student/dashboard" className="group inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-blue-400">Explore Materials <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></Link>
      </div>
      <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation" className="grid size-10 place-items-center rounded-full border border-white/10 text-white transition hover:bg-white/5 lg:hidden">{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
    </div>
    {menuOpen && <nav id="mobile-navigation" className="border-t border-white/10 bg-[#07111f] px-5 py-5 lg:hidden" aria-label="Mobile navigation"><div className="mx-auto flex max-w-7xl flex-col gap-1">
      {navigation.map(({ label, href, page }) => <Link key={label} href={href} onClick={() => setMenuOpen(false)} className={`rounded-xl px-3 py-3 text-sm font-medium ${activePage === page ? 'bg-white/5 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>{label}</Link>)}
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">{authAction('login', 'Sign in', 'flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white')}
        {authAction('register', 'Create account', 'flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white')}
        <Link href="/student/dashboard" onClick={() => setMenuOpen(false)} className="col-span-2 flex items-center justify-center rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white">Explore Materials</Link>
      </div>
    </div></nav>}
  </header>
}

export function SiteFooter() {
  const resourceLinks = [
    ['Study materials', '/student/dashboard'],
    ['Previous year papers', '/student/dashboard'],
    ['Practicals', '/student/dashboard'],
    ['Assignments', '/student/dashboard'],
  ]
  return <footer className="border-t border-white/10 bg-[#0b1220] text-white">
    <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.4fr_0.8fr_1fr] lg:py-16">
      <div className="max-w-sm"><Link href="/" aria-label="Study Material Hub home"><SiteLogo className="w-60" /></Link><p className="mt-5 text-sm leading-6 text-slate-400">Learn Smarter. Study Better. Achieve More.</p><p className="mt-2 text-xs leading-5 text-slate-500">A clearer way to find the academic resources that move you forward.</p></div>
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Explore</p><div className="mt-5 flex flex-col gap-3 text-sm text-slate-300">{navigation.map(({ label, href }) => <Link key={label} href={href} className="w-fit transition-colors hover:text-white">{label}</Link>)}</div></div>
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Academic resources</p><div className="mt-5 flex flex-col gap-3 text-sm text-slate-300">{resourceLinks.map(([label, href]) => <Link key={label} href={href} className="w-fit transition-colors hover:text-white">{label}</Link>)}</div></div>
    </div>
    <div className="border-t border-white/[0.07]"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>© 2026 Study Material Hub. All rights reserved.</span><span>Made for the way students learn.</span></div></div>
  </footer>
}

export function PageEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300"><span className="size-1.5 rounded-full bg-blue-400" />{children}</p>
}

export function SectionHeading({ eyebrow, title, description, align = 'left' }: { eyebrow: string; title: string; description?: string; align?: 'left' | 'center' }) {
  return <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}><PageEyebrow>{eyebrow}</PageEyebrow><h2 className="mt-5 text-3xl font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">{title}</h2>{description && <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">{description}</p>}</div>
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-400">{children}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></Link>
}

export function OutlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.04]">{children}<ArrowRight className="size-4" /></Link>
}

export function ScrollReveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <Reveal delay={delay} className={className}>{children}</Reveal>
}

import { useRef } from 'react'

function Reveal({ children, className, delay }: { children: React.ReactNode; className: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      element.classList.add('is-visible')
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.remove('is-pending')
        element.classList.add('is-visible')
        observer.unobserve(element)
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' })
    element.style.transitionDelay = `${delay}ms`
    element.classList.add('is-pending')
    observer.observe(element)
    return () => observer.disconnect()
  }, [delay])
  return <div ref={ref} className={`scroll-reveal ${className}`}>{children}</div>
}
