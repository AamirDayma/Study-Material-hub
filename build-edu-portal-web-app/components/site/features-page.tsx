import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ClipboardList,
  Download,
  FileCheck2,
  FileText,
  FlaskConical,
  Layers,
  Lightbulb,
  MonitorSmartphone,
  Search,
  Smartphone,
} from 'lucide-react'
import { PageEyebrow, PrimaryLink, ScrollReveal, SectionHeading } from '@/components/site/site-chrome'

const featureDetails = [
  {
    number: '01',
    title: 'Study materials',
    description: 'Find class notes, reference material, and useful learning resources right where you expect them. Each item lives with its subject, so you can spend your time learning instead of hunting for a file.',
    label: 'A home for your notes',
    rows: [
      { icon: BookOpen, title: 'Data Structures', detail: 'Lecture notes · 12 pages', tag: 'NOTES' },
      { icon: FileText, title: 'C Programming', detail: 'Pointers and arrays · 8 pages', tag: 'GUIDE' },
      { icon: Layers, title: 'Web Development', detail: 'HTML and CSS · 6 pages', tag: 'REFERENCE' },
    ],
  },
  {
    number: '02',
    title: 'Previous year papers',
    description: 'Get familiar with exam formats and revisit questions from earlier semesters. Keep past papers connected to the right department, semester, and subject for more focused preparation.',
    label: 'Practice with context',
    rows: [
      { icon: FileText, title: 'Semester 04 · 2025', detail: 'Computer Engineering', tag: 'QUESTION PAPER' },
      { icon: FileText, title: 'Semester 04 · 2024', detail: 'Computer Engineering', tag: 'QUESTION PAPER' },
      { icon: FileText, title: 'Semester 03 · 2025', detail: 'Information Technology', tag: 'QUESTION PAPER' },
    ],
  },
  {
    number: '03',
    title: 'Practicals',
    description: 'Keep laboratory programs, experiment instructions, and practical records together. Review what you need before class or use it to revisit an idea afterwards.',
    label: 'Learn by doing',
    rows: [
      { icon: FlaskConical, title: 'Experiment 05', detail: 'Linked list traversal', tag: 'DATA STRUCTURES' },
      { icon: FileCheck2, title: 'Experiment 03', detail: 'Functions and arrays', tag: 'C PROGRAMMING' },
      { icon: Check, title: 'Lab record', detail: '6 experiments available', tag: 'PRACTICAL' },
    ],
  },
  {
    number: '04',
    title: 'Assignments',
    description: 'See coursework in the context of the subject it belongs to. With assignments gathered alongside your other resources, it is easier to stay organized throughout the semester.',
    label: 'Keep coursework in order',
    rows: [
      { icon: ClipboardList, title: 'Database normalization', detail: 'Database Management Systems', tag: 'ASSIGNMENT 02' },
      { icon: ClipboardList, title: 'Build a responsive page', detail: 'Web Development', tag: 'ASSIGNMENT 01' },
      { icon: Check, title: 'Subject collection', detail: 'Organized by semester', tag: 'IN PROGRESS' },
    ],
  },
  {
    number: '05',
    title: 'Important questions',
    description: 'Make revision more intentional with important questions organized by subject. Identify key topics, check your understanding, and spend more time on the concepts you want to strengthen.',
    label: 'Revise with purpose',
    rows: [
      { icon: Lightbulb, title: 'Explain stack operations', detail: 'Data Structures · Unit 03', tag: '8 MARKS' },
      { icon: Lightbulb, title: 'Describe database keys', detail: 'Database · Unit 02', tag: '6 MARKS' },
      { icon: Lightbulb, title: 'Outline the TCP model', detail: 'Networking · Unit 04', tag: 'IMPORTANT' },
    ],
  },
  {
    number: '06',
    title: 'Subject organization',
    description: 'Move through a familiar structure from department to semester to subject. Notes, papers, practicals, and assignments stay connected to the course where they are most useful.',
    label: 'A structure that makes sense',
    rows: [
      { icon: Layers, title: 'Computer Engineering', detail: 'Department', tag: '01' },
      { icon: BookOpen, title: 'Semester 04', detail: 'Academic term', tag: '02' },
      { icon: Search, title: 'Data Structures', detail: 'Subject resources', tag: '03' },
    ],
  },
  {
    number: '07',
    title: 'Student-friendly interface',
    description: 'A calm, straightforward interface makes it easy to see where you are and find what comes next. Spend less time navigating and more time making progress.',
    label: 'Clear from the first click',
    rows: [
      { icon: Search, title: 'Find a subject', detail: 'A few clear steps', tag: 'SIMPLE' },
      { icon: BookOpen, title: 'Open a resource', detail: 'Stay in context', tag: 'FOCUSED' },
      { icon: Check, title: 'Get to learning', detail: 'No scattered links', tag: 'READY' },
    ],
  },
  {
    number: '08',
    title: 'Mobile responsive access',
    description: 'Your study resources are designed to stay readable and easy to use on a phone, tablet, or desktop. Pick up where you are, wherever the day takes you.',
    label: 'Your resources, wherever you study',
    rows: [
      { icon: Smartphone, title: 'Materials on the move', detail: 'Comfortable on smaller screens', tag: 'MOBILE' },
      { icon: MonitorSmartphone, title: 'One connected experience', detail: 'Phone, tablet, and desktop', tag: 'RESPONSIVE' },
      { icon: Download, title: 'Open your next resource', detail: 'Keep learning in reach', tag: 'ANYTIME' },
    ],
  },
]

function FeatureMockup({ index }: { index: number }) {
  const feature = featureDetails[index]
  const FeatureIcon = feature.rows[0].icon
  const isMobile = index === 7
  const card = <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0b1f35] shadow-2xl shadow-black/25">
    <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4 sm:px-5"><div className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-lg bg-blue-400/10 text-blue-200"><FeatureIcon className="size-4" /></span><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">Study Material Hub</p><p className="mt-0.5 text-[10px] text-slate-500">{feature.label}</p></div></div><span className="grid size-8 place-items-center rounded-full border border-white/[0.08] text-slate-400"><ArrowUpRight className="size-3.5" /></span></div>
    <div className="p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><p className="text-xs font-semibold text-white">{feature.number} / {feature.title}</p><span className="rounded-full border border-blue-300/15 bg-blue-300/[0.06] px-2 py-1 text-[9px] font-medium text-blue-200">ORGANIZED</span></div><div className="flex flex-col gap-2.5">{feature.rows.map(({ icon: Icon, title, detail, tag }) => <div key={title} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#07111f]/70 p-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-blue-200"><Icon className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-100">{title}</p><p className="mt-1 truncate text-[10px] text-slate-500">{detail}</p></div><span className="hidden rounded-full bg-white/[0.04] px-2 py-1 text-[8px] font-medium tracking-wide text-slate-500 sm:inline-flex">{tag}</span></div>)}</div><div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4"><span className="inline-flex items-center gap-2 text-[10px] text-slate-500"><span className="size-1.5 rounded-full bg-blue-300" />Ready for your next step</span><span className="text-[10px] text-blue-300">Explore <ArrowRight className="ml-1 inline size-3" /></span></div></div>
  </div>
  return <div className={`relative mx-auto w-full ${isMobile ? 'max-w-[370px]' : 'max-w-[520px]'}`}><div aria-hidden="true" className="absolute -inset-8 rounded-full bg-blue-500/[0.09] blur-[65px]" />{isMobile ? <div className="relative mx-auto max-w-[300px] rounded-[2.2rem] border border-white/15 bg-[#050c16] p-2.5 shadow-2xl shadow-black/35"><div className="absolute left-1/2 top-4 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-[#050c16]" />{card}</div> : <div className="relative">{card}<div className="absolute -bottom-5 -right-3 hidden items-center gap-2 rounded-xl border border-white/10 bg-[#102338] px-3 py-2.5 shadow-xl sm:flex"><span className="grid size-7 place-items-center rounded-lg bg-blue-300/10 text-blue-200"><Check className="size-3.5" /></span><span className="text-[10px] font-medium text-slate-200">Everything in its place</span></div></div>}</div>
}

function FeatureDetail({ index }: { index: number }) {
  const feature = featureDetails[index]
  return <article className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
    <ScrollReveal className={index % 2 ? 'lg:order-2' : ''}>
      <div className="max-w-xl"><div className="flex items-center gap-4"><span className="text-xs font-semibold tracking-[0.18em] text-blue-300">{feature.number}</span><span className="h-px w-12 bg-white/15" /><span className="text-xs font-medium text-slate-500">{feature.label}</span></div><h2 className="mt-6 text-3xl font-semibold leading-[1.08] tracking-[-0.05em] text-white sm:text-4xl">{feature.title}</h2><p className="mt-5 text-base leading-7 text-slate-400">{feature.description}</p><Link href="/student/dashboard" className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition hover:text-blue-200">Explore materials <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link></div>
    </ScrollReveal>
    <ScrollReveal delay={90} className={index % 2 ? 'lg:order-1' : ''}><FeatureMockup index={index} /></ScrollReveal>
  </article>
}

export function FeaturesPage() {
  return <main className="overflow-hidden bg-[#07111f] text-white">
    <section className="relative isolate overflow-hidden border-b border-white/[0.08] px-5 pb-20 pt-20 sm:px-8 sm:pb-24 sm:pt-28 lg:pb-32"><div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 size-[34rem] rounded-full bg-blue-500/10 blur-[100px]" /><div aria-hidden="true" className="home-grid pointer-events-none absolute inset-0 opacity-30" /><div className="relative mx-auto max-w-7xl"><PageEyebrow>Thoughtfully made for learning</PageEyebrow><div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.65fr] lg:items-end"><h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl">Everything you need to study better.</h1><p className="max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">Study Material Hub brings your essential academic resources into one organized platform.</p></div><div className="mt-9"><PrimaryLink href="/student/dashboard">Explore study materials</PrimaryLink></div></div></section>
    <section className="px-5 py-20 sm:px-8 lg:py-28"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="A closer look" title="Built around the way you study." description="Each part of the platform makes one step in your academic journey a little simpler." /><div className="mt-16 flex flex-col gap-20 sm:gap-24 lg:gap-28">{featureDetails.map((feature, index) => <FeatureDetail key={feature.number} index={index} />)}</div></div></section>
    <section className="px-5 pb-20 sm:px-8 lg:pb-28"><div className="mx-auto max-w-7xl rounded-[1.7rem] border border-blue-300/15 bg-[linear-gradient(115deg,#0b1f35,#102c4a_55%,#0b1f35)] px-6 py-12 sm:px-12 sm:py-14"><div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><PageEyebrow>Learn without the clutter</PageEyebrow><h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">Find what you need. Get on with learning.</h2></div><PrimaryLink href="/student/dashboard">Explore the platform</PrimaryLink></div></div></section>
  </main>
}

