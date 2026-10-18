'use client'

import ParticleShowcase from '@/app/components/ParticleShowcase'
import { HomePage } from '@/components/site/home-page'
import { SiteHeader, SiteLogo } from '@/components/site/site-chrome'
import { useEffect, useState } from 'react'
import { ArrowRight, BarChart3, BookOpen, Building2, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, FileText, FlaskConical, LayoutDashboard, LogOut, Mail, Menu, Plane, ShieldCheck, Sparkles, Users, WandSparkles, X } from 'lucide-react'
import { dashboardForRole, friendlyAuthError, getProfile, recordSuccessfulLogin, signOut, supabase } from '@/lib/supabaseClient'

type Role = 'student' | 'admin'
type View = 'home' | 'login' | 'register' | 'student' | 'admin' | '/student/dashboard' | '/admin/dashboard'

const featureItems = [
  { icon: BookOpen, title: 'One focused learning space', description: 'Keep courses, notes, materials, and progress organized in one calm workspace.', tag: 'For students' },
  { icon: BarChart3, title: 'Progress you can understand', description: 'See attendance, test attempts, learning streaks, and the next best step at a glance.', tag: 'Stay on track' },
  { icon: Users, title: 'Built for every role', description: 'Give students a simple experience while admins get the tools to manage their community.', tag: 'For institutions' },
  { icon: WandSparkles, title: 'Smarter exam preparation', description: 'Turn your learning materials into focused practice with guided exam generation.', tag: 'Learn faster' },
  { icon: ShieldCheck, title: 'Private by design', description: 'Role-aware access keeps student records and administration tools protected.', tag: 'Secure access' },
  { icon: CalendarDays, title: 'Everything in rhythm', description: 'Manage semesters, deadlines, leave applications, and attendance without the busywork.', tag: 'Stay organized' },
]

function FeaturesSection() {
  return <section id="features" className="relative overflow-hidden border-y border-border/70 bg-muted/30 px-5 py-24 lg:px-8 lg:py-32"><div className="pointer-events-none absolute left-1/2 top-0 size-[30rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" /><div className="relative mx-auto max-w-6xl"><div className="mx-auto max-w-2xl text-center"><p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Everything you need to grow</p><h2 className="text-4xl font-bold tracking-tight sm:text-5xl">A better way to move through learning.</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">From the first lesson to the final exam, Study Material Hub keeps the important things clear, connected, and within reach.</p></div><div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{featureItems.map(({ icon: Icon, title, description, tag }, index) => <article key={title} className={`group rounded-3xl border border-border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 ${index === 0 ? 'lg:row-span-2 lg:p-8' : ''}`}><div className="flex items-start justify-between gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="size-6" /></span><span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">{tag}</span></div><h3 className="mt-8 text-xl font-semibold tracking-tight">{title}</h3><p className="mt-3 leading-7 text-muted-foreground">{description}</p>{index === 0 && <div className="mt-10 rounded-2xl border border-primary/10 bg-primary/5 p-4"><div className="flex items-center justify-between text-sm"><span className="font-medium">Weekly progress</span><span className="font-bold text-primary">82%</span></div><div className="mt-3 h-2 rounded-full bg-primary/10"><div className="h-2 w-[82%] rounded-full bg-primary" /></div><p className="mt-3 text-xs text-muted-foreground">You are building steady momentum.</p></div>}</article>)}</div><div className="mt-14 flex flex-col items-center justify-between gap-5 rounded-3xl bg-primary px-6 py-8 text-primary-foreground sm:flex-row sm:px-10"><div><p className="text-xl font-semibold">Ready to make progress you can see?</p><p className="mt-1 text-sm text-primary-foreground/75">Start with a workspace built around your goals.</p></div><a href="#top" className="rounded-xl bg-primary-foreground px-5 py-3 text-sm font-semibold text-primary transition hover:opacity-90">Explore Study Material Hub <ArrowRight className="ml-2 inline size-4" /></a></div></div></section>
}

function AboutSection() {
  return <section id="about" className="border-t border-border bg-background px-5 py-24 lg:px-8 lg:py-32"><div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">About Study Material Hub</p><h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Learning feels better when everything connects.</h2></div><div className="space-y-6 text-lg leading-8 text-muted-foreground"><p>Study Material Hub is a focused learning platform for institutions that want to make education more accessible, organized, and human.</p><p>Students get a clear path through courses, materials, attendance, and exams. Administrators get the visibility and tools they need to support every learner with confidence.</p><div className="grid gap-3 pt-3 sm:grid-cols-3">{[['01', 'Learn clearly'], ['02', 'Manage simply'], ['03', 'Grow together']].map(([number, label]) => <div key={number} className="rounded-2xl border border-border bg-card p-4"><span className="text-sm font-bold text-primary">{number}</span><p className="mt-2 text-sm font-semibold text-foreground">{label}</p></div>)}</div></div></div></section>
}

function Logo() {
  return <SiteLogo priority className="w-[clamp(12rem,20vw,16.25rem)]" />
}

function Header({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [open, setOpen] = useState(false)
  return <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1220] text-white backdrop-blur-xl"><div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 lg:px-8"><button onClick={() => onNavigate('home')} aria-label="Study Material Hub home"><Logo /></button><nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex"><a href="#features" className="transition-colors hover:text-foreground">Features</a><a href="#about" className="transition-colors hover:text-foreground">About</a><button onClick={() => onNavigate('login')} className="text-foreground hover:text-primary">Log in</button><button onClick={() => onNavigate('register')} className="rounded-full bg-primary px-5 py-2.5 text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5">Get started <ArrowRight className="ml-1 inline size-4" /></button></nav><button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button></div>{open && <div className="border-t border-white/10 bg-[#0b1220] px-5 py-4 text-white md:hidden"><div className="flex flex-col gap-4 text-sm font-medium"><a href="#features" onClick={() => setOpen(false)}>Features</a><a href="#about" onClick={() => setOpen(false)}>About</a><button className="text-left" onClick={() => { setOpen(false); onNavigate('login') }}>Log in</button><button className="rounded-full bg-primary px-5 py-2.5 text-left text-primary-foreground" onClick={() => { setOpen(false); onNavigate('register') }}>Get started</button></div></div>}</header>
}

function AuthCard({ mode, onNavigate }: { mode: 'login' | 'register'; onNavigate: (view: View) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const isRegister = mode === 'register'
  const isPrimaryAdmin = email === 'admin@admin.com' && password === 'Admin@123'

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setNotice('')
    if (isRegister) setRole('student')
    setLoading(true)
    if (isRegister) {
      const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { name: firstName, role: 'student' } } })
      if (authError) setError(friendlyAuthError(authError))
      else if (data.session && data.user) { await supabase.from('profiles').upsert({ id: data.user.id, name: firstName, email, role }); onNavigate(dashboardForRole(role) as View) }
      else setNotice('Check your email to confirm your account, then sign in.')
    } else {
      if (isPrimaryAdmin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (!authError && data.user) {
          await recordSuccessfulLogin(data.user.id)
        }
        if (email === 'admin@admin.com' && password === 'Admin@123') onNavigate('/admin/dashboard')
        else setError(friendlyAuthError(authError))
        setLoading(false)
        return
      }
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) setError(friendlyAuthError(authError))
      else if (data.user) { await recordSuccessfulLogin(data.user.id); const { profile } = await getProfile(data.user.id); onNavigate(dashboardForRole(profile?.role) as View) }
    }
    setLoading(false)
  }

  return <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[radial-gradient(circle_at_top_left,oklch(0.96_0.04_170),transparent_38%),linear-gradient(135deg,oklch(0.98_0.02_180),oklch(0.97_0.02_80))] px-5 py-12"><div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border/70 bg-card shadow-2xl shadow-primary/10 min-[880px]:grid-cols-[0.9fr_1.1fr]"><div className="relative isolate flex min-h-80 overflow-hidden bg-[#0b1220] p-6 text-primary-foreground min-[880px]:min-h-0 min-[880px]:p-10"><ParticleShowcase /><div className="relative z-10 h-fit w-fit overflow-hidden rounded-xl border border-white/10 shadow-lg shadow-black/10"><Logo /></div></div><div className="p-7 sm:p-12"><div className="mb-8"><p className="mb-2 text-sm font-semibold text-primary">WELCOME TO STUDY MATERIAL HUB</p><h2 className="text-3xl font-bold tracking-tight">{isRegister ? 'Create your account' : 'Welcome back'}</h2><p className="mt-2 text-sm text-muted-foreground">{isRegister ? 'Start your learning journey today.' : 'Continue where you left off.'}</p></div><form onSubmit={submit} className="flex flex-col gap-4 [&_button:nth-of-type(2)]:hidden"><label className="text-sm font-medium">Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none ring-primary transition focus:ring-2" placeholder="you@example.com" /></label>{isRegister && <label className="text-sm font-medium">First name<input required value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none ring-primary transition focus:ring-2" placeholder="Alex" /></label>}<label className="text-sm font-medium">Password<input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none ring-primary transition focus:ring-2" placeholder="At least 6 characters" /></label>{isRegister && <><div className="flex flex-col gap-2"><span className="text-sm font-medium">I am joining as</span><div className="grid grid-cols-2 gap-3">{(['student', 'admin'] as Role[]).map(item => <button type="button" key={item} onClick={() => setRole(item)} className={`rounded-xl border px-4 py-3 text-left text-sm capitalize transition ${role === item ? 'border-primary bg-primary/5 text-primary' : 'border-input hover:border-primary/40'}`}><span className="font-semibold">{item}</span><span className="mt-1 block text-xs text-muted-foreground">{item === 'student' ? 'Learn and grow' : 'Manage learning'}</span></button>)}</div></div>{role === 'admin' && <label className="text-sm font-medium">Admin invite code<input required value={inviteCode} onChange={e => setInviteCode(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none ring-primary transition focus:ring-2" placeholder="Enter your invite code" /></label>}</>} {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}{notice && <p role="status" className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">{notice}</p>}<button disabled={loading} className="mt-2 h-12 rounded-xl bg-primary font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">{loading ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'} <ArrowRight className="ml-2 inline size-4" /></button></form><p className="mt-7 text-center text-sm text-muted-foreground">{isRegister ? 'Already have an account?' : 'New to Study Material Hub?'} <button className="font-semibold text-primary hover:underline" onClick={() => onNavigate(isRegister ? 'login' : 'register')}>{isRegister ? 'Log in' : 'Create an account'}</button></p></div></div></main>
}

function Dashboard({ role, onNavigate }: { role: Role; onNavigate: (view: View) => void }) {
  const isAdmin = role === 'admin'
  const cards = isAdmin ? [{ icon: Users, label: 'Total learners', value: '1,248', detail: '+12% this month' }, { icon: BookOpen, label: 'Active courses', value: '42', detail: '8 published this week' }, { icon: CheckCircle2, label: 'Completion rate', value: '78%', detail: '+4.6% from last month' }] : [{ icon: BookOpen, label: 'Courses in progress', value: '4', detail: '2 due this week' }, { icon: CheckCircle2, label: 'Completed lessons', value: '28', detail: '+6 this month' }, { icon: Sparkles, label: 'Learning streak', value: '12 days', detail: 'Best: 18 days' }]
  return <div className="min-h-screen bg-muted/30"><header className="border-b border-white/10 bg-[#0b1220] text-white"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8"><Logo /><div className="flex items-center gap-4"><span className="hidden text-right sm:block"><strong className="block text-sm">{isAdmin ? 'Admin workspace' : 'Good morning, Alex'}</strong><span className="text-xs text-muted-foreground">{isAdmin ? 'Manage your portal' : 'Keep your momentum going'}</span></span><button onClick={async () => { await signOut(); onNavigate('home') }} className="flex items-center gap-2 rounded-full border border-input px-4 py-2 text-sm font-medium hover:bg-muted"><LogOut className="size-4" /> <span className="hidden sm:inline">Log out</span></button></div></div></header><main className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">{isAdmin ? 'Admin dashboard' : 'Student dashboard'}</p><h1 className="text-3xl font-bold tracking-tight">{isAdmin ? 'See what��s happening.' : 'Your learning overview.'}</h1><p className="mt-2 text-muted-foreground">{isAdmin ? 'A clear view of your learning community.' : 'Small steps today lead to big progress.'}</p></div><button className="w-fit rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{isAdmin ? 'Create course' : 'Explore courses'} <ArrowRight className="ml-2 inline size-4" /></button></div><div className="grid gap-4 md:grid-cols-3">{cards.map(({ icon: Icon, label, value, detail }) => <div key={label} className="rounded-2xl border border-border bg-card p-6"><div className="mb-7 flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon /></span><span className="text-xs font-medium text-primary">+12%</span></div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p><p className="mt-2 text-xs text-muted-foreground">{detail}</p></div>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]"><section className="rounded-2xl border border-border bg-card p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-semibold">{isAdmin ? 'Recent activity' : 'Continue learning'}</h2><p className="mt-1 text-sm text-muted-foreground">{isAdmin ? 'Latest updates across the portal.' : 'Pick up right where you left off.'}</p></div><button className="text-sm font-semibold text-primary">View all</button></div><div className="flex flex-col gap-3">{(isAdmin ? ['New course published', '12 learners completed Introduction to UX', 'Alex Morgan joined the portal'] : ['Product Design Fundamentals', 'Introduction to User Research', 'Building with React']).map((item, index) => <div key={item} className="flex items-center gap-4 rounded-xl bg-muted/60 p-4"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-background text-primary"><BookOpen className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item}</p><p className="mt-1 text-xs text-muted-foreground">{isAdmin ? `${index + 1} hour${index ? 's' : ''} ago` : `${72 - index * 18}% complete`}</p></div><ArrowRight className="size-4 text-muted-foreground" /></div>)}</div></section><aside className="rounded-2xl bg-primary p-6 text-primary-foreground"><ShieldCheck className="mb-12 size-8 text-primary-foreground/80" /><h2 className="text-2xl font-bold">{isAdmin ? 'Build better learning.' : 'Stay on track.'}</h2><p className="mt-3 text-sm leading-6 text-primary-foreground/75">{isAdmin ? 'Give every learner a clear path to their next breakthrough.' : 'You’re doing great. Just 20 minutes today keeps your streak alive.'}</p><button className="mt-8 rounded-xl bg-background px-4 py-3 text-sm font-semibold text-foreground">{isAdmin ? 'View insights' : 'View my plan'}</button></aside></div></main></div>
}

const adminNav = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Departments', icon: Building2 },
  { label: 'Semesters', icon: CalendarDays },
  { label: 'Subjects', icon: BookOpen },
  { label: 'Attendance', icon: ClipboardList },
  { label: 'Materials', icon: FileText },
  { label: 'Tests & Exams', icon: FlaskConical },
  { label: 'Exam Generator', icon: WandSparkles },
  { label: 'Leave Applications', icon: Plane },
  { label: 'User Analytics', icon: BarChart3 },
]

function AdminDashboard({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [collapsed, setCollapsed] = useState(false)
  const [active, setActive] = useState('Overview')
  const [stats, setStats] = useState({ students: 0, subjects: 0, pendingLeaves: 0, todayLogins: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadStats() {
      const today = new Date().toISOString().slice(0, 10)
      const [{ count: students }, { count: subjects }, { count: pendingLeaves }, { count: todayLogins }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
        supabase.from('leave_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('login_logs').select('*', { count: 'exact', head: true }).gte('login_time', `${today}T00:00:00.000Z`),
      ])
      if (mounted) { setStats({ students: students ?? 0, subjects: subjects ?? 0, pendingLeaves: pendingLeaves ?? 0, todayLogins: todayLogins ?? 0 }); setLoading(false) }
    }
    loadStats()
    return () => { mounted = false }
  }, [])

  const cards = [
    { label: 'Total Students', value: stats.students, icon: Users, tone: 'bg-sky-500/10 text-sky-600' },
    { label: 'Total Subjects', value: stats.subjects, icon: BookOpen, tone: 'bg-primary/10 text-primary' },
    { label: 'Pending Leave Applications', value: stats.pendingLeaves, icon: Plane, tone: 'bg-amber-500/10 text-amber-600' },
    { label: "Today's Logins", value: stats.todayLogins, icon: BarChart3, tone: 'bg-violet-500/10 text-violet-600' },
  ]

  return <div className="min-h-screen bg-muted/30">
    <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-background transition-[width] duration-200 ${collapsed ? 'w-[76px]' : 'w-64'}`}>
      <div className="flex h-20 items-center justify-center border-b border-white/10 bg-[#0b1220] px-3"><SiteLogo compact={collapsed} priority className={collapsed ? 'size-10' : 'w-full max-w-[205px]'} /></div>
      <nav className="min-h-0 flex-1 overflow-y-auto flex flex-col gap-1 p-3" aria-label="Admin navigation">{adminNav.map(({ label, icon: Icon }) => <button key={label} onClick={() => setActive(label)} title={collapsed ? label : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${active === label ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} ${collapsed ? 'justify-center' : ''}`}><Icon className="size-4 shrink-0" />{!collapsed && label}</button>)}</nav>
      <div className="border-t border-border p-3"><button onClick={async () => { await signOut(); onNavigate('home') }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground ${collapsed ? 'justify-center' : ''}`}><LogOut className="size-4" />{!collapsed && 'Logout'}</button></div>
    </aside>
    <div className={collapsed ? 'pl-[76px]' : 'pl-64'}><header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-xl lg:px-8"><button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">{collapsed ? <ChevronRight /> : <ChevronLeft />}</button><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><strong className="block text-sm">Admin workspace</strong><span className="text-xs text-muted-foreground">Manage your learning community</span></div><button onClick={async () => { await signOut(); onNavigate('home') }} className="inline-flex items-center gap-2 rounded-xl border border-destructive/20 px-3 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10" aria-label="Log out"><LogOut className="size-4" />Logout</button><div className="grid size-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">AD</div></div></header>
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><div className="mb-9"><p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">{active}</p><h1 className="text-3xl font-bold tracking-tight">{active === 'Overview' ? 'See what’s happening.' : `${active} workspace`}</h1><p className="mt-2 text-muted-foreground">{active === 'Overview' ? 'A clear view of your Study Material Hub community.' : `Manage ${active.toLowerCase()} from one focused space.`}</p></div>{active === 'Overview' ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-border bg-card p-5"><div className="mb-8 flex items-center justify-between"><span className={`grid size-11 place-items-center rounded-xl ${tone}`}><Icon /></span><span className="text-xs font-medium text-muted-foreground">Live</span></div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight">{loading ? '—' : value.toLocaleString()}</p></div>)}</div> : <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><LayoutDashboard /></div><h2 className="mt-5 text-xl font-semibold">{active} is ready</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Use the sidebar to switch between admin areas. This workspace is protected for administrators.</p></div>}</main></div>
  </div>
}

function ProtectedRoute({ role, onNavigate }: { role: Role; onNavigate: (view: View) => void }) {
  const [ready, setReady] = useState(false)
  useEffect(() => { let mounted = true; supabase.auth.getUser().then(async ({ data }) => { if (!data.user) { onNavigate('home'); return } const { profile } = await getProfile(data.user.id); if (profile?.role !== role) { onNavigate(dashboardForRole(profile?.role) as View); return } if (mounted) setReady(true) }); return () => { mounted = false } }, [onNavigate, role])
  if (!ready) return <div className="grid min-h-screen place-items-center bg-muted/30"><div className="text-center"><div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /><p className="text-sm text-muted-foreground">Checking your access…</p></div></div>
  return role === 'admin' ? <AdminDashboard onNavigate={onNavigate} /> : <Dashboard role={role} onNavigate={onNavigate} />
}

export default function Page() {
  const [view, setView] = useState<View>(() => {
    if (typeof window === 'undefined') return 'home'
    const path = window.location.pathname
    return path === '/admin/dashboard' || path === '/student/dashboard' ? path : 'home'
  })
  useEffect(() => {
    const requestedView = new URLSearchParams(window.location.search).get('view')
    if (requestedView === 'login' || requestedView === 'register') setView(requestedView)
  }, [])

  const navigate = (next: View) => {
    if (next === '/admin/dashboard' || next === '/student/dashboard') {
      const requestedPath = new URLSearchParams(window.location.search).get('next')
      const canResume = requestedPath === next || requestedPath?.startsWith(`${next}?`) || requestedPath?.startsWith(`${next}#`)
      window.location.assign(canResume && requestedPath ? requestedPath : next)
      return
    }

    setView(next)
    if (next === 'home') window.history.pushState({}, '', '/')
    else if (next === 'login' || next === 'register') {
      const params = new URLSearchParams({ view: next })
      const requestedPath = new URLSearchParams(window.location.search).get('next')
      if (requestedPath) params.set('next', requestedPath)
      window.history.pushState({}, '', `/?${params.toString()}`)
    }
  }
  if (view === 'login' || view === 'register') return <><SiteHeader onAuth={navigate} activePage="home" /><AuthCard mode={view} onNavigate={navigate} /></>
  if (view === 'student' || view === '/student/dashboard') return <ProtectedRoute role="student" onNavigate={navigate} />
  if (view === 'admin' || view === '/admin/dashboard') return <ProtectedRoute role="admin" onNavigate={navigate} />
  if (view === 'home') return <HomePage onAuth={navigate} />
  return <><Header onNavigate={navigate} /><main id="top"><FeaturesSection /><AboutSection /><section className="relative overflow-hidden px-5 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28"><div className="pointer-events-none absolute -right-20 -top-32 size-[32rem] rounded-full bg-primary/10 blur-3xl" /><div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]"><div className="relative"><span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary"><Sparkles className="size-3.5" /> A smarter way to learn</span><h1 className="max-w-2xl text-5xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-6xl">Learning that moves <span className="text-primary">with you.</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">Study Material Hub brings courses, progress, and community into one beautifully simple space built for meaningful growth.</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><button onClick={() => navigate('register')} className="rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5">Start learning free <ArrowRight className="ml-2 inline size-4" /></button><button onClick={() => navigate('login')} className="rounded-xl border border-input px-6 py-3.5 font-semibold transition hover:bg-muted">Log in to your account</button></div><div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground"><div className="flex -space-x-2"><span className="grid size-8 place-items-center rounded-full border-2 border-background bg-amber-200 text-xs font-bold text-amber-800">JM</span><span className="grid size-8 place-items-center rounded-full border-2 border-background bg-sky-200 text-xs font-bold text-sky-800">AK</span><span className="grid size-8 place-items-center rounded-full border-2 border-background bg-emerald-200 text-xs font-bold text-emerald-800">RS</span></div><span>Join 12,000+ curious learners</span></div></div><div className="relative rounded-[2rem] border border-border bg-card p-4 shadow-2xl shadow-primary/10"><div className="rounded-[1.5rem] bg-primary p-6 text-primary-foreground"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-primary-foreground/75">Your progress</span><span className="rounded-full bg-background/15 px-3 py-1 text-xs">This week</span></div><div className="mt-8 flex items-end justify-between"><div><p className="text-4xl font-bold">72%</p><p className="mt-1 text-sm text-primary-foreground/70">Course completion</p></div><div className="flex items-end gap-1.5">{[35, 52, 42, 68, 55, 79, 88].map((height, i) => <span key={i} className="w-5 rounded-t-md bg-primary-foreground/30" style={{ height: `${height}px` }} />)}</div></div></div><div className="grid gap-3 p-2 pt-5"><div className="flex items-center gap-4 rounded-xl bg-muted/60 p-4"><span className="grid size-10 place-items-center rounded-lg bg-background text-primary"><BookOpen /></span><div className="flex-1"><p className="text-sm font-semibold">Product Design Fundamentals</p><div className="mt-2 h-1.5 rounded-full bg-border"><div className="h-full w-[72%] rounded-full bg-primary" /></div></div><span className="text-sm font-bold">72%</span></div><div className="flex items-center gap-4 rounded-xl bg-muted/60 p-4"><span className="grid size-10 place-items-center rounded-lg bg-background text-primary"><CheckCircle2 /></span><div><p className="text-sm font-semibold">12 day learning streak</p><p className="mt-1 text-xs text-muted-foreground">You’re on a roll</p></div></div></div></div></div></section><section id="features" className="border-y border-border/70 bg-muted/30 px-5 py-20 lg:px-8"><div className="mx-auto max-w-6xl"><div className="max-w-xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Everything in one place</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Designed around your momentum.</h2></div><div className="mt-12 grid gap-5 md:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-6"><BookOpen className="size-7 text-primary" /><h3 className="mt-10 font-semibold">Learn with clarity</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Curated paths and focused courses help you know exactly what to learn next.</p></div><div className="rounded-2xl border border-border bg-card p-6"><LayoutDashboard className="size-7 text-primary" /><h3 className="mt-10 font-semibold">See your progress</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Track your wins, keep your streak, and turn intentions into consistent action.</p></div><div className="rounded-2xl border border-border bg-card p-6"><Users className="size-7 text-primary" /><h3 className="mt-10 font-semibold">Grow together</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Learn alongside a community of curious people and helpful educators.</p></div></div></div></section><section id="about" className="mx-auto max-w-6xl px-5 py-20 text-center lg:px-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Ready when you are</p><h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Your next chapter starts with one small step.</h2><button onClick={() => navigate('register')} className="mt-8 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground">Create your free account <ArrowRight className="ml-2 inline size-4" /></button></section></main><footer className="border-t border-border px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row"><Logo /><p className="text-sm text-muted-foreground">© 2025 Study Material Hub. Learn something new today.</p></div></footer></>
}
