'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace('/')
      } else {
        router.replace('/login')
      }
    })
  }, [router])

  return (
    <div className="flex items-center justify-center bg-white" style={{ height: '100dvh' }}>
      <p className="text-sm text-gray-400">로그인 중...</p>
    </div>
  )
}
