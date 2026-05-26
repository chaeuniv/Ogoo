'use client'

// 미로그인 상태에서 보호된 페이지 접근 시 /login으로 리다이렉트
// PUBLIC_PATHS에 포함된 경로는 인증 없이 접근 허용

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'

const PUBLIC_PATHS = ['/login']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!PUBLIC_PATHS.includes(pathname) && !isLoggedIn()) {
      router.replace('/login')
    } else {
      setChecked(true)
    }
  }, [pathname, router])

  // 로그인 확인 전 빈 화면 (깜빡임 방지)
  if (!checked && !PUBLIC_PATHS.includes(pathname)) return null

  return <>{children}</>
}
