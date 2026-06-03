'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { getSession, onAuthStateChange } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/signup']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<Session | null | undefined>(undefined) // undefined = 로딩 중

  useEffect(() => {
    getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return
    if (!session && !PUBLIC_PATHS.includes(pathname)) {
      router.replace('/login')
    }
  }, [session, pathname, router])

  // 세션 확인 전: protected 경로는 빈 화면 유지 (깜빡임 방지)
  if (session === undefined && !PUBLIC_PATHS.includes(pathname)) return null

  return <>{children}</>
}
