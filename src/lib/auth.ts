import { supabase } from './supabase'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export async function login(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signup(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export async function logout() {
  return supabase.auth.signOut()
}

export async function getSession() {
  return supabase.auth.getSession()
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(callback)
}
