'use client'

import Link from 'next/link'
import GalaxySystem from '@/app/components/home/GalaxySystem'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ClipboardList,
  Cpu,
  FileText,
  FlaskConical,
  Layers,
  Lightbulb,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import {
  OutlineLink,
  PageEyebrow,
  PrimaryLink,
  ScrollReveal,
  SectionHeading,
  SiteFooter,
  SiteHeader,
  type AuthMode,
} from '@/components/site/site-chrome'

const departments = [
  {
    slug: 'computer-engineering',
    number: '01',
    name: 'Computer Engineering',
    description: 'A clear home for programming, systems, and the ideas behind them.',
    subjects: ['C Programming', 'Data Structures', 'Python', 'Java', 'Web Development'],
    icon: Cpu,
  },
  {
    slug: 'information-technology',
    number: '02',
    name: 'Information Technology',
    description: 'The resources you need across software, data, and connected systems.',
    subjects: ['Programming', 'Database', 'Web Development', 'Data Structures', 'Networking'],
    icon: Network,
  },
]

const stats = [
  { value: '01+', label: 'Departments' },
  { value: '10+', label: 'Subjects' },
  { value: '100+', label: 'Study resources' },
  { value: '24/7', label: 'Access' },
]

const steps = [
  { number: '01', title: 'Choose your department', description: 'Start with your engineering or diploma department.', icon: Cpu },
  { number: '02', title: 'Select semester', description: 'Find the semester you are studying right now.', icon: CalendarDays },
  { number: '03', title: 'Choose subject', description: 'Open the exact subject you need to work on.', icon: BookOpen },
  { number: '04', title: 'Start learning', description: 'Use notes, papers, practicals, and assignments.', icon: Sparkles },
]

const homeFeatures = [
  { icon: BookOpen, title: 'Study material', description: 'Keep your notes and learning resources close at hand.' },
  { icon: FileText, title: 'Previous year papers', description: 'Prepare with past examination papers, organized by subject.' },
  { icon: FlaskConical, title: 'Practicals', description: 'Find laboratory programs, records, and practical guides.' },
  { icon: ClipboardList, title: 'Assignments', description: 'Keep coursework easy to find throughout the semester.' },
  { icon: Lightbulb, title: 'Important questions', description: 'Focus your revision on the topics that matter.' },
  { icon: Layers, title: 'Subject-wise organization', description: 'Move naturally from department to semester to subject.' },
]

const benefits = [
  { icon: Layers, title: 'Organized', description: 'Everything follows a clear academic structure.' },
  { icon: Search, title: 'Accessible', description: 'Find the resources you need from any device.' },
  { icon: ShieldCheck, title: 'Focused', description: 'Spend less time searching and more time learning.' },
  { icon: Users, title: 'Student-friendly', description: 'A simple interface built around real academic needs.' },
]

function HomeHero({ onAuth }: { onAuth: (mode: AuthMode) => void }) {
  return <section className="relative isolate min-h-[calc(100svh-76px)] overflow-hidden bg-[#07111f] text-white">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_22%,rgba(59,130,246,.12),transparent_34%),radial-gradient(ellipse_at_82%_53%,rgba(59,130,246,.13),transparent_36%)]" />
    <div className="mx-auto grid min-h-[calc(100svh-76px)] max-w-7xl items-center gap-8 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:pb-20 lg:pt-12">
      <div className="relative z-10 max-w-2xl py-7">
        <PageEyebrow>Your complete academic resource hub</PageEyebrow>
        <h1 className="mt-7 text-[clamp(3rem,5.8vw,5.85rem)] font-semibold leading-[0.95] tracking-[-0.065em] text-white">Learn smarter.<br /><span className="text-slate-300">Study better.</span><br /><span className="text-blue-300">Achieve more.</span></h1>
        <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">Study Material Hub brings notes, practicals, assignments, previous-year papers, and essential study resources together in one simple platform.</p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => onAuth('login')} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-400">Explore study materials <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></button>
          <OutlineLink href="#departments">Explore departments</OutlineLink>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500"><span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-blue-300" />Built for diploma and engineering</span><span>Simple by design. Useful every day.</span></div>
      </div>
      <GalaxySystem />
    </div>
    <a href="#overview" className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 transition hover:text-white sm:flex"><span>Scroll to explore</span><ArrowDown className="size-3.5" /></a>
  </section>
}

function StatsSection() {
  return <section id="overview" aria-label="Study Material Hub overview" className="border-y border-white/[0.08] bg-[#0a1928] px-5 sm:px-8"><div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-white/[0.08] sm:grid-cols-4 sm:divide-y-0">{stats.map(({ value, label }, index) => <ScrollReveal key={label} delay={index * 70} className="py-7 sm:px-7 sm:py-8"><p className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">{value}</p><p className="mt-2 text-xs font-medium text-slate-500 sm:text-sm">{label}</p></ScrollReveal>)}</div></section>
}

function DepartmentCard({ department }: { department: (typeof departments)[number] }) {
  const Icon = department.icon
  return <Link href={`/student/dashboard?view=subjects&department=${department.slug}`} className="group relative flex min-h-[330px] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b1f35] p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-300/35 hover:bg-[#0d243d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:p-8">
    <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-blue-400/[0.07] blur-3xl transition duration-500 group-hover:bg-blue-400/[0.13]" />
    <div className="relative flex items-center justify-between"><span className="grid size-12 place-items-center rounded-2xl border border-blue-300/15 bg-blue-300/[0.08] text-blue-200"><Icon className="size-5" /></span><span className="text-xs font-semibold tracking-[0.18em] text-slate-600">{department.number}</span></div>
    <div className="relative mt-8"><h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">{department.name}</h3><p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{department.description}</p></div>
    <div className="relative mt-6 flex flex-wrap gap-2">{department.subjects.map((subject) => <span key={subject} className="rounded-full border border-white/[0.09] bg-white/[0.025] px-3 py-1.5 text-[11px] text-slate-400">{subject}</span>)}</div>
    <div className="relative mt-auto flex items-center justify-between border-t border-white/[0.08] pt-5"><span className="text-xs font-medium text-slate-500">{String(department.subjects.length).padStart(2, '0')} subjects to explore</span><span className="grid size-9 place-items-center rounded-full border border-white/10 text-slate-300 transition group-hover:border-blue-300/40 group-hover:bg-blue-400 group-hover:text-white"><ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span></div>
  </Link>
}

function DepartmentsSection() {
  return <section id="departments" className="bg-[#07111f] px-5 py-24 sm:px-8 lg:py-32"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end"><SectionHeading eyebrow="Built around your course" title="Everything organized. Nothing lost." description="Find your academic resources through a simple department-to-subject structure." /><p className="max-w-sm pb-1 text-sm leading-6 text-slate-500">Start with your department. From there, follow the same structure you already know: semester, subject, and the material you need.</p></div><div className="mt-12 grid gap-5 lg:grid-cols-2">{departments.map((department, index) => <ScrollReveal key={department.slug} delay={index * 100}><DepartmentCard department={department} /></ScrollReveal>)}</div><p className="mt-5 text-xs text-slate-600">Designed to grow as more departments and subjects join the hub.</p></div></section>
}

function HowItWorksSection() {
  return <section className="border-y border-white/[0.07] bg-[#0a1928] px-5 py-24 sm:px-8 lg:py-28"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="A clear path forward" title="Your study material. Simplified." description="Four small steps take you from your course to the resource you came for." /><div className="relative mt-14 grid gap-8 before:absolute before:bottom-8 before:left-6 before:top-6 before:w-px before:bg-white/10 md:grid-cols-4 md:gap-5 md:before:bottom-auto md:before:left-[12.5%] md:before:right-[12.5%] md:before:top-6 md:before:h-px md:before:w-auto">{steps.map(({ number, title, description, icon: Icon }, index) => <ScrollReveal key={number} delay={index * 85} className="relative"><div className="relative flex gap-4 md:flex-col md:items-center md:gap-6 md:text-center"><span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-blue-300/15 bg-blue-300/[0.08] text-blue-200"><Icon className="size-5" /></span><div><p className="text-[10px] font-semibold tracking-[0.18em] text-blue-300">STEP {number}</p><h3 className="mt-3 text-lg font-semibold tracking-tight text-white">{title}</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">{description}</p></div></div></ScrollReveal>)}</div></div></section>
}

function FeaturePreviewSection() {
  return <section id="features" className="bg-[#07111f] px-5 py-24 sm:px-8 lg:py-32"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end"><SectionHeading eyebrow="Tools for every semester" title="Everything you need for your semester." description="One calm, organized place for the resources that help you learn, prepare, and keep moving." /><Link href="/features" className="group inline-flex w-fit shrink-0 items-center gap-2 pb-1 text-sm font-semibold text-blue-300 transition hover:text-blue-200">Explore all features <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link></div><div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{homeFeatures.map(({ icon: Icon, title, description }, index) => <ScrollReveal key={title} delay={index * 55}><article className="group h-full rounded-2xl border border-white/[0.09] bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-300/25 hover:bg-white/[0.04]"><span className="grid size-11 place-items-center rounded-xl border border-blue-300/10 bg-blue-300/[0.07] text-blue-200 transition group-hover:border-blue-300/25 group-hover:bg-blue-400/15"><Icon className="size-5" /></span><h3 className="mt-6 text-lg font-semibold tracking-tight text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></article></ScrollReveal>)}</div></div></section>
}

function LearningFlowShowcase() {
  const path = [
    { number: '01', label: 'Department', value: 'Computer Engineering', icon: Cpu },
    { number: '02', label: 'Semester', value: 'Semester 04', icon: CalendarDays },
    { number: '03', label: 'Subject', value: 'Data Structures', icon: BookOpen },
  ]
  const resources = [
    { label: 'Study material', icon: BookOpen },
    { label: 'Papers', icon: FileText },
    { label: 'Practicals', icon: FlaskConical },
    { label: 'Assignments', icon: ClipboardList },
  ]
  return <div className="relative mx-auto w-full max-w-xl">
    <div aria-hidden="true" className="absolute -inset-10 rounded-full bg-blue-500/10 blur-[80px]" />
    <div className="relative rounded-[1.5rem] border border-white/10 bg-[#0b1f35] p-5 shadow-2xl shadow-black/25 sm:p-7">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Your resource path</p><p className="mt-1 text-sm font-semibold text-white">A simple way to find your next step</p></div><span className="grid size-9 place-items-center rounded-xl bg-blue-400/10 text-blue-200"><Search className="size-4" /></span></div>
      <div className="mt-5 flex flex-col gap-2">{path.map(({ number, label, value, icon: Icon }, index) => <div key={label}><div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#07111f]/65 px-3 py-3"><span className="grid size-9 place-items-center rounded-lg bg-white/[0.04] text-blue-200"><Icon className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-[10px] text-slate-500">{label}</p><p className="mt-0.5 truncate text-xs font-semibold text-slate-100">{value}</p></div><span className="text-[10px] font-medium text-slate-600">{number}</span></div>{index < path.length - 1 && <div className="ml-[1.15rem] h-3 w-px bg-blue-300/25" />}</div>)}</div>
      <div className="mt-3 grid grid-cols-2 gap-2">{resources.map(({ label, icon: Icon }) => <div key={label} className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-[11px] font-medium text-slate-300"><Icon className="size-3.5 text-blue-200" />{label}</div>)}</div>
      <div className="mt-5 flex items-center gap-2 border-t border-white/[0.08] pt-4 text-[10px] text-slate-500"><Check className="size-3.5 text-blue-300" />Everything in the right place, ready when you need it.</div>
    </div>
  </div>
}

function FeatureShowcaseSection() {
  return <section className="overflow-hidden border-y border-white/[0.08] bg-[#0a1928] px-5 py-24 sm:px-8 lg:py-32"><div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16"><ScrollReveal><div><PageEyebrow>From course to coursework</PageEyebrow><h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">From your department to your next exam.</h2><p className="mt-6 max-w-lg text-base leading-7 text-slate-400">Study Material Hub makes it easier to find exactly what you need without searching through scattered files, messages, and links.</p><div className="mt-8"><PrimaryLink href="/features">See how it works</PrimaryLink></div></div></ScrollReveal><ScrollReveal delay={100}><LearningFlowShowcase /></ScrollReveal></div></section>
}

function WhySection() {
  return <section className="bg-[#07111f] px-5 py-24 sm:px-8 lg:py-32"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="Made for the learning journey" title="Built for students. Designed for simplicity." description="A useful academic platform should get out of your way and help you move forward." /><div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(({ icon: Icon, title, description }, index) => <ScrollReveal key={title} delay={index * 65}><article className="h-full border-t border-white/10 py-6 pr-4"><span className="grid size-10 place-items-center rounded-xl bg-blue-300/[0.08] text-blue-200"><Icon className="size-5" /></span><h3 className="mt-6 text-base font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></article></ScrollReveal>)}</div></div></section>
}

function TeachersSection() {
  return <section className="bg-[#0a1928] px-5 py-16 sm:px-8 lg:py-20"><div className="mx-auto flex max-w-7xl flex-col gap-8 border-y border-white/[0.08] py-9 sm:flex-row sm:items-center sm:justify-between sm:py-11"><div className="flex max-w-2xl items-start gap-4"><span className="mt-1 grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-blue-200"><Users className="size-5" /></span><div><PageEyebrow>For teachers and institutes</PageEyebrow><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">A better way to organize academic resources.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Keep subject resources, practicals, assignments, and important study material organized for students.</p></div></div><PrimaryLink href="/features">Explore the platform</PrimaryLink></div></section>
}

function FinalCta() {
  return <section className="px-5 py-20 sm:px-8 lg:py-28"><div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-blue-300/15 bg-[linear-gradient(115deg,#0b1f35_0%,#102c4a_55%,#0b1f35_100%)] px-6 py-12 sm:px-12 sm:py-16 lg:px-16"><div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-36 size-80 rounded-full bg-blue-400/20 blur-[90px]" /><div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-1/3 h-px w-1/2 bg-gradient-to-r from-transparent via-blue-300/40 to-transparent" /><div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><PageEyebrow>Start where you are</PageEyebrow><h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl">Ready to study smarter?</h2><p className="mt-4 max-w-xl text-base leading-7 text-slate-300">Explore your department and find the resources you need for your next class, practical, or examination.</p></div><Link href="/student/dashboard" className="group inline-flex min-h-12 w-fit shrink-0 items-center justify-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-400">Explore study materials <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link></div></div></section>
}

export function HomePage({ onAuth }: { onAuth: (mode: AuthMode) => void }) {
  return <div className="min-h-screen overflow-x-hidden bg-[#07111f] text-white">
    <SiteHeader onAuth={onAuth} activePage="home" />
    <main id="top">
      <HomeHero onAuth={onAuth} />
      <StatsSection />
      <DepartmentsSection />
      <HowItWorksSection />
      <FeaturePreviewSection />
      <FeatureShowcaseSection />
      <WhySection />
      <TeachersSection />
      <FinalCta />
    </main>
    <SiteFooter />
  </div>
}

