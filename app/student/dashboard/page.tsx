'use client'

import { useEffect, useMemo, useState } from 'react'
import { SiteLogo } from '@/components/site/site-chrome'
import { supabase, signOut } from '../../../lib/supabaseClient'
import toast from 'react-hot-toast'

type Profile = { id: string; name: string | null; email: string | null; role: string }
type Question = { prompt: string; options?: string[]; answer?: string; type?: 'mcq' | 'theory'; marks?: number }
type Test = { id: number; title: string; type: 'mcq' | 'theory' | 'mixed'; duration: number | null; total_marks: number | null; created_at: string; questions: Question[]; subjects?: { name: string; code: string | null } | { name: string; code: string | null }[] | null }
type TestAttempt = { id: number; test_id: number; answers: Record<string, string>; score: number | null; submitted_at: string | null }
type Material = { id: number; title: string; type: 'notes' | 'assignment' | 'lab' | 'timetable'; file_url: string | null; uploaded_at: string; subjects?: { name: string; code: string | null; semesters?: { name: string } | { name: string }[] | null } | { name: string; code: string | null; semesters?: { name: string } | { name: string }[] | null }[] | null }
type Attendance = { status: 'present' | 'absent' | 'late' }
type LeaveApplication = { id: number; from_date: string; to_date: string; reason: string; status: 'pending' | 'approved' | 'rejected'; applied_at: string }
type View = 'overview' | 'subjects' | 'materials' | 'timetable' | 'tests' | 'leave'

const nav: { id: View; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '▦' },
  { id: 'subjects', label: 'My Subjects', icon: '◇' },
  { id: 'materials', label: 'Materials', icon: '▤' },
  { id: 'timetable', label: 'Timetable', icon: '◫' },
  { id: 'tests', label: 'Tests', icon: '▣' },
  { id: 'leave', label: 'Leave', icon: '◷' },
]

const relation = <T,>(value: T | T[] | null | undefined): T | null => Array.isArray(value) ? value[0] ?? null : value ?? null
const formatDate = (value: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))

export default function StudentDashboardRoute() {
  const [view, setView] = useState<View>('overview')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [attempts, setAttempts] = useState<TestAttempt[]>([])
  const [activeTest, setActiveTest] = useState<Test | null>(null)
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [resultAttempt, setResultAttempt] = useState<TestAttempt | null>(null)
  const [submittingTest, setSubmittingTest] = useState(false)
  const [materials, setMaterials] = useState<Material[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([])
  const [leaveForm, setLeaveForm] = useState({ fromDate: '', toDate: '', reason: '' })
  const [submittingLeave, setSubmittingLeave] = useState(false)
  const [subjects, setSubjects] = useState<{ id: number; name: string; code: string | null; credits: number | null; semesters?: { name: string; departments?: { name: string } | { name: string }[] | null } | { name: string; departments?: { name: string } | { name: string }[] | null }[] | null }[]>([])
  const [materialSemester, setMaterialSemester] = useState('all')
  const [materialSubject, setMaterialSubject] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode) }, [darkMode])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('view') === 'subjects') setView('subjects')
    setDepartmentFilter(params.get('department') ?? '')
  }, [])

  useEffect(() => {
    let active = true
    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const nextPath = `${window.location.pathname}${window.location.search}`
        window.location.assign(`/?view=login&next=${encodeURIComponent(nextPath)}`)
        return
      }
      const { data: currentProfile } = await supabase.from('profiles').select('id, name, email, role').eq('id', session.user.id).single()
      if (!active) return
      if (currentProfile?.role !== 'student') { window.location.assign('/'); return }
      setProfile(currentProfile)
      setAuthorized(true)

      const [attemptsResult, materialsResult, attendanceResult, leaveResult, subjectsResult] = await Promise.all([
        supabase.from('test_attempts').select('id, test_id, answers, score, submitted_at').eq('user_id', session.user.id).order('submitted_at', { ascending: false }),
        supabase.from('materials').select('id, title, type, file_url, uploaded_at, subjects(name, code, semesters(name))').order('uploaded_at', { ascending: false }),
        supabase.from('attendance').select('status').eq('user_id', session.user.id),
        supabase.from('leave_applications').select('id, from_date, to_date, reason, status, applied_at').eq('user_id', session.user.id).order('applied_at', { ascending: false }),
        supabase.from('subjects').select('id, name, code, credits, semesters(name, departments(name))').order('name'),
      ])
      const testsResult = await supabase.from('tests').select('id, title, type, duration, total_marks, created_at, questions, subjects(name, code)').order('created_at', { ascending: false })
      if (!active) return
      if (materialsResult.error || attendanceResult.error || leaveResult.error || subjectsResult.error || testsResult.error || attemptsResult.error) setError('Some dashboard data could not be loaded. Please refresh and try again.')
      setAttempts((attemptsResult.data ?? []) as TestAttempt[])
      setTests((testsResult.data ?? []) as Test[])
      setMaterials((materialsResult.data ?? []) as Material[])
      setAttendance((attendanceResult.data ?? []) as Attendance[])
      setLeaveApplications((leaveResult.data ?? []) as LeaveApplication[])
      setSubjects((subjectsResult.data ?? []) as typeof subjects)
      setLoading(false)
    }
    loadDashboard()
    return () => { active = false }
  }, [])

  const attendancePercentage = useMemo(() => {
    if (!attendance.length) return 0
    return Math.round((attendance.filter((item) => item.status === 'present').length / attendance.length) * 100)
  }, [attendance])
  const materialSemesters = useMemo(() => Array.from(new Set(materials.map((material) => relation(relation(material.subjects)?.semesters)?.name).filter(Boolean))) as string[], [materials])
  const materialSubjects = useMemo(() => subjects.filter((subject) => materialSemester === 'all' || relation(subject.semesters)?.name === materialSemester), [subjects, materialSemester])
  const filteredMaterials = useMemo(() => materials.filter((material) => {
    const subject = relation(material.subjects)
    const semester = relation(subject?.semesters)?.name
    return (materialSemester === 'all' || semester === materialSemester) && (materialSubject === 'all' || subject?.name === materialSubject)
  }), [materials, materialSemester, materialSubject])
  const normalizedDepartmentFilter = departmentFilter.replace(/[-_]+/g, ' ').trim().toLowerCase()
  const departmentTitle = normalizedDepartmentFilter.replace(/\b\w/g, (letter) => letter.toUpperCase())
  const displayedSubjects = useMemo(() => subjects.filter((subject) => {
    if (!normalizedDepartmentFilter) return true
    const department = relation(relation(subject.semesters)?.departments)
    return department?.name?.trim().toLowerCase() === normalizedDepartmentFilter
  }), [subjects, normalizedDepartmentFilter])
  const pageTitle = view === 'overview' ? 'Good morning' : nav.find((item) => item.id === view)?.label
  const pageDescription = view === 'overview' ? 'Stay on top of your learning journey.' : 'Your Study Material Hub learning space.'

  const startTest = (test: Test) => { setActiveTest(test); setResultAttempt(null); setActiveQuestion(0); setAnswers({}); setRemainingSeconds((test.duration || 30) * 60) }
  const submitTest = async () => {
    if (!activeTest || !profile || submittingTest) return
    setSubmittingTest(true)
    const questions = activeTest.questions || []
    const score = questions.reduce((total, question, index) => total + (question.type !== 'theory' && answers[String(index)] === question.answer ? (question.marks || 1) : 0), 0)
    const { data, error: submitError } = await supabase.from('test_attempts').insert({ test_id: activeTest.id, user_id: profile.id, answers, score }).select('id, test_id, answers, score, submitted_at').single()
    if (submitError) { setError('Could not submit this test. Please try again.'); toast.error('Test submission failed') }
    else { const attempt = data as TestAttempt; toast.success('Test submitted successfully'); setAttempts((current) => [attempt, ...current]); setResultAttempt(attempt); setActiveTest(null) }
    setSubmittingTest(false)
  }
  const submitLeave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profile || submittingLeave) return
    if (!leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason.trim()) { setError('Please complete all leave fields.'); return }
    if (leaveForm.toDate < leaveForm.fromDate) { setError('The end date must be on or after the start date.'); return }
    setSubmittingLeave(true)
    setError('')
    const { data, error: leaveError } = await supabase.from('leave_applications').insert({ user_id: profile.id, from_date: leaveForm.fromDate, to_date: leaveForm.toDate, reason: leaveForm.reason.trim() }).select('id, from_date, to_date, reason, status, applied_at').single()
    if (leaveError) { setError('Could not submit your leave application. Please try again.'); toast.error('Leave application failed') }
    else { toast.success('Leave application submitted'); setLeaveApplications((current) => [data as LeaveApplication, ...current]); setLeaveForm({ fromDate: '', toDate: '', reason: '' }) }
    setSubmittingLeave(false)
  }
  useEffect(() => { if (!activeTest || remainingSeconds <= 0) return; const timer = window.setInterval(() => setRemainingSeconds((seconds) => seconds - 1), 1000); return () => window.clearInterval(timer) }, [activeTest, remainingSeconds])

  if (activeTest) {
    const question = activeTest.questions?.[activeQuestion]
    const isTheory = question?.type === 'theory' || activeTest.type === 'theory'
    return <main className="min-h-screen bg-[#f4f8f7] p-8 text-[#173b3d]"><section className="mx-auto max-w-3xl rounded-2xl border border-[#dbeafe] bg-white p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#2563eb]">{activeTest.title}</p><h1 className="mt-2 text-2xl font-semibold">Question {activeQuestion + 1} of {activeTest.questions?.length || 0}</h1></div><span className="rounded-full bg-[#fff4d8] px-3 py-2 text-sm font-semibold text-[#9a711b]">{Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}</span></div><div className="mt-8 rounded-xl bg-[#f4f8f7] p-5"><p className="text-lg leading-7">{question?.prompt || 'This test has no questions yet.'}</p></div>{!isTheory && <div className="mt-5 flex flex-col gap-3">{(question?.options || []).map((option) => <label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dbeafe] p-4 hover:bg-[#f4f8f7]"><input type="radio" name={`question-${activeQuestion}`} checked={answers[String(activeQuestion)] === option} onChange={() => setAnswers((current) => ({ ...current, [String(activeQuestion)]: option }))} />{option}</label>)}</div>}{isTheory && <textarea aria-label="Theory answer" value={answers[String(activeQuestion)] || ''} onChange={(event) => setAnswers((current) => ({ ...current, [String(activeQuestion)]: event.target.value }))} className="mt-5 min-h-36 w-full rounded-xl border border-[#dbeafe] p-4 outline-none focus:border-[#2563eb]" placeholder="Write your answer..." />}</section><div className="mx-auto mt-4 flex max-w-3xl justify-between"><button disabled={activeQuestion === 0} onClick={() => setActiveQuestion((value) => value - 1)} className="rounded-xl border border-[#dbeafe] bg-white px-4 py-2 text-sm disabled:opacity-40">Previous</button>{activeQuestion < (activeTest.questions?.length || 1) - 1 ? <button onClick={() => setActiveQuestion((value) => value + 1)} className="rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white">Next</button> : <button onClick={submitTest} disabled={submittingTest} className="rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white">{submittingTest ? 'Submitting...' : 'Submit test'}</button>}</div></main>
  }

  if (!authorized || loading) return <main className="grid min-h-screen place-items-center bg-[#f4f8f7] text-[#173b3d]"><div className="flex items-center gap-3 text-sm font-medium"><span className="size-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" aria-hidden="true" />Checking student access...</div></main>

  return <main className="min-h-screen bg-[#f4f8f7] text-[#173b3d]">
    <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-blue-100 bg-white transition-all dark:border-slate-800 dark:bg-slate-950 ${collapsed ? 'w-[76px]' : 'w-[245px]'} ${collapsed ? 'max-md:-translate-x-full' : 'max-md:translate-x-0'}`}>
      <div className="flex h-[86px] items-center justify-center border-b border-white/10 bg-[#0b1220] px-3"><SiteLogo compact={collapsed} priority className={collapsed ? 'size-10' : 'w-full max-w-[205px]'} /></div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-6">{nav.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${view === item.id ? 'bg-[#eff6ff] text-[#2563eb]' : 'text-[#607877] hover:bg-[#f2f7f5]'}`}><span className="grid size-7 place-items-center text-base">{item.icon}</span>{!collapsed && item.label}</button>)}</nav>
      <div className="border-t border-[#edf3f1] p-3"><button onClick={async () => { await signOut(); window.location.assign('/') }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#607877] hover:bg-[#fff1ed] hover:text-[#c45e4c]"><span className="grid size-7 place-items-center">↪</span>{!collapsed && 'Logout'}</button><button aria-label="Toggle sidebar" onClick={() => setCollapsed(!collapsed)} className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#f4f8f7] py-2 text-[#607877]">{collapsed ? '›' : '‹'}</button></div>
    </aside>
    <section className={`min-h-screen transition-all max-md:ml-0 ${collapsed ? 'ml-[76px]' : 'ml-[245px]'}`}>
      <header className="flex h-[86px] items-center justify-between border-b border-blue-100 bg-white/90 px-4 backdrop-blur sm:px-8 dark:border-slate-800 dark:bg-slate-950/90"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#2563eb]">Student portal</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{pageTitle}</h1><p className="mt-1 text-sm text-[#819391]">{pageDescription}</p></div><div className="flex items-center gap-2"><button onClick={() => setDarkMode((value) => !value)} className="rounded-xl border border-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-800" aria-label="Toggle dark mode">{darkMode ? 'Light' : 'Dark'} mode</button><button onClick={() => setCollapsed(false)} className="rounded-xl border border-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 md:hidden dark:border-slate-700 dark:text-blue-300" aria-label="Open navigation">Menu</button><button onClick={async () => { await signOut(); window.location.assign('/') }} className="rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950" aria-label="Log out">Logout</button><div className="grid size-9 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{(profile?.name || 'S').slice(0, 2).toUpperCase()}</div><div className="hidden text-sm sm:block"><p className="font-semibold">{profile?.name || 'Student'}</p><p className="text-xs text-[#79908f]">Learner account</p></div></div></header>
      <div className="mx-auto max-w-[1250px] p-8">{error && <div role="alert" className="mb-5 rounded-xl border border-[#f0c6bb] bg-[#fff1ed] px-4 py-3 text-sm text-[#b54f40]">{error}</div>}
        {view === 'overview' && <><div className="mb-8 rounded-2xl bg-[#2563eb] p-7 text-white shadow-[0_15px_40px_rgba(15,119,114,.16)]"><p className="text-sm text-[#b9ded5]">Your learning dashboard</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back, {profile?.name?.split(' ')[0] || 'student'}.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-[#d8efea]">Pick up where you left off and keep building momentum across your subjects.</p></div><div className="grid gap-5 md:grid-cols-3"><div className="rounded-2xl border border-[#dbeafe] bg-white p-5"><p className="text-sm text-[#708684]">Attendance</p><p className="mt-5 text-3xl font-semibold">{attendancePercentage}%</p><p className="mt-1 text-xs text-[#94a6a4]">Based on recorded classes</p></div><div className="rounded-2xl border border-[#dbeafe] bg-white p-5"><p className="text-sm text-[#708684]">Upcoming tests</p><p className="mt-5 text-3xl font-semibold">{tests.length}</p><p className="mt-1 text-xs text-[#94a6a4]">Ready to complete</p></div><div className="rounded-2xl border border-[#dbeafe] bg-white p-5"><p className="text-sm text-[#708684]">My subjects</p><p className="mt-5 text-3xl font-semibold">{subjects.length}</p><p className="mt-1 text-xs text-[#94a6a4]">In your curriculum</p></div></div><div className="mt-7 grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-[#dbeafe] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Upcoming tests</h2><p className="mt-1 text-sm text-[#819391]">Assessments waiting for you</p></div><button onClick={() => setView('tests')} className="text-xs font-semibold text-[#2563eb]">View all</button></div><div className="mt-5 flex flex-col gap-3">{tests.slice(0, 4).map((test) => <div key={test.id} className="flex items-center justify-between rounded-xl bg-[#f4f8f7] px-4 py-3"><div><p className="text-sm font-semibold">{test.title}</p><p className="mt-1 text-xs text-[#819391]">{relation(test.subjects)?.name || 'Subject'} · {test.type.toUpperCase()}</p></div><span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-[#2563eb]">{test.duration || 0} min</span></div>)}{tests.length === 0 && <p className="rounded-xl bg-[#f4f8f7] px-4 py-8 text-center text-sm text-[#819391]">No upcoming tests yet.</p>}</div></section><section className="rounded-2xl border border-[#dbeafe] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Recently uploaded</h2><p className="mt-1 text-sm text-[#819391]">The latest materials from your teachers</p></div><button onClick={() => setView('materials')} className="text-xs font-semibold text-[#2563eb]">Browse</button></div><div className="mt-5 flex flex-col gap-3">{materials.map((material) => <a key={material.id} href={material.file_url || '#'} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-[#edf3f1] px-4 py-3 hover:border-[#9acfc5]"><div><p className="text-sm font-semibold">{material.title}</p><p className="mt-1 text-xs text-[#819391]">{relation(material.subjects)?.name || 'Subject'} · {formatDate(material.uploaded_at)}</p></div><span className="text-xs font-semibold capitalize text-[#2563eb]">{material.type}</span></a>)}{materials.length === 0 && <p className="rounded-xl bg-[#f4f8f7] px-4 py-8 text-center text-sm text-[#819391]">No materials uploaded yet.</p>}</div></section></div></>}
        {view === 'subjects' && <section className="rounded-2xl border border-[#dbeafe] bg-white p-6"><h2 className="text-lg font-semibold">{departmentFilter ? `${departmentTitle} subjects` : 'My subjects'}</h2><p className="mt-1 text-sm text-[#819391]">{departmentFilter ? `Subjects for ${departmentTitle}.` : 'Your current academic subjects.'}</p><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{displayedSubjects.length ? displayedSubjects.map((subject) => <div key={subject.id} className="rounded-xl border border-[#edf3f1] p-5"><p className="font-semibold">{subject.name}</p><p className="mt-1 text-sm text-[#819391]">{subject.code || 'No code'} · {subject.credits || 0} credits</p><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#2563eb]">{relation(subject.semesters)?.name || 'Semester'}</p></div>) : <div className="col-span-full rounded-xl border border-dashed border-[#dbeafe] px-5 py-10 text-center text-sm text-[#819391]">No subjects found for this department yet.</div>}</div></section>}
        {view === 'materials' && <section className="rounded-2xl border border-[#dbeafe] bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">Learning materials</h2><p className="mt-1 text-sm text-[#819391]">Read-only course resources from your subjects.</p></div><div className="flex flex-wrap gap-2"><label className="sr-only" htmlFor="material-semester">Filter by semester</label><select id="material-semester" value={materialSemester} onChange={(event) => { setMaterialSemester(event.target.value); setMaterialSubject('all') }} className="rounded-lg border border-[#dbeafe] bg-white px-3 py-2 text-sm text-[#173b3d]"><option value="all">All semesters</option>{materialSemesters.map((semester) => <option key={semester} value={semester}>{semester}</option>)}</select><label className="sr-only" htmlFor="material-subject">Filter by subject</label><select id="material-subject" value={materialSubject} onChange={(event) => setMaterialSubject(event.target.value)} className="rounded-lg border border-[#dbeafe] bg-white px-3 py-2 text-sm text-[#173b3d]"><option value="all">All subjects</option>{materialSubjects.map((subject) => <option key={subject.id} value={subject.name}>{subject.name}</option>)}</select></div></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-[#edf3f1] text-xs uppercase tracking-wider text-[#819391]"><th className="px-3 py-3 font-semibold">Title</th><th className="px-3 py-3 font-semibold">Type</th><th className="px-3 py-3 font-semibold">Subject</th><th className="px-3 py-3 font-semibold">Uploaded</th><th className="px-3 py-3 text-right font-semibold">Actions</th></tr></thead><tbody>{filteredMaterials.map((material) => { const subject = relation(material.subjects); const isPdf = material.file_url?.toLowerCase().includes('.pdf'); return <tr key={material.id} className="border-b border-[#f0f5f3] last:border-0"><td className="px-3 py-4 font-semibold">{material.title}</td><td className="px-3 py-4 capitalize text-[#607877]">{material.type}</td><td className="px-3 py-4 text-[#607877]">{subject?.name || 'Subject'}</td><td className="px-3 py-4 text-[#607877]">{formatDate(material.uploaded_at)}</td><td className="px-3 py-4"><div className="flex justify-end gap-2">{isPdf && material.file_url ? <a href={material.file_url} target="_blank" rel="noreferrer" className="rounded-lg border border-[#dbeafe] px-3 py-1.5 text-xs font-semibold text-[#2563eb] hover:bg-[#eff6ff]">Preview</a> : <span className="rounded-lg border border-[#edf3f1] px-3 py-1.5 text-xs text-[#a0afad]">Preview unavailable</span>}{material.file_url ? <a href={material.file_url} download target="_blank" rel="noreferrer" className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0b625e]">Download</a> : <span className="rounded-lg bg-[#f2f7f5] px-3 py-1.5 text-xs text-[#a0afad]">No file</span>}</div></td></tr> })}</tbody></table>{filteredMaterials.length === 0 && <p className="py-12 text-center text-sm text-[#819391]">No materials match these filters.</p>}</div></section>}
        {view === 'tests' && <section className="rounded-2xl border border-[#dbeafe] bg-white p-6"><h2 className="text-lg font-semibold">Tests</h2><p className="mt-1 text-sm text-[#819391]">Assigned tests grouped by subject.</p><div className="mt-6 flex flex-col gap-3">{tests.map((test) => { const attempt = attempts.find((item) => item.test_id === test.id); const completed = Boolean(attempt?.submitted_at); return <div key={test.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#edf3f1] p-4"><div><div className="flex items-center gap-2"><p className="font-semibold">{test.title}</p><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${completed ? 'bg-[#eff6ff] text-[#2563eb]' : 'bg-[#fff4d8] text-[#9a711b]'}`}>{completed ? 'Completed' : 'Pending'}</span></div><p className="mt-1 text-sm text-[#819391]">{relation(test.subjects)?.name || 'Subject'} · {test.duration || 0} minutes · {test.total_marks || 0} marks</p></div>{completed ? <button onClick={() => setResultAttempt(attempt || null)} className="rounded-xl border border-[#dbeafe] px-4 py-2.5 text-sm font-semibold">View result</button> : <button onClick={() => startTest(test)} className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white">Start test</button>}</div> })}{tests.length === 0 && <p className="py-10 text-center text-sm text-[#819391]">No tests assigned yet.</p>}</div>{resultAttempt && <div className="mt-6 rounded-xl border border-[#dbeafe] bg-[#f4f8f7] p-5"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Result</h3><p className="mt-1 text-sm text-[#819391]">Score: {resultAttempt.score ?? 0} points</p></div><button onClick={() => setResultAttempt(null)} className="text-sm font-semibold text-[#2563eb]">Close</button></div><p className="mt-4 text-sm text-[#607877]">MCQ answers were graded automatically. Theory responses are available to your instructor.</p></div>}</section>}
        {view === 'timetable' && <section className="rounded-2xl border border-[#dbeafe] bg-white p-10 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#eff6ff] text-xl text-[#2563eb]">◫</div><h2 className="mt-4 text-lg font-semibold">Timetable</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#819391]">Your academic schedule will appear here.</p></section>}
        {view === 'leave' && <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_1fr]"><section className="rounded-2xl border border-[#dbeafe] bg-white p-6"><h2 className="text-lg font-semibold">Apply for leave</h2><p className="mt-1 text-sm text-[#819391]">Submit a request for approval by your administrator.</p><form onSubmit={submitLeave} className="mt-6 flex flex-col gap-4"><label className="text-sm font-medium">From date<input required type="date" value={leaveForm.fromDate} onChange={(event) => setLeaveForm((current) => ({ ...current, fromDate: event.target.value }))} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-2.5 outline-none focus:border-[#2563eb]" /></label><label className="text-sm font-medium">To date<input required type="date" value={leaveForm.toDate} onChange={(event) => setLeaveForm((current) => ({ ...current, toDate: event.target.value }))} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-2.5 outline-none focus:border-[#2563eb]" /></label><label className="text-sm font-medium">Reason<textarea required value={leaveForm.reason} onChange={(event) => setLeaveForm((current) => ({ ...current, reason: event.target.value }))} className="mt-2 min-h-28 w-full rounded-xl border border-[#dbeafe] px-3 py-2.5 outline-none focus:border-[#2563eb]" placeholder="Tell us why you need leave..." /></label><button disabled={submittingLeave} type="submit" className="rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{submittingLeave ? 'Submitting...' : 'Submit application'}</button></form></section><section className="rounded-2xl border border-[#dbeafe] bg-white p-6"><div><h2 className="text-lg font-semibold">Past applications</h2><p className="mt-1 text-sm text-[#819391]">Submitted requests cannot be edited.</p></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b border-[#edf3f1] text-xs uppercase tracking-wider text-[#819391]"><th className="px-3 py-3 font-semibold">Dates</th><th className="px-3 py-3 font-semibold">Reason</th><th className="px-3 py-3 font-semibold">Status</th></tr></thead><tbody>{leaveApplications.map((application) => <tr key={application.id} className="border-b border-[#f0f5f3] last:border-0"><td className="px-3 py-4 whitespace-nowrap">{formatDate(application.from_date)} – {formatDate(application.to_date)}</td><td className="max-w-xs px-3 py-4 text-[#607877]">{application.reason}</td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${application.status === 'approved' ? 'bg-[#eff6ff] text-[#2563eb]' : application.status === 'rejected' ? 'bg-[#fff1ed] text-[#b54f40]' : 'bg-[#fff4d8] text-[#9a711b]'}`}>{application.status[0].toUpperCase() + application.status.slice(1)}</span></td></tr>)}</tbody></table>{leaveApplications.length === 0 && <p className="py-10 text-center text-sm text-[#819391]">No leave applications yet.</p>}</div></section></div>}
      </div>
    </section>
  </main>
}
