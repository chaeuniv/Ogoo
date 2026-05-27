import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

type AuthUser = { id: string }

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  if (process.env.DEV_SKIP_AUTH === 'true' && process.env.DEV_USER_ID) {
    return { id: process.env.DEV_USER_ID }
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}
