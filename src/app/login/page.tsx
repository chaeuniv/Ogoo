'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await login(email, password)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.replace('/')
    }
  }

  return (
    <div className="relative flex flex-col max-w-md mx-auto bg-white" style={{ height: '100dvh' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <svg width="120" height="120" viewBox="0 0 471 471" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="471" height="471" rx="58.875" fill="#242424"/>
          <path d="M176.625 17.6625C209.141 17.6627 235.5 44.0219 235.5 76.5375V176.625C235.5 209.141 209.141 235.5 176.625 235.5H76.5375C44.0219 235.5 17.6627 209.141 17.6625 176.625V76.5375C17.6625 44.0218 44.0217 17.6625 76.5375 17.6625H176.625ZM161.907 77.7152C134.919 77.7152 113.039 99.5934 113.039 126.581C113.04 153.569 134.919 175.448 161.907 175.448C188.894 175.447 210.773 153.569 210.773 126.581C210.773 99.5935 188.894 77.7155 161.907 77.7152Z" fill="#F5F378"/>
          <path d="M176.625 235.5C209.141 235.5 235.5 261.859 235.5 294.375V394.463C235.5 426.978 209.141 453.338 176.625 453.338H76.5374C44.0217 453.338 17.6626 426.978 17.6624 394.463V294.375C17.6624 261.859 44.0216 235.5 76.5374 235.5H176.625ZM161.906 295.553C134.918 295.553 113.039 317.431 113.039 344.419C113.039 371.407 134.918 393.285 161.906 393.285C188.894 393.285 210.773 371.407 210.773 344.419C210.773 317.431 188.894 295.553 161.906 295.553Z" fill="#F5F378"/>
          <path d="M394.463 235.5C426.978 235.5 453.338 261.859 453.338 294.375V394.463C453.338 426.978 426.978 453.338 394.463 453.338H294.375C261.859 453.338 235.5 426.978 235.5 394.463V294.375C235.5 261.859 261.859 235.5 294.375 235.5H394.463ZM379.744 295.553C352.756 295.553 330.878 317.431 330.878 344.419C330.878 371.407 352.756 393.285 379.744 393.285C406.732 393.285 428.61 371.407 428.61 344.419C428.61 317.431 406.732 295.553 379.744 295.553Z" fill="#F5F378"/>
          <path d="M394.463 17.6625C426.978 17.6628 453.338 44.0219 453.338 76.5375V82.8634C453.338 85.9628 449.512 87.6777 446.937 85.9528C439.17 80.7501 429.829 77.7153 419.778 77.7153C392.79 77.7155 370.912 99.5935 370.912 126.581C370.912 153.569 392.79 175.447 419.778 175.448C429.829 175.448 439.17 172.412 446.937 167.209C449.512 165.484 453.338 167.199 453.338 170.299V176.625C453.338 209.141 426.978 235.5 394.463 235.5H294.375C261.859 235.5 235.5 209.141 235.5 176.625V76.5375C235.5 44.0218 261.859 17.6625 294.375 17.6625H394.463Z" fill="#F5F378"/>
          <path d="M453.338 154.253V168.832C453.338 176.511 444.645 180.964 438.413 176.477L418.163 161.897C410.741 156.553 414.522 144.833 423.668 144.833H443.918C449.12 144.833 453.338 149.05 453.338 154.253Z" fill="#F5F378"/>
        </svg>
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
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-4 font-bold text-base bg-zinc-950 text-white active:brightness-95 transition-all disabled:opacity-50 mt-1"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-sm text-gray-400 mt-5">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-zinc-700 font-medium underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
