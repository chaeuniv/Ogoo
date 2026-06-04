'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/lib/auth'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)
    const { error } = await signup(email, password)
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="relative flex flex-col max-w-md mx-auto bg-white" style={{ height: '100dvh' }}>
        <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
          <p className="text-5xl font-black tracking-tighter text-zinc-950">OGOO</p>
          <p className="text-base font-medium text-zinc-700 mt-8">이메일을 확인해주세요</p>
          <p className="text-sm text-gray-400 mt-2">{email}으로 인증 메일을 보냈어요.</p>
          <Link href="/login" className="mt-8 text-sm text-zinc-700 font-medium underline">
            로그인하러 가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col max-w-md mx-auto bg-white" style={{ height: '100dvh' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <p className="text-5xl font-black tracking-tighter text-zinc-950">OGOO</p>
        <p className="text-sm text-gray-400 font-medium mt-3">나의 소비를 솔직하게 돌아보는 공간</p>

        <form onSubmit={handleSubmit} className="w-full mt-10 flex flex-col gap-3">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-4 font-bold text-base bg-zinc-950 text-white active:brightness-95 transition-all disabled:opacity-50 mt-1"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-sm text-gray-400 mt-5">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-zinc-700 font-medium underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
