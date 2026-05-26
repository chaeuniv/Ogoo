'use client'

// 로그인/회원가입 화면
// 카카오 소셜 로그인 버튼 (API 연동 전: mock 처리)
// 로그인 성공 → 홈(/) 이동

import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()

  const handleKakaoLogin = () => {
    // TODO: 실제 카카오 OAuth 연동으로 교체
    login()
    router.replace('/')
  }

  return (
    <div
      className="relative flex flex-col max-w-md mx-auto bg-white"
      style={{ height: '100dvh' }}
    >
      {/* 로고 + 버튼 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <p className="text-5xl font-black tracking-tighter text-zinc-950">OGOO</p>
        <p className="text-sm text-gray-400 font-medium mt-3">나의 소비를 솔직하게 돌아보는 공간</p>

        {/* 카카오 로그인 버튼 */}
        <button
          onClick={handleKakaoLogin}
          className="flex items-center justify-center gap-2.5 rounded-2xl py-4 px-10 font-bold text-base active:brightness-95 transition-all mt-10"
          style={{ background: '#FEE500', color: 'rgba(0,0,0,0.85)' }}
        >
          {/* 카카오 말풍선 아이콘 */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11 1C5.477 1 1 4.582 1 9C1 11.83 2.696 14.328 5.27 15.85L4.18 19.61C4.09 19.924 4.432 20.175 4.706 19.997L9.115 17.148C9.736 17.228 10.364 17.27 11 17.27C16.523 17.27 21 13.688 21 9C21 4.582 16.523 1 11 1Z"
              fill="rgba(0,0,0,0.85)"
            />
          </svg>
          카카오로 시작하기
        </button>
      </div>
    </div>
  )
}
