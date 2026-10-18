'use client'

import { useEffect, useMemo, useState } from 'react'
import { SiteLogo } from '@/components/site/site-chrome'
import { supabase, signOut } from '../../../lib/supabaseClient'
import { jsPDF } from 'jspdf'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import toast from 'react-hot-toast'

type Department = { id: number; name: string; code: string | null }
type Semester = { id: number; department_id: number; name: string; number: number; departments?: { name: string } | { name: string }[] | null }
type Subject = { id: number; semester_id: number; name: string; code: string | null; credits: number | null; semesters?: { name: string; departments?: { name: string } | { name: string }[] | null } | { name: string; departments?: { name: string } | { name: string }[] | null }[] | null }
type Student = { id: string; name: string | null; email: string | null }
type AttendanceRow = { id?: number; user_id: string; subject_id: number; date: string; status: 'present' | 'absent' | 'late'; profiles?: { name: string | null; email: string | null } | { name: string | null; email: string | null }[] | null; subjects?: { name: string; code: string | null } | { name: string; code: string | null }[] | null }
type Material = { id: number; subject_id: number; type: 'notes' | 'assignment' | 'lab' | 'timetable'; title: string; file_url: string | null; uploaded_at: string; subjects?: { name: string; code: string | null } | { name: string; code: string | null }[] | null }
type TestQuestion = { prompt: string; options?: string[]; answer?: string; type?: 'mcq' | 'theory' }
type Test = { id: number; subject_id: number; type: 'mcq' | 'theory' | 'mixed'; title: string; questions: TestQuestion[]; duration: number | null; total_marks: number | null; created_at: string; subjects?: { name: string; code: string | null } | { name: string; code: string | null }[] | null }
type ExamQuestion = TestQuestion & { marks: number }
type View = 'overview' | 'departments' | 'semesters' | 'subjects' | 'attendance' | 'materials' | 'tests' | 'exam-generator' | 'analytics'
type AnalyticsUser = { id: string; name: string | null; email: string | null; role: string; last_login: string | null; totalLogins: number }
type LoginPoint = { date: string; logins: number }
type SubjectAccess = { name: string; count: number }
type SubjectScore = { name: string; average: number }
type ActivityItem = { id: string; userId: string; userName: string; userEmail: string; type: 'Login' | 'Material download' | 'Test taken' | 'Leave submitted'; detail: string; timestamp: string }
const relation = <T,>(value: T | T[] | null | undefined): T | null => Array.isArray(value) ? value[0] ?? null : value ?? null

const navigation: { id: View; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '▦' },
  { id: 'departments', label: 'Departments', icon: '⌘' },
  { id: 'semesters', label: 'Semesters', icon: '◫' },
  { id: 'subjects', label: 'Subjects', icon: '◇' },
  { id: 'attendance', label: 'Attendance', icon: '✓' },
  { id: 'materials', label: 'Materials', icon: '▤' },
  { id: 'tests', label: 'Tests & Exams', icon: '▣' },
  { id: 'exam-generator', label: 'Exam Generator', icon: '✦' },
  { id: 'analytics', label: 'User Analytics', icon: '◒' },
]
const comingSoon = ['Leave Applications']

export default function AdminDashboardRoute() {
  const [view, setView] = useState<View>('overview')
  const [collapsed, setCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ students: 0, subjects: 0, pending: 0, logins: 0 })
  const [departments, setDepartments] = useState<Department[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [testForm, setTestForm] = useState({ subject_id: '', type: 'mcq' as Test['type'], title: '', duration: '30', marks: '20' })
  const [testMode, setTestMode] = useState<'manual' | 'ai'>('manual')
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([{ prompt: '', type: 'mcq', options: ['', '', '', ''], answer: '' }])
  const [testNotes, setTestNotes] = useState('')
  const [aiOptions, setAiOptions] = useState({ mcqCount: '5', theoryCount: '2', difficulty: 'medium' })
  const [generatingQuestions, setGeneratingQuestions] = useState(false)
  const [viewingTest, setViewingTest] = useState<Test | null>(null)
  const [paperForm, setPaperForm] = useState({ department_id: '', semester_id: '', subject_id: '', chapters: '', institution: 'Study Material Hub', title: 'End Semester Examination', date: new Date().toISOString().slice(0, 10), duration: '120', totalMarks: '100', mcqCount: '10', shortCount: '5', longCount: '3' })
  const [paperQuestions, setPaperQuestions] = useState<ExamQuestion[]>([])
  const [paperGenerating, setPaperGenerating] = useState(false)
  const [draggedQuestion, setDraggedQuestion] = useState<number | null>(null)
  const [materialForm, setMaterialForm] = useState({ subject_id: '', type: 'notes' as Material['type'], title: '' })
  const [materialFile, setMaterialFile] = useState<File | null>(null)
  const [materialUploading, setMaterialUploading] = useState(false)
  const [attendanceStudents, setAttendanceStudents] = useState<Student[]>([])
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRow[]>([])
  const [attendanceDepartment, setAttendanceDepartment] = useState('')
  const [attendanceSemester, setAttendanceSemester] = useState('')
  const [attendanceSubject, setAttendanceSubject] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10))
  const [historyStudent, setHistoryStudent] = useState('all')
  const [historySubject, setHistorySubject] = useState('all')
  const [historyFrom, setHistoryFrom] = useState('')
  const [historyTo, setHistoryTo] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [subjectDepartmentFilter, setSubjectDepartmentFilter] = useState('all')
  const [subjectSemesterFilter, setSubjectSemesterFilter] = useState('all')
  const [subjectForm, setSubjectForm] = useState({ department_id: '', semester_id: '', name: '', code: '', credits: '3' })
  const [departmentModal, setDepartmentModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [departmentForm, setDepartmentForm] = useState({ name: '', code: '' })
  const [savingDepartment, setSavingDepartment] = useState(false)
  const [semesterForm, setSemesterForm] = useState({ department_id: '', name: '', number: '1' })
  const [message, setMessage] = useState('')
  const [analyticsUsers, setAnalyticsUsers] = useState<AnalyticsUser[]>([])
  const [loginTrend, setLoginTrend] = useState<LoginPoint[]>([])
  const [subjectAccess, setSubjectAccess] = useState<SubjectAccess[]>([])
  const [subjectScores, setSubjectScores] = useState<SubjectScore[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [activityUser, setActivityUser] = useState('all')
  const [activityType, setActivityType] = useState('all')
  const [activityFrom, setActivityFrom] = useState('')
  const [activityTo, setActivityTo] = useState('')

  const loadData = async () => {
    const today = new Date().toISOString().slice(0, 10)
    const [profiles, subjects, leaves, logs, departmentsResult, semestersResult, subjectsResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('subjects').select('id', { count: 'exact', head: true }),
      supabase.from('leave_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('login_logs').select('id', { count: 'exact', head: true }).gte('login_time', `${today}T00:00:00`),
      supabase.from('departments').select('id, name, code').order('name'),
      supabase.from('semesters').select('id, department_id, name, number, departments(name)').order('number'),
      supabase.from('subjects').select('id, semester_id, name, code, credits, semesters(name, departments(name))').order('name'),
    ])
    const [{ data: materialsData }, { data: testsData }] = await Promise.all([
      supabase.from('materials').select('id, subject_id, type, title, file_url, uploaded_at, subjects(name, code)').order('uploaded_at', { ascending: false }),
      supabase.from('tests').select('id, subject_id, type, title, questions, duration, total_marks, created_at, subjects(name, code)').order('created_at', { ascending: false }),
    ])
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const [{ data: usersData }, { data: loginData }, { data: attemptData }, { data: downloadData }, { data: leaveData }] = await Promise.all([
      supabase.from('profiles').select('id, name, email, role, last_login').order('name'),
      supabase.from('login_logs').select('id, user_id, login_time').gte('login_time', thirtyDaysAgo),
      supabase.from('test_attempts').select('id, user_id, subject_id, score, submitted_at, tests(title, subjects(name))'),
      supabase.from('downloads').select('id, user_id, material_id, downloaded_at, materials(title)'),
      supabase.from('leave_applications').select('id, user_id, from_date, to_date, applied_at'),
    ])
    const profileMap = new Map((usersData ?? []).map((user) => [user.id, user]))
    const activityRows: ActivityItem[] = [
      ...(loginData ?? []).map((row) => ({ id: `login-${row.id}`, userId: row.user_id, userName: profileMap.get(row.user_id)?.name || 'Unnamed user', userEmail: profileMap.get(row.user_id)?.email || '', type: 'Login' as const, detail: 'Signed in to Study Material Hub', timestamp: row.login_time })),
      ...(downloadData ?? []).map((row) => ({ id: `download-${row.id}`, userId: row.user_id, userName: profileMap.get(row.user_id)?.name || 'Unnamed user', userEmail: profileMap.get(row.user_id)?.email || '', type: 'Material download' as const, detail: relation(row.materials)?.title || 'Downloaded material', timestamp: row.downloaded_at })),
      ...(attemptData ?? []).filter((row) => row.submitted_at).map((row) => ({ id: `test-${row.id}`, userId: row.user_id, userName: profileMap.get(row.user_id)?.name || 'Unnamed user', userEmail: profileMap.get(row.user_id)?.email || '', type: 'Test taken' as const, detail: relation(row.tests)?.title || 'Completed test', timestamp: row.submitted_at as string })),
      ...(leaveData ?? []).map((row) => ({ id: `leave-${row.id}`, userId: row.user_id, userName: profileMap.get(row.user_id)?.name || 'Unnamed user', userEmail: profileMap.get(row.user_id)?.email || '', type: 'Leave submitted' as const, detail: `${row.from_date} to ${row.to_date}`, timestamp: row.applied_at })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setActivity(activityRows)
    
    const userRows = (usersData ?? []) as Array<Omit<AnalyticsUser, 'totalLogins'>>
    const loginRows = (loginData ?? []) as Array<{ user_id: string; login_time: string }>
    const attempts = (attemptData ?? []) as Array<{ user_id: string; subject_id: number; score: number | null; tests?: { subjects?: { name: string } | { name: string }[] | null } | { subjects?: { name: string } | { name: string }[] | null }[] | null }>
    const loginCounts = loginRows.reduce<Record<string, number>>((counts, row) => { counts[row.user_id] = (counts[row.user_id] ?? 0) + 1; return counts }, {})
    const dayCounts = loginRows.reduce<Record<string, number>>((counts, row) => { const day = row.login_time.slice(0, 10); counts[day] = (counts[day] ?? 0) + 1; return counts }, {})
    const days = Array.from({ length: 30 }, (_, index) => { const date = new Date(Date.now() - (29 - index) * 24 * 60 * 60 * 1000); return date.toISOString().slice(0, 10) })
    const accessCounts = attempts.reduce<Record<string, number>>((counts, row) => { const subject = relation(relation(row.tests)?.subjects)?.name ?? `Subject ${row.subject_id}`; counts[subject] = (counts[subject] ?? 0) + 1; return counts }, {})
    const scoreBuckets = attempts.reduce<Record<string, { total: number; count: number }>>((buckets, row) => { if (row.score === null) return buckets; const subject = relation(relation(row.tests)?.subjects)?.name ?? `Subject ${row.subject_id}`; buckets[subject] = { total: (buckets[subject]?.total ?? 0) + row.score, count: (buckets[subject]?.count ?? 0) + 1 }; return buckets }, {})
    setAnalyticsUsers(userRows.map((user) => ({ ...user, totalLogins: loginCounts[user.id] ?? 0 })))
    setLoginTrend(days.map((date) => ({ date: date.slice(5), logins: dayCounts[date] ?? 0 })))
    setSubjectAccess(Object.entries(accessCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8))
    setSubjectScores(Object.entries(scoreBuckets).map(([name, bucket]) => ({ name, average: Math.round((bucket.total / bucket.count) * 10) / 10 })).sort((a, b) => b.average - a.average))
    setStats({ students: profiles.count ?? 0, subjects: subjects.count ?? 0, pending: leaves.count ?? 0, logins: logs.count ?? 0 })
    setDepartments(departmentsResult.data ?? [])
    setSemesters((semestersResult.data as Semester[]) ?? [])
    setSubjects((subjectsResult.data as Subject[]) ?? [])
    setMaterials((materialsData as Material[]) ?? [])
    setTests((testsData as Test[]) ?? [])
  }

  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode) }, [darkMode])

  useEffect(() => {
    let active = true
    async function authorize() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.assign('/'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (!active) return
      if (profile?.role !== 'admin') { window.location.assign('/'); return }
      setAuthorized(true)
      await loadData()
      setLoading(false)
    }
    authorize()
    return () => { active = false }
  }, [])

  const visibleSemesters = useMemo(() => departmentFilter === 'all' ? semesters : semesters.filter((item) => String(item.department_id) === departmentFilter), [semesters, departmentFilter])
  const subjectSemesterOptions = useMemo(() => subjectDepartmentFilter === 'all' ? semesters : semesters.filter((item) => String(item.department_id) === subjectDepartmentFilter), [semesters, subjectDepartmentFilter])
  const visibleSubjects = useMemo(() => subjects.filter((item) => {
    const semester = semesters.find((entry) => entry.id === item.semester_id)
    return (subjectDepartmentFilter === 'all' || String(semester?.department_id) === subjectDepartmentFilter) && (subjectSemesterFilter === 'all' || String(item.semester_id) === subjectSemesterFilter)
  }), [subjects, semesters, subjectDepartmentFilter, subjectSemesterFilter])
  const visibleActivity = useMemo(() => activity.filter((item) => {
    const timestamp = new Date(item.timestamp)
    return (activityUser === 'all' || item.userId === activityUser) && (activityType === 'all' || item.type === activityType) && (!activityFrom || timestamp >= new Date(`${activityFrom}T00:00:00`)) && (!activityTo || timestamp <= new Date(`${activityTo}T23:59:59`))
  }), [activity, activityUser, activityType, activityFrom, activityTo])
  const inactiveUserIds = useMemo(() => new Set(analyticsUsers.filter((user) => !user.last_login || Date.now() - new Date(user.last_login).getTime() >= 14 * 24 * 60 * 60 * 1000).map((user) => user.id)), [analyticsUsers])
  const notify = (text: string) => { setMessage(text); toast.success(text); window.setTimeout(() => setMessage(''), 2800) }

  const saveDepartment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!departmentForm.name.trim() || savingDepartment) return
    setSavingDepartment(true)
    const query = editingDepartment
      ? supabase.from('departments').update({ name: departmentForm.name.trim(), code: departmentForm.code.trim() || null }).eq('id', editingDepartment.id)
      : supabase.from('departments').insert({ name: departmentForm.name.trim(), code: departmentForm.code.trim() || null })
    const { error } = await query
    if (error) { notify(error.message); setSavingDepartment(false); return }
    setDepartmentModal(false); setEditingDepartment(null); setDepartmentForm({ name: '', code: '' }); await loadData(); notify(editingDepartment ? 'Department updated successfully' : 'Department added successfully'); setSavingDepartment(false)
  }

  const removeDepartment = async (id: number) => {
    if (!window.confirm('Delete this department and its semesters?')) return
    const { error } = await supabase.from('departments').delete().eq('id', id)
    if (error) { notify(error.message); return }
    await loadData(); notify('Department deleted')
  }

  const addSemester = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!semesterForm.department_id || !semesterForm.name.trim()) return
    const { error } = await supabase.from('semesters').insert({ department_id: Number(semesterForm.department_id), name: semesterForm.name.trim(), number: Number(semesterForm.number) })
    if (error) { notify(error.message); return }
    setSemesterForm({ department_id: '', name: '', number: '1' }); await loadData(); notify('Semester added')
  }

  const addSubject = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!subjectForm.semester_id || !subjectForm.name.trim()) return
    const { error } = await supabase.from('subjects').insert({ semester_id: Number(subjectForm.semester_id), name: subjectForm.name.trim(), code: subjectForm.code.trim() || null, credits: Number(subjectForm.credits) })
    if (error) { notify(error.message); return }
    setSubjectForm({ department_id: '', semester_id: '', name: '', code: '', credits: '3' })
    await loadData()
    notify('Subject added')
  }

  const uploadMaterial = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!materialForm.subject_id || !materialForm.title.trim() || !materialFile) { notify('Choose a subject, title, and file'); return }
    setMaterialUploading(true)
    const path = `${materialForm.subject_id}/${Date.now()}_${materialFile.name}`
    const { error: uploadError } = await supabase.storage.from('materials').upload(path, materialFile)
    if (uploadError) { setMaterialUploading(false); toast.error(`Upload failed: ${uploadError.message}`); setMessage(uploadError.message); return }
    const { data: publicData } = supabase.storage.from('materials').getPublicUrl(path)
    const { error: insertError } = await supabase.from('materials').insert({ subject_id: Number(materialForm.subject_id), type: materialForm.type, title: materialForm.title.trim(), file_url: publicData.publicUrl })
    if (insertError) { await supabase.storage.from('materials').remove([path]); setMaterialUploading(false); toast.error(`Material save failed: ${insertError.message}`); setMessage(insertError.message); return }
    setMaterialForm({ subject_id: '', type: 'notes', title: '' }); setMaterialFile(null); setMaterialUploading(false); await loadData(); toast.success('Material uploaded successfully'); setMessage('Material uploaded successfully')
  }

  const removeMaterial = async (material: Material) => {
    if (!window.confirm('Delete this material?')) return
    const filePath = material.file_url?.split('/storage/v1/object/public/materials/')[1]
    if (filePath) {
      const { error: storageError } = await supabase.storage.from('materials').remove([decodeURIComponent(filePath)])
      if (storageError) { toast.error(`File deletion failed: ${storageError.message}`); setMessage(storageError.message); return }
    }
    const { error } = await supabase.from('materials').delete().eq('id', material.id)
    if (error) { toast.error(`Material deletion failed: ${error.message}`); setMessage(error.message); return }
    await loadData(); toast.success('Material deleted successfully'); setMessage('Material deleted successfully')
  }

  const addManualQuestion = () => setTestQuestions((current) => [...current, { prompt: '', type: testForm.type === 'theory' ? 'theory' : 'mcq', options: testForm.type === 'theory' ? undefined : ['', '', '', ''], answer: '' }])

  const updateQuestion = (index: number, patch: Partial<TestQuestion>) => setTestQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, ...patch } : question))

  const generateQuestions = async () => {
    if (!testNotes.trim()) { notify('Paste notes before generating questions'); return }
    setGeneratingQuestions(true)
    const { data, error } = await supabase.functions.invoke('generate-questions', { body: { notes: testNotes, mcqCount: Number(aiOptions.mcqCount), theoryCount: Number(aiOptions.theoryCount), difficulty: aiOptions.difficulty } })
    setGeneratingQuestions(false)
    if (error) { notify(error.message); return }
    const generated = (data?.questions ?? data) as TestQuestion[]
    if (!Array.isArray(generated) || generated.length === 0) { notify('The generator returned no questions'); return }
    setTestQuestions(generated.map((question) => ({ ...question, type: question.type ?? (question.options?.length ? 'mcq' : 'theory') })))
    setTestForm((current) => ({ ...current, type: generated.some((question) => question.type === 'theory') && generated.some((question) => question.options?.length) ? 'mixed' : generated.some((question) => question.options?.length) ? 'mcq' : 'theory' }))
    notify('Questions generated')
  }

  const saveTest = async (event: React.FormEvent) => {
    event.preventDefault()
    const questions = testQuestions.filter((question) => question.prompt.trim()).map((question) => ({ ...question, prompt: question.prompt.trim(), options: question.options?.filter(Boolean) }))
    if (!testForm.subject_id || !testForm.title.trim() || questions.length === 0) { notify('Choose a subject, title, and add at least one question'); return }
    const { error } = await supabase.from('tests').insert({ subject_id: Number(testForm.subject_id), type: testForm.type, title: testForm.title.trim(), duration: Number(testForm.duration), total_marks: Number(testForm.marks), questions })
    if (error) { notify(error.message); return }
    setTestForm({ subject_id: '', type: 'mcq', title: '', duration: '30', marks: '20' }); setTestQuestions([{ prompt: '', type: 'mcq', options: ['', '', '', ''], answer: '' }]); setTestNotes(''); await loadData(); notify('Test saved')
  }

  const removeTest = async (id: number) => {
    if (!window.confirm('Delete this test?')) return
    const { error } = await supabase.from('tests').delete().eq('id', id)
    if (error) { notify(error.message); return }
    setTests((current) => current.filter((test) => test.id !== id)); notify('Test deleted')
  }

  const generateExamPaper = async () => {
    if (!paperForm.subject_id) { notify('Choose a subject first'); return }
    setPaperGenerating(true)
    const { data, error } = await supabase.from('tests').select('questions').eq('subject_id', Number(paperForm.subject_id))
    setPaperGenerating(false)
    if (error) { notify(error.message); return }
    const pool = (data ?? []).flatMap((test) => Array.isArray(test.questions) ? test.questions : []) as TestQuestion[]
    const mcqs = pool.filter((question) => question.type === 'mcq' || question.options?.length).slice(0, Number(paperForm.mcqCount))
    const theories = pool.filter((question) => question.type === 'theory' || !question.options?.length)
    const short = theories.slice(0, Number(paperForm.shortCount))
    const long = theories.slice(Number(paperForm.shortCount), Number(paperForm.shortCount) + Number(paperForm.longCount))
    setPaperQuestions([...mcqs, ...short, ...long].map((question, index) => ({ ...question, marks: question.options?.length ? 1 : index < mcqs.length + short.length ? 3 : 8 })))
    notify(`Added ${mcqs.length + short.length + long.length} questions to the paper`)
  }

  const movePaperQuestion = (from: number, to: number) => {
    if (to < 0 || to >= paperQuestions.length) return
    setPaperQuestions((current) => { const next = [...current]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next })
  }

  const exportExamPaper = () => {
    const pdf = new jsPDF()
    pdf.setFontSize(16); pdf.text(paperForm.institution || 'Study Material Hub', 105, 18, { align: 'center' })
    pdf.setFontSize(13); pdf.text(paperForm.title || 'Examination', 105, 27, { align: 'center' })
    pdf.setFontSize(9); pdf.text(`Date: ${paperForm.date}    Duration: ${paperForm.duration} minutes    Total Marks: ${paperForm.totalMarks}`, 105, 36, { align: 'center' })
    let y = 50
    paperQuestions.forEach((question, index) => {
      const lines = pdf.splitTextToSize(`${index + 1}. ${question.prompt} [${question.marks} marks]`, 175)
      if (y + lines.length * 5 > 280) { pdf.addPage(); y = 18 }
      pdf.text(lines, 18, y); y += lines.length * 5
      if (question.options?.length) { pdf.text(question.options.map((option, optionIndex) => `${String.fromCharCode(65 + optionIndex)}. ${option}`).join('    '), 24, y); y += 8 } else y += 5
    })
    pdf.save('study-material-hub-exam-paper.pdf')
  }

  const saveExamTemplate = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !paperForm.title.trim()) { notify('Enter an exam title'); return }
    const { error } = await supabase.from('exam_papers').insert({ user_id: user.id, subject_id: paperForm.subject_id ? Number(paperForm.subject_id) : null, title: paperForm.title.trim(), institution: paperForm.institution.trim() || null, exam_date: paperForm.date || null, duration: Number(paperForm.duration), total_marks: Number(paperForm.totalMarks), config: { ...paperForm, questions: paperQuestions } })
    if (error) { notify(error.message); return }
    notify('Exam template saved')
  }

  const loadAttendanceStudents = async () => {
    if (!attendanceSemester) { setAttendanceStudents([]); setAttendanceRows([]); return }
    const { data, error } = await supabase.from('profiles').select('id, name, email').eq('role', 'student').order('name')
    if (error) { notify(error.message); return }
    const students = (data ?? []) as Student[]
    setAttendanceStudents(students)
    const { data: existing } = await supabase.from('attendance').select('user_id, status').eq('subject_id', Number(attendanceSubject)).eq('date', attendanceDate)
    setAttendanceRows(students.map((student) => ({ user_id: student.id, subject_id: Number(attendanceSubject), date: attendanceDate, status: (existing?.find((row) => row.user_id === student.id)?.status ?? 'present') as AttendanceRow['status'] })))
  }

  const saveAttendance = async () => {
    if (!attendanceSubject || !attendanceDate || attendanceRows.length === 0) return
    const { error } = await supabase.from('attendance').delete().eq('subject_id', Number(attendanceSubject)).eq('date', attendanceDate)
    if (error) { notify(error.message); return }
    const { error: insertError } = await supabase.from('attendance').insert(attendanceRows)
    if (insertError) { notify(insertError.message); return }
    notify('Attendance saved')
    await loadHistory()
  }

  const loadHistory = async () => {
    let query = supabase.from('attendance').select('id, user_id, subject_id, date, status, profiles(name, email), subjects(name, code)').order('date', { ascending: false })
    if (historyStudent !== 'all') query = query.eq('user_id', historyStudent)
    if (historySubject !== 'all') query = query.eq('subject_id', Number(historySubject))
    if (historyFrom) query = query.gte('date', historyFrom)
    if (historyTo) query = query.lte('date', historyTo)
    const { data, error } = await query
    if (error) { notify(error.message); return }
    setAttendanceHistory((data ?? []) as AttendanceRow[])
  }

  const exportAttendanceCsv = () => {
    const csv = [['Student', 'Email', 'Subject', 'Date', 'Status'], ...attendanceHistory.map((row) => [relation(row.profiles)?.name || 'Unnamed student', relation(row.profiles)?.email || '', relation(row.subjects)?.name || '', row.date, row.status])].map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a'); link.href = url; link.download = 'study-material-hub-attendance.csv'; link.click(); URL.revokeObjectURL(url)
  }

  const exportAnalyticsCsv = () => {
    const csv = [['Name', 'Email', 'Role', 'Last Login', 'Total Logins'], ...analyticsUsers.map((user) => [user.name || 'Unnamed user', user.email || '', user.role, user.last_login ? new Date(user.last_login).toLocaleString() : 'Never', user.totalLogins])].map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a'); link.href = url; link.download = 'study-material-hub-user-analytics.csv'; link.click(); URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (authorized && view === 'attendance' && attendanceSubject && attendanceDate) loadAttendanceStudents()
  }, [authorized, view, attendanceSemester, attendanceSubject, attendanceDate])

  useEffect(() => {
    if (authorized && view === 'attendance') loadHistory()
  }, [authorized, view, historyStudent, historySubject, historyFrom, historyTo])

  if (!authorized || loading) return <main className="grid min-h-screen place-items-center bg-blue-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100"><div className="flex items-center gap-3 text-sm font-medium"><span className="size-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" aria-hidden="true" />Checking admin access...</div></main>

  return <main className="min-h-screen bg-[#f4f8f7] text-[#173b3d]">
    <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-blue-100 bg-white transition-all dark:border-slate-800 dark:bg-slate-950 ${collapsed ? 'w-[76px]' : 'w-[245px]'} ${collapsed ? 'max-md:-translate-x-full' : 'max-md:translate-x-0'}`}>
      <div className="flex h-[86px] items-center justify-center border-b border-white/10 bg-[#0b1220] px-3"><SiteLogo compact={collapsed} priority className={collapsed ? 'size-10' : 'w-full max-w-[205px]'} /></div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-6">{navigation.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${view === item.id ? 'bg-[#eff6ff] text-[#2563eb]' : 'text-[#607877] hover:bg-[#f2f7f5]'}`}><span className="grid size-7 place-items-center text-base">{item.icon}</span>{!collapsed && item.label}</button>)}<div className="my-4 border-t border-[#edf3f1]" />{!collapsed && <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#9aaead]">Workspace</p>}{comingSoon.map((label) => <button key={label} onClick={() => notify(`${label} is coming soon`)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#879998] hover:bg-[#f2f7f5]"><span className="grid size-7 place-items-center text-xs">○</span>{!collapsed && label}</button>)}</nav>
      <div className="border-t border-[#edf3f1] p-3"><button onClick={async () => { await signOut(); window.location.assign('/') }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#607877] hover:bg-[#fff1ed] hover:text-[#c45e4c]"><span className="grid size-7 place-items-center">↪</span>{!collapsed && 'Logout'}</button><button aria-label="Toggle sidebar" onClick={() => setCollapsed(!collapsed)} className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#f4f8f7] py-2 text-[#607877]">{collapsed ? '›' : '‹'}</button></div>
    </aside>
    <section className={`min-h-screen transition-all max-md:ml-0 ${collapsed ? 'ml-[76px]' : 'ml-[245px]'}`}><header className="flex h-[86px] items-center justify-between border-b border-blue-100 bg-white/90 px-4 backdrop-blur sm:px-8 dark:border-slate-800 dark:bg-slate-950/90"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#2563eb]">Control center</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{view === 'overview' ? 'Good morning, admin' : view[0].toUpperCase() + view.slice(1)}</h1></div><div className="flex items-center gap-2"><button onClick={() => setDarkMode((value) => !value)} className="rounded-xl border border-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-800" aria-label="Toggle dark mode">{darkMode ? 'Light' : 'Dark'} mode</button><button onClick={() => setCollapsed(false)} className="rounded-xl border border-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 md:hidden dark:border-slate-700 dark:text-blue-300" aria-label="Open navigation">Menu</button><button onClick={async () => { await signOut(); window.location.assign('/') }} className="rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950" aria-label="Log out">Logout</button><div className="grid size-9 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">AD</div><div className="hidden text-sm sm:block"><p className="font-semibold">Administrator</p><p className="text-xs text-[#79908f]">System owner</p></div></div></header>
      <div className="mx-auto max-w-[1250px] p-8">{message && <div role="status" className="mb-5 rounded-xl border border-[#b9ded5] bg-[#eff6ff] px-4 py-3 text-sm text-[#2563eb]">{message}</div>}
      {view === 'overview' && <><div className="mb-8"><p className="max-w-xl text-sm leading-6 text-[#708684]">Keep your learning environment organized. Here’s what’s happening across Study Material Hub today.</p></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{[['Total Students', stats.students, 'Enrolled learners', '↗'], ['Total Subjects', stats.subjects, 'Across departments', '◇'], ['Pending Leaves', stats.pending, 'Awaiting review', '◷'], ["Today's Logins", stats.logins, 'Active today', '◎']].map(([label, value, caption, icon]) => <div key={String(label)} className="rounded-2xl border border-[#dbeafe] bg-white p-5 shadow-[0_8px_30px_rgba(35,90,84,.04)]"><div className="flex items-start justify-between"><p className="text-sm font-medium text-[#708684]">{label}</p><span className="grid size-9 place-items-center rounded-xl bg-[#eff6ff] text-[#2563eb]">{icon}</span></div><p className="mt-6 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-[#94a6a4]">{caption}</p></div>)}</div><div className="mt-7 grid gap-5 lg:grid-cols-[1.4fr_1fr]"><div className="rounded-2xl border border-[#dbeafe] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Quick actions</h2><p className="mt-1 text-sm text-[#819391]">Manage the academic structure</p></div><span className="text-xs font-semibold text-[#2563eb]">LIVE</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => { setView('departments'); setDepartmentModal(true) }} className="rounded-xl border border-[#dbeafe] p-4 text-left hover:border-[#79bfb3]"><p className="font-medium">Add department</p><p className="mt-1 text-xs text-[#819391]">Create a new academic unit</p></button><button onClick={() => setView('semesters')} className="rounded-xl border border-[#dbeafe] p-4 text-left hover:border-[#79bfb3]"><p className="font-medium">Manage semesters</p><p className="mt-1 text-xs text-[#819391]">Organize your curriculum</p></button></div></div><div className="rounded-2xl bg-[#17484a] p-6 text-white"><p className="text-sm text-[#abd6cc]">Admin tip</p><h2 className="mt-3 text-xl font-semibold leading-7">Keep departments and semesters tidy for better student navigation.</h2><p className="mt-4 text-sm leading-6 text-[#c2ded8]">Changes are synced directly with Supabase.</p></div></div></>}
      {view === 'overview' && <section className="mt-7 rounded-2xl border border-[#dbeafe] bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">User Activity</h2><p className="mt-1 text-sm text-[#819391]">The latest five actions for each user, with inactive accounts highlighted.</p></div><div className="flex flex-wrap gap-2"><select aria-label="Filter activity by user" value={activityUser} onChange={(event) => setActivityUser(event.target.value)} className="rounded-xl border border-[#dbeafe] bg-white px-3 py-2 text-xs"><option value="all">All users</option>{analyticsUsers.map((user) => <option key={user.id} value={user.id}>{user.name || user.email || 'Unnamed user'}</option>)}</select><select aria-label="Filter activity by type" value={activityType} onChange={(event) => setActivityType(event.target.value)} className="rounded-xl border border-[#dbeafe] bg-white px-3 py-2 text-xs"><option value="all">All actions</option><option>Login</option><option>Material download</option><option>Test taken</option><option>Leave submitted</option></select><input aria-label="Activity from date" type="date" value={activityFrom} onChange={(event) => setActivityFrom(event.target.value)} className="rounded-xl border border-[#dbeafe] px-3 py-2 text-xs" /><input aria-label="Activity to date" type="date" value={activityTo} onChange={(event) => setActivityTo(event.target.value)} className="rounded-xl border border-[#dbeafe] px-3 py-2 text-xs" /></div></div><div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-[#edf3f1] text-xs uppercase tracking-wider text-[#95a7a5]"><tr><th className="px-3 py-3">User</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Details</th><th className="px-3 py-3">When</th></tr></thead><tbody className="divide-y divide-[#edf3f1]">{analyticsUsers.flatMap((user) => visibleActivity.filter((item) => item.userId === user.id).slice(0, 5)).map((item) => <tr key={item.id} className={inactiveUserIds.has(item.userId) ? 'bg-[#fff3f0]' : ''}><td className="px-3 py-4"><p className={`font-medium ${inactiveUserIds.has(item.userId) ? 'text-[#c45e4c]' : ''}`}>{item.userName}</p><p className="text-xs text-[#819391]">{item.userEmail}</p>{inactiveUserIds.has(item.userId) && <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wide text-[#c45e4c]">Inactive 14+ days</span>}</td><td className="px-3 py-4"><span className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-xs font-semibold text-[#2563eb]">{item.type}</span></td><td className="px-3 py-4 text-[#607877]">{item.detail}</td><td className="px-3 py-4 text-xs text-[#819391]">{new Date(item.timestamp).toLocaleString()}</td></tr>)}{visibleActivity.length === 0 && <tr><td colSpan={4} className="px-3 py-12 text-center text-[#819391]">No activity matches these filters.</td></tr>}</tbody></table></div></section>}
      {view === 'departments' && <div className="rounded-2xl border border-[#dbeafe] bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">Departments</h2><p className="mt-1 text-sm text-[#819391]">Manage the academic units in your institution.</p></div></div><form onSubmit={saveDepartment} className="mt-6 grid gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 md:grid-cols-[1fr_1fr_auto_auto]"><label className="text-xs font-semibold text-slate-600">Department Name<input required value={departmentForm.name} onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })} className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500" placeholder="e.g. Computer Science" /></label><label className="text-xs font-semibold text-slate-600">Department Code<input value={departmentForm.code} onChange={(event) => setDepartmentForm({ ...departmentForm, code: event.target.value.toUpperCase() })} className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-3 text-sm uppercase outline-none focus:border-blue-500" placeholder="e.g. CSE" /></label><button type="submit" disabled={savingDepartment} className="self-end rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"><span className={savingDepartment ? 'mr-2 inline-block size-3 animate-spin rounded-full border-2 border-white/40 border-t-white' : 'hidden'} aria-hidden="true" />{savingDepartment ? 'Saving...' : editingDepartment ? 'Update Department' : 'Save Department'}</button>{editingDepartment && <button type="button" onClick={() => { setEditingDepartment(null); setDepartmentForm({ name: '', code: '' }) }} className="self-end rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-blue-50">Cancel</button>}</form><div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-[#edf3f1] text-xs uppercase tracking-wider text-[#95a7a5]"><tr><th className="px-3 py-3">Name</th><th className="px-3 py-3">Code</th><th className="px-3 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#edf3f1]">{departments.map((department) => <tr key={department.id} className="transition-colors hover:bg-blue-50/60"><td className="px-3 py-4 font-medium">{department.name}</td><td className="px-3 py-4 text-[#708684]">{department.code || '—'}</td><td className="px-3 py-4 text-right"><button onClick={() => { setEditingDepartment(department); setDepartmentForm({ name: department.name, code: department.code || '' }); setDepartmentModal(true) }} className="mr-3 inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-[#2563eb] hover:bg-blue-50"><span aria-hidden="true">✎</span>Edit</button><button onClick={() => removeDepartment(department.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-[#c45e4c] hover:bg-red-50"><span aria-hidden="true">♲</span>Delete</button></td></tr>)}{departments.length === 0 && <tr><td colSpan={3} className="px-3 py-12 text-center text-[#819391]">No departments yet.</td></tr>}</tbody></table></div></div>}
      {view === 'semesters' && <div className="grid gap-6 xl:grid-cols-[330px_1fr]"><form onSubmit={addSemester} className="h-fit rounded-2xl border border-[#dbeafe] bg-white p-6"><h2 className="text-lg font-semibold">Add semester</h2><p className="mt-1 text-sm text-[#819391]">Attach it to a department.</p><label className="mt-6 block text-xs font-semibold text-[#607877]">Department<select required value={semesterForm.department_id} onChange={(event) => setSemesterForm({ ...semesterForm, department_id: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm"><option value="">Select department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label><label className="mt-4 block text-xs font-semibold text-[#607877]">Name<input required value={semesterForm.name} onChange={(event) => setSemesterForm({ ...semesterForm, name: event.target.value })} placeholder="e.g. First semester" className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm outline-none focus:border-[#2563eb]" /></label><label className="mt-4 block text-xs font-semibold text-[#607877]">Number<input required type="number" min="1" value={semesterForm.number} onChange={(event) => setSemesterForm({ ...semesterForm, number: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm outline-none focus:border-[#2563eb]" /></label><button className="mt-6 w-full rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0c625e]">Add semester</button></form><div className="rounded-2xl border border-[#dbeafe] bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">Semesters</h2><p className="mt-1 text-sm text-[#819391]">{visibleSemesters.length} semester{visibleSemesters.length === 1 ? '' : 's'} shown</p></div><select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="rounded-xl border border-[#dbeafe] bg-white px-3 py-2.5 text-sm"><option value="all">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></div><div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-[#edf3f1] text-xs uppercase tracking-wider text-[#95a7a5]"><tr><th className="px-3 py-3">Department</th><th className="px-3 py-3">Name</th><th className="px-3 py-3">Number</th><th className="px-3 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#edf3f1]">{visibleSemesters.map((semester) => <tr key={semester.id}><td className="px-3 py-4">{(Array.isArray(semester.departments) ? semester.departments[0]?.name : semester.departments?.name) || departments.find((d) => d.id === semester.department_id)?.name || '—'}</td><td className="px-3 py-4 font-medium">{semester.name}</td><td className="px-3 py-4 text-[#708684]">{semester.number}</td><td className="px-3 py-4 text-right"><button onClick={async () => { if (window.confirm('Delete this semester?')) { await supabase.from('semesters').delete().eq('id', semester.id); await loadData(); notify('Semester deleted') } }} className="font-medium text-[#c45e4c]">Delete</button></td></tr>)}{visibleSemesters.length === 0 && <tr><td colSpan={4} className="px-3 py-12 text-center text-[#819391]">No semesters match this filter.</td></tr>}</tbody></table></div></div></div>}
      {view === 'attendance' && <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-[#dbeafe] bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-lg font-semibold">Mark attendance</h2><p className="mt-1 text-sm text-[#819391]">Choose a class and record today&apos;s attendance.</p></div><button onClick={saveAttendance} disabled={!attendanceSubject || attendanceRows.length === 0} className="rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Save attendance</button></div>
          <div className="mt-6 grid gap-4 md:grid-cols-4"><label className="text-xs font-semibold text-[#607877]">Department<select value={attendanceDepartment} onChange={(event) => { setAttendanceDepartment(event.target.value); setAttendanceSemester(''); setAttendanceSubject('') }} className="mt-2 w-full rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm"><option value="">Select department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-xs font-semibold text-[#607877]">Semester<select value={attendanceSemester} onChange={(event) => { setAttendanceSemester(event.target.value); setAttendanceSubject('') }} disabled={!attendanceDepartment} className="mt-2 w-full rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm disabled:bg-[#f4f8f7]"><option value="">Select semester</option>{semesters.filter((item) => String(item.department_id) === attendanceDepartment).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-xs font-semibold text-[#607877]">Subject<select value={attendanceSubject} onChange={(event) => setAttendanceSubject(event.target.value)} disabled={!attendanceSemester} className="mt-2 w-full rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm disabled:bg-[#f4f8f7]"><option value="">Select subject</option>{subjects.filter((item) => String(item.semester_id) === attendanceSemester).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-xs font-semibold text-[#607877]">Date<input type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" /></label></div>
          <div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-[#edf3f1] text-xs uppercase tracking-wider text-[#95a7a5]"><tr><th className="px-3 py-3">Student</th><th className="px-3 py-3 text-center">Present</th><th className="px-3 py-3 text-center">Absent</th><th className="px-3 py-3 text-center">Late</th></tr></thead><tbody className="divide-y divide-[#edf3f1]">{attendanceStudents.map((student) => { const row = attendanceRows.find((item) => item.user_id === student.id); return <tr key={student.id}><td className="px-3 py-4"><p className="font-medium">{student.name || 'Unnamed student'}</p><p className="text-xs text-[#819391]">{student.email}</p></td>{(['present', 'absent', 'late'] as const).map((status) => <td key={status} className="px-3 py-4 text-center"><input type="radio" name={`attendance-${student.id}`} checked={row?.status === status} onChange={() => setAttendanceRows((current) => current.map((entry) => entry.user_id === student.id ? { ...entry, status } : entry))} className="size-4 accent-[#2563eb]" aria-label={`${status} for ${student.name || student.email}`} /></td>)}</tr>})}{attendanceStudents.length === 0 && <tr><td colSpan={4} className="px-3 py-12 text-center text-[#819391]">Select a department, semester, and subject to load students.</td></tr>}</tbody></table></div>
        </div>
        <div className="rounded-2xl border border-[#dbeafe] bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">Attendance history</h2><p className="mt-1 text-sm text-[#819391]">Filter records and export a CSV for reporting.</p></div><button onClick={exportAttendanceCsv} className="rounded-xl border border-[#b9ded5] px-4 py-2.5 text-sm font-semibold text-[#2563eb] hover:bg-[#eff6ff]">Export CSV</button></div><div className="mt-6 grid gap-4 md:grid-cols-4"><select value={historyStudent} onChange={(event) => setHistoryStudent(event.target.value)} className="rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm"><option value="all">All students</option>{attendanceStudents.map((item) => <option key={item.id} value={item.id}>{item.name || item.email}</option>)}</select><select value={historySubject} onChange={(event) => setHistorySubject(event.target.value)} className="rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm"><option value="all">All subjects</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input type="date" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} className="rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" aria-label="From date" /><input type="date" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} className="rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" aria-label="To date" /></div><div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-[#edf3f1] text-xs uppercase tracking-wider text-[#95a7a5]"><tr><th className="px-3 py-3">Student</th><th className="px-3 py-3">Subject</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Status</th></tr></thead><tbody className="divide-y divide-[#edf3f1]">{attendanceHistory.map((row) => <tr key={row.id}><td className="px-3 py-4">{relation(row.profiles)?.name || relation(row.profiles)?.email || 'Unnamed student'}</td><td className="px-3 py-4">{relation(row.subjects)?.name || '—'}</td><td className="px-3 py-4">{row.date}</td><td className="px-3 py-4 capitalize">{row.status}</td></tr>)}{attendanceHistory.length === 0 && <tr><td colSpan={4} className="px-3 py-10 text-center text-[#819391]">No attendance records match these filters.</td></tr>}</tbody></table></div></div>
      </div>}
      {view === 'materials' && <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
        <form onSubmit={uploadMaterial} className="h-fit rounded-2xl border border-[#dbeafe] bg-white p-6"><h2 className="text-lg font-semibold">Upload material</h2><p className="mt-1 text-sm text-[#819391]">Share notes and resources with students.</p><label className="mt-6 block text-xs font-semibold text-[#607877]">Subject<select required value={materialForm.subject_id} onChange={(event) => setMaterialForm({ ...materialForm, subject_id: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm"><option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}{subject.code ? ` · ${subject.code}` : ''}</option>)}</select></label><label className="mt-4 block text-xs font-semibold text-[#607877]">Type<select value={materialForm.type} onChange={(event) => setMaterialForm({ ...materialForm, type: event.target.value as Material['type'] })} className="mt-2 w-full rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm"><option value="notes">Notes</option><option value="assignment">Assignment</option><option value="lab">Lab</option><option value="timetable">Timetable</option></select></label><label className="mt-4 block text-xs font-semibold text-[#607877]">Title<input required value={materialForm.title} onChange={(event) => setMaterialForm({ ...materialForm, title: event.target.value })} placeholder="e.g. Week 3 lecture notes" className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm outline-none focus:border-[#2563eb]" /></label><label className="mt-4 block text-xs font-semibold text-[#607877]">File<input required type="file" onChange={(event) => setMaterialFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm text-[#708684] file:mr-3 file:rounded-lg file:border-0 file:bg-[#eff6ff] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#2563eb]" /></label><button disabled={materialUploading} className="mt-6 w-full rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{materialUploading ? 'Uploading…' : 'Upload material'}</button></form>
        <div className="rounded-2xl border border-[#dbeafe] bg-white p-6"><div><h2 className="text-lg font-semibold">Materials library</h2><p className="mt-1 text-sm text-[#819391]">{materials.length} resource{materials.length === 1 ? '' : 's'} uploaded.</p></div><div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-[#edf3f1] text-xs uppercase tracking-wider text-[#95a7a5]"><tr><th className="px-3 py-3">Title</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Subject</th><th className="px-3 py-3">Uploaded</th><th className="px-3 py-3">Download</th><th className="px-3 py-3 text-right">Delete</th></tr></thead><tbody className="divide-y divide-[#edf3f1]">{materials.map((material) => <tr key={material.id}><td className="px-3 py-4 font-medium">{material.title}</td><td className="px-3 py-4 capitalize text-[#708684]">{material.type}</td><td className="px-3 py-4">{relation(material.subjects)?.name || '—'}</td><td className="px-3 py-4 text-[#708684]">{new Date(material.uploaded_at).toLocaleDateString()}</td><td className="px-3 py-4">{material.file_url ? <a href={material.file_url} target="_blank" rel="noreferrer" className="font-semibold text-[#2563eb] hover:underline">Download</a> : '—'}</td><td className="px-3 py-4 text-right"><button onClick={() => removeMaterial(material)} className="font-semibold text-[#c45e4c]">Delete</button></td></tr>)}{materials.length === 0 && <tr><td colSpan={6} className="px-3 py-12 text-center text-[#819391]">No materials uploaded yet.</td></tr>}</tbody></table></div></div>
      </div>}
      {view === 'tests' && <div className="flex flex-col gap-6">
        <form onSubmit={saveTest} className="rounded-2xl border border-[#dbeafe] bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">Create test</h2><p className="mt-1 text-sm text-[#819391]">Build an assessment manually or generate questions from notes.</p></div><div className="flex rounded-xl bg-[#f4f8f7] p-1"><button type="button" onClick={() => setTestMode('manual')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${testMode === 'manual' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-[#708684]'}`}>Manual</button><button type="button" onClick={() => setTestMode('ai')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${testMode === 'ai' ? 'bg-white text-[#2563eb] shadow-sm' : 'text-[#708684]'}`}>AI Generate</button></div></div>
          <div className="mt-6 grid gap-4 md:grid-cols-5"><label className="text-xs font-semibold text-[#607877] md:col-span-2">Subject<select required value={testForm.subject_id} onChange={(event) => setTestForm({ ...testForm, subject_id: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm"><option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}{subject.code ? ` · ${subject.code}` : ''}</option>)}</select></label><label className="text-xs font-semibold text-[#607877]">Type<select value={testForm.type} onChange={(event) => setTestForm({ ...testForm, type: event.target.value as Test['type'], })} className="mt-2 w-full rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm"><option value="mcq">MCQ</option><option value="theory">Theory</option><option value="mixed">Mixed</option></select></label><label className="text-xs font-semibold text-[#607877]">Duration (min)<input required type="number" min="1" value={testForm.duration} onChange={(event) => setTestForm({ ...testForm, duration: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" /></label><label className="text-xs font-semibold text-[#607877]">Marks<input required type="number" min="1" value={testForm.marks} onChange={(event) => setTestForm({ ...testForm, marks: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" /></label></div>
          <label className="mt-4 block text-xs font-semibold text-[#607877]">Title<input required value={testForm.title} onChange={(event) => setTestForm({ ...testForm, title: event.target.value })} placeholder="e.g. Midterm assessment" className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm outline-none focus:border-[#2563eb]" /></label>
          {testMode === 'ai' && <div className="mt-5 rounded-xl border border-[#b9ded5] bg-[#f4fbf9] p-4"><label className="block text-xs font-semibold text-[#607877]">Paste notes<textarea value={testNotes} onChange={(event) => setTestNotes(event.target.value)} rows={4} placeholder="Paste lesson notes here..." className="mt-2 w-full rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm" /></label><div className="mt-4 grid gap-3 md:grid-cols-4"><label className="text-xs font-semibold text-[#607877]">MCQ count<input type="number" min="0" value={aiOptions.mcqCount} onChange={(event) => setAiOptions({ ...aiOptions, mcqCount: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-2 text-sm" /></label><label className="text-xs font-semibold text-[#607877]">Theory count<input type="number" min="0" value={aiOptions.theoryCount} onChange={(event) => setAiOptions({ ...aiOptions, theoryCount: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-2 text-sm" /></label><label className="text-xs font-semibold text-[#607877]">Difficulty<select value={aiOptions.difficulty} onChange={(event) => setAiOptions({ ...aiOptions, difficulty: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] bg-white px-3 py-2 text-sm"><option>easy</option><option>medium</option><option>hard</option></select></label><button type="button" onClick={generateQuestions} disabled={generatingQuestions} className="self-end rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{generatingQuestions ? 'Generating…' : 'Generate questions'}</button></div></div>}
          <div className="mt-6 flex items-center justify-between"><h3 className="font-semibold">Questions <span className="text-sm font-normal text-[#819391]">({testQuestions.length})</span></h3><button type="button" onClick={addManualQuestion} className="rounded-xl border border-[#b9ded5] px-3 py-2 text-xs font-semibold text-[#2563eb]">+ Add question</button></div>
          <div className="mt-4 flex flex-col gap-3">{testQuestions.map((question, index) => <div key={index} className="rounded-xl border border-[#edf3f1] p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-[#95a7a5]">Question {index + 1}</p>{testQuestions.length > 1 && <button type="button" onClick={() => setTestQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index))} className="text-xs font-semibold text-[#c45e4c]">Remove</button>}</div><textarea required value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} placeholder="Write the question..." rows={2} className="mt-3 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" />{question.options && <div className="mt-3 grid gap-2 md:grid-cols-2">{question.options.map((option, optionIndex) => <input key={optionIndex} value={option} onChange={(event) => updateQuestion(index, { options: question.options?.map((item, itemIndex) => itemIndex === optionIndex ? event.target.value : item) })} placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`} className="rounded-xl border border-[#dbeafe] px-3 py-2 text-sm" />)}</div>}<input value={question.answer ?? ''} onChange={(event) => updateQuestion(index, { answer: event.target.value })} placeholder={question.options ? 'Correct answer' : 'Expected answer (optional)'} className="mt-3 w-full rounded-xl border border-[#dbeafe] px-3 py-2 text-sm" /></div>)}</div>
          <button className="mt-6 rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0c625e]">Save test</button>
        </form>
        <div className="rounded-2xl border border-[#dbeafe] bg-white p-6"><h2 className="text-lg font-semibold">Tests & exams</h2><p className="mt-1 text-sm text-[#819391]">{tests.length} assessment{tests.length === 1 ? '' : 's'} saved.</p><div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-[#edf3f1] text-xs uppercase tracking-wider text-[#95a7a5]"><tr><th className="px-3 py-3">Title</th><th className="px-3 py-3">Subject</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Questions</th><th className="px-3 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#edf3f1]">{tests.map((test) => <tr key={test.id}><td className="px-3 py-4 font-medium">{test.title}</td><td className="px-3 py-4">{relation(test.subjects)?.name || '—'}</td><td className="px-3 py-4 uppercase text-[#708684]">{test.type}</td><td className="px-3 py-4">{test.questions?.length ?? 0}</td><td className="px-3 py-4 text-right"><button onClick={() => setViewingTest(test)} className="mr-4 font-semibold text-[#2563eb]">View</button><button onClick={() => removeTest(test.id)} className="font-semibold text-[#c45e4c]">Delete</button></td></tr>)}{tests.length === 0 && <tr><td colSpan={5} className="px-3 py-12 text-center text-[#819391]">No tests created yet.</td></tr>}</tbody></table></div></div>
        {viewingTest && <div className="fixed inset-0 z-30 grid place-items-center bg-[#173b3d]/40 p-4" role="dialog" aria-modal="true"><div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">{viewingTest.title}</h2><p className="mt-1 text-sm text-[#819391]">{relation(viewingTest.subjects)?.name} · {viewingTest.duration ?? '—'} minutes · {viewingTest.total_marks ?? '—'} marks</p></div><button onClick={() => setViewingTest(null)} className="text-xl text-[#708684]" aria-label="Close">×</button></div><div className="mt-5 flex flex-col gap-3">{viewingTest.questions?.map((question, index) => <div key={index} className="rounded-xl bg-[#f4f8f7] p-4"><p className="font-medium">{index + 1}. {question.prompt}</p>{question.options && <ul className="mt-2 list-disc pl-5 text-sm text-[#708684]">{question.options.map((option) => <li key={option}>{option}</li>)}</ul>}{question.answer && <p className="mt-2 text-xs font-semibold text-[#2563eb]">Answer: {question.answer}</p>}</div>)}</div></div></div>}
      </div>}
      {view === 'analytics' && <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">User analytics</h2><p className="mt-1 text-sm text-[#819391]">Understand engagement, activity, and assessment performance.</p></div><button onClick={exportAnalyticsCsv} className="rounded-xl border border-[#b9ded5] px-4 py-2.5 text-sm font-semibold text-[#2563eb] hover:bg-[#eff6ff]">Export CSV</button></div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{[['Total Users', analyticsUsers.length, 'All profiles'], ['Active Today', analyticsUsers.filter((user) => user.last_login?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length, 'Logged in today'], ['Active This Week', analyticsUsers.filter((user) => user.last_login && Date.now() - new Date(user.last_login).getTime() < 7 * 86400000).length, 'Last 7 days'], ['Inactive 14+ days', analyticsUsers.filter((user) => !user.last_login || Date.now() - new Date(user.last_login).getTime() >= 14 * 86400000).length, 'Needs attention']].map(([label, value, caption]) => <div key={String(label)} className="rounded-2xl border border-[#dbeafe] bg-white p-5"><p className="text-sm font-medium text-[#708684]">{label}</p><p className="mt-5 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-[#94a6a4]">{caption}</p></div>)}</div>
        <div className="grid gap-6 xl:grid-cols-2"><div className="rounded-2xl border border-[#dbeafe] bg-white p-6"><h3 className="font-semibold">Logins per day</h3><p className="mt-1 text-sm text-[#819391]">Last 30 days</p><div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={loginTrend}><CartesianGrid strokeDasharray="3 3" stroke="#edf3f1" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="logins" stroke="#2563eb" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div></div><div className="rounded-2xl border border-[#dbeafe] bg-white p-6"><h3 className="font-semibold">Most accessed subjects</h3><p className="mt-1 text-sm text-[#819391]">Based on test attempts</p><div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={subjectAccess}><CartesianGrid strokeDasharray="3 3" stroke="#edf3f1" /><XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={55} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="#e2b557" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></div></div>
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]"><div className="rounded-2xl border border-[#dbeafe] bg-white p-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Users</h3><p className="mt-1 text-sm text-[#819391]">{stats.pending} pending leave applications</p></div></div><div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-[#edf3f1] text-xs uppercase tracking-wider text-[#95a7a5]"><tr><th className="px-3 py-3">Name</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Last login</th><th className="px-3 py-3 text-right">Total logins</th></tr></thead><tbody className="divide-y divide-[#edf3f1]">{analyticsUsers.map((user) => <tr key={user.id}><td className="px-3 py-4 font-medium">{user.name || 'Unnamed user'}</td><td className="px-3 py-4 text-[#708684]">{user.email || '—'}</td><td className="px-3 py-4 capitalize">{user.role}</td><td className="px-3 py-4 text-[#708684]">{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td><td className="px-3 py-4 text-right font-semibold">{user.totalLogins}</td></tr>)}{analyticsUsers.length === 0 && <tr><td colSpan={5} className="px-3 py-12 text-center text-[#819391]">No user analytics available.</td></tr>}</tbody></table></div></div><div className="rounded-2xl border border-[#dbeafe] bg-white p-6"><h3 className="font-semibold">Average score per subject</h3><p className="mt-1 text-sm text-[#819391]">From completed test attempts</p><div className="mt-5 flex flex-col gap-3">{subjectScores.map((subject) => <div key={subject.name} className="flex items-center justify-between rounded-xl bg-[#f4f8f7] px-4 py-3"><span className="text-sm">{subject.name}</span><span className="font-semibold text-[#2563eb]">{subject.average}%</span></div>)}{subjectScores.length === 0 && <p className="py-8 text-center text-sm text-[#819391]">No scored attempts yet.</p>}</div></div></div>
      </div>}
      {view === 'exam-generator' && <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-[#dbeafe] bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">Exam paper generator</h2><p className="mt-1 text-sm text-[#819391]">Assemble a printable paper from your question bank.</p></div><div className="flex gap-2"><button type="button" onClick={saveExamTemplate} className="rounded-xl border border-[#b9ded5] px-4 py-2.5 text-sm font-semibold text-[#2563eb]">Save template</button><button type="button" onClick={exportExamPaper} disabled={!paperQuestions.length} className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Export PDF</button></div></div>
          <div className="mt-6 grid gap-4 md:grid-cols-4"><label className="text-xs font-semibold text-[#607877]">Department<select value={paperForm.department_id} onChange={(event) => setPaperForm({ ...paperForm, department_id: event.target.value, semester_id: '', subject_id: '' })} className="mt-2 w-full rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm"><option value="">Select department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-xs font-semibold text-[#607877]">Semester<select value={paperForm.semester_id} disabled={!paperForm.department_id} onChange={(event) => setPaperForm({ ...paperForm, semester_id: event.target.value, subject_id: '' })} className="mt-2 w-full rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm disabled:bg-[#f4f8f7]"><option value="">Select semester</option>{semesters.filter((item) => String(item.department_id) === paperForm.department_id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-xs font-semibold text-[#607877]">Subject<select value={paperForm.subject_id} disabled={!paperForm.semester_id} onChange={(event) => setPaperForm({ ...paperForm, subject_id: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm disabled:bg-[#f4f8f7]"><option value="">Select subject</option>{subjects.filter((item) => String(item.semester_id) === paperForm.semester_id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-xs font-semibold text-[#607877]">Chapters<input value={paperForm.chapters} onChange={(event) => setPaperForm({ ...paperForm, chapters: event.target.value })} placeholder="e.g. 1, 2, 4" className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" /></label></div>
          <div className="mt-4 grid gap-4 md:grid-cols-3"><label className="text-xs font-semibold text-[#607877]">MCQ count<input type="number" min="0" value={paperForm.mcqCount} onChange={(event) => setPaperForm({ ...paperForm, mcqCount: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" /></label><label className="text-xs font-semibold text-[#607877]">Short answer count<input type="number" min="0" value={paperForm.shortCount} onChange={(event) => setPaperForm({ ...paperForm, shortCount: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" /></label><label className="text-xs font-semibold text-[#607877]">Long answer count<input type="number" min="0" value={paperForm.longCount} onChange={(event) => setPaperForm({ ...paperForm, longCount: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" /></label></div>
          <div className="mt-4 grid gap-4 md:grid-cols-6"><label className="text-xs font-semibold text-[#607877] md:col-span-2">Institution<input value={paperForm.institution} onChange={(event) => setPaperForm({ ...paperForm, institution: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" /></label><label className="text-xs font-semibold text-[#607877] md:col-span-2">Exam title<input value={paperForm.title} onChange={(event) => setPaperForm({ ...paperForm, title: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" /></label><label className="text-xs font-semibold text-[#607877]">Date<input type="date" value={paperForm.date} onChange={(event) => setPaperForm({ ...paperForm, date: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" /></label><label className="text-xs font-semibold text-[#607877]">Duration<input type="number" min="1" value={paperForm.duration} onChange={(event) => setPaperForm({ ...paperForm, duration: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" /></label></div>
          <div className="mt-4 flex items-end gap-4"><label className="text-xs font-semibold text-[#607877]">Total marks<input type="number" min="1" value={paperForm.totalMarks} onChange={(event) => setPaperForm({ ...paperForm, totalMarks: event.target.value })} className="mt-2 w-40 rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" /></label><button type="button" onClick={generateExamPaper} disabled={paperGenerating} className="rounded-xl bg-[#173b3d] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{paperGenerating ? 'Generating…' : 'Generate paper'}</button></div>
        </div>
        <div className="rounded-2xl border border-[#dbeafe] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Paper editor</h2><p className="mt-1 text-sm text-[#819391]">Drag questions to reorder, then edit their text and marks.</p></div><span className="text-sm text-[#819391]">{paperQuestions.length} questions</span></div><div className="mt-5 flex flex-col gap-3">{paperQuestions.map((question, index) => <div key={`${question.prompt}-${index}`} draggable onDragStart={() => setDraggedQuestion(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedQuestion !== null) movePaperQuestion(draggedQuestion, index); setDraggedQuestion(null) }} className="cursor-grab rounded-xl border border-[#edf3f1] p-4 active:cursor-grabbing"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-[#95a7a5]">Question {index + 1} · {question.options?.length ? 'MCQ' : 'Theory'}</span><span className="text-xs text-[#95a7a5]">Drag to reorder</span></div><textarea value={question.prompt} onChange={(event) => setPaperQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, prompt: event.target.value } : item))} rows={2} className="w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm" /><div className="mt-3 flex items-center gap-3"><label className="text-xs font-semibold text-[#607877]">Marks<input type="number" min="1" value={question.marks} onChange={(event) => setPaperQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, marks: Number(event.target.value) } : item))} className="ml-2 w-20 rounded-lg border border-[#dbeafe] px-2 py-2 text-sm" /></label>{question.options?.length ? <p className="text-xs text-[#819391]">{question.options.join(' · ')}</p> : null}</div></div>)}{paperQuestions.length === 0 && <div className="rounded-xl bg-[#f4f8f7] p-10 text-center text-sm text-[#819391]">Generate a paper to open the editor.</div>}</div></div>
      </div>}
      {view === 'subjects' && <div className="grid gap-6 xl:grid-cols-[330px_1fr]"><form onSubmit={addSubject} className="h-fit rounded-2xl border border-[#dbeafe] bg-white p-6"><h2 className="text-lg font-semibold">Add subject</h2><p className="mt-1 text-sm text-[#819391]">Build your curriculum one subject at a time.</p><label className="mt-6 block text-xs font-semibold text-[#607877]">Department<select required value={subjectForm.department_id} onChange={(event) => setSubjectForm({ ...subjectForm, department_id: event.target.value, semester_id: '' })} className="mt-2 w-full rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm"><option value="">Select department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label><label className="mt-4 block text-xs font-semibold text-[#607877]">Semester<select required disabled={!subjectForm.department_id} value={subjectForm.semester_id} onChange={(event) => setSubjectForm({ ...subjectForm, semester_id: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] bg-white px-3 py-3 text-sm disabled:bg-[#f4f8f7]"><option value="">Select semester</option>{semesters.filter((semester) => String(semester.department_id) === subjectForm.department_id).map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}</select></label><label className="mt-4 block text-xs font-semibold text-[#607877]">Name<input required value={subjectForm.name} onChange={(event) => setSubjectForm({ ...subjectForm, name: event.target.value })} placeholder="e.g. Data Structures" className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm outline-none focus:border-[#2563eb]" /></label><div className="mt-4 grid grid-cols-2 gap-3"><label className="block text-xs font-semibold text-[#607877]">Code<input value={subjectForm.code} onChange={(event) => setSubjectForm({ ...subjectForm, code: event.target.value.toUpperCase() })} placeholder="CS201" className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm outline-none focus:border-[#2563eb]" /></label><label className="block text-xs font-semibold text-[#607877]">Credits<input required type="number" min="1" value={subjectForm.credits} onChange={(event) => setSubjectForm({ ...subjectForm, credits: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm outline-none focus:border-[#2563eb]" /></label></div><button className="mt-6 w-full rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0c625e]">Add subject</button></form><div className="rounded-2xl border border-[#dbeafe] bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">Subjects</h2><p className="mt-1 text-sm text-[#819391]">{visibleSubjects.length} subject{visibleSubjects.length === 1 ? '' : 's'} shown</p></div><div className="flex flex-wrap gap-2"><select aria-label="Filter by department" value={subjectDepartmentFilter} onChange={(event) => { setSubjectDepartmentFilter(event.target.value); setSubjectSemesterFilter('all') }} className="rounded-xl border border-[#dbeafe] bg-white px-3 py-2 text-sm"><option value="all">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select><select aria-label="Filter by semester" value={subjectSemesterFilter} onChange={(event) => setSubjectSemesterFilter(event.target.value)} className="rounded-xl border border-[#dbeafe] bg-white px-3 py-2 text-sm"><option value="all">All semesters</option>{subjectSemesterOptions.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}</select></div></div><div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-[#edf3f1] text-xs uppercase tracking-wider text-[#95a7a5]"><tr><th className="px-3 py-3">Subject</th><th className="px-3 py-3">Code</th><th className="px-3 py-3">Credits</th><th className="px-3 py-3">Semester</th><th className="px-3 py-3">Department</th><th className="px-3 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#edf3f1]">{visibleSubjects.map((subject) => { const semester = semesters.find((entry) => entry.id === subject.semester_id); const department = departments.find((entry) => entry.id === semester?.department_id); return <tr key={subject.id}><td className="px-3 py-4 font-medium">{subject.name}</td><td className="px-3 py-4 text-[#708684]">{subject.code || '—'}</td><td className="px-3 py-4 text-[#708684]">{subject.credits ?? '—'}</td><td className="px-3 py-4 text-[#708684]">{semester?.name || '—'}</td><td className="px-3 py-4 text-[#708684]">{department?.name || '—'}</td><td className="px-3 py-4 text-right text-[#94a6a4]">Admin tools soon</td></tr> })}{visibleSubjects.length === 0 && <tr><td colSpan={6} className="px-3 py-12 text-center text-[#819391]">No subjects match these filters.</td></tr>}</tbody></table></div></div></div>}
      </div></section>
    {departmentModal && <div className="fixed inset-0 z-30 grid place-items-center bg-[#123b3c]/30 p-4"><form onSubmit={saveDepartment} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">{editingDepartment ? 'Edit department' : 'Add department'}</h2><p className="mt-1 text-sm text-[#819391]">Keep naming consistent for students.</p></div><button type="button" onClick={() => setDepartmentModal(false)} className="text-2xl text-[#819391]">×</button></div><label className="mt-6 block text-xs font-semibold text-[#607877]">Name<input autoFocus required value={departmentForm.name} onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm outline-none focus:border-[#2563eb]" placeholder="Computer Science" /></label><label className="mt-4 block text-xs font-semibold text-[#607877]">Code<input value={departmentForm.code} onChange={(event) => setDepartmentForm({ ...departmentForm, code: event.target.value.toUpperCase() })} className="mt-2 w-full rounded-xl border border-[#dbeafe] px-3 py-3 text-sm outline-none focus:border-[#2563eb]" placeholder="CS" /></label><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDepartmentModal(false)} className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#607877]">Cancel</button><button className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white">{editingDepartment ? 'Save changes' : 'Add department'}</button></div></form></div>}
  </main>
}
