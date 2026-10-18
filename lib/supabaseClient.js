import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[v0] Supabase environment variables are not configured.')
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key')

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('id, name, email, role').eq('id', userId).single()
  return { profile: data, error }
}

export function dashboardForRole(role) {
  return role === 'admin' ? '/admin/dashboard' : '/student/dashboard'
}

export function friendlyAuthError(error) {
  if (!error) return ''
  const message = error.message?.toLowerCase() || ''
  if (message.includes('invalid login credentials')) return 'Invalid email or password.'
  if (message.includes('email not confirmed')) return 'Please confirm your email before signing in.'
  if (message.includes('password')) return 'Please use a stronger password.'
  if (message.includes('rate limit')) return 'Too many attempts. Please try again shortly.'
  return 'Something went wrong. Please try again.'
}

export async function recordSuccessfulLogin(userId) {
  const device = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null
  const [logResult, profileResult] = await Promise.all([
    supabase.from('login_logs').insert({
      user_id: userId,
      login_time: new Date().toISOString(),
      ip_address: null,
      device,
    }),
    supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', userId),
  ])

  return {
    error: logResult.error || profileResult.error,
  }
}

export async function signOut() {
  return supabase.auth.signOut()
}
