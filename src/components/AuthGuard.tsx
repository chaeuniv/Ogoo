'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const PUBLIC_PATHS = ['/login', '/auth/callback']
const DEV_SKIP = process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === 'true'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(DEV_SKIP)

  useEffect(() => {
    if (DEV_SKIP) return

    supabase.auth.getSession().then(({ data }) => {
      if (!PUBLIC_PATHS.includes(pathname) && !data.session) {
        router.replace('/login')
      } else {
        setChecked(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!DEV_SKIP && !PUBLIC_PATHS.includes(pathname) && !session) {
        router.replace('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router])

  if (!checked && !PUBLIC_PATHS.includes(pathname)) return null

  return <>{children}</>
}
