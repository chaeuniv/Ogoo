'use client'

// 개인 정보 페이지
// - 계정 정보: 이메일, 가입일 (읽기 전용)
// - 보안: 비밀번호 변경 (바텀 시트)
//   현재 비밀번호 확인 후 새 비밀번호로 변경

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// 비밀번호 유효성 조건
// · 8자 이상
// · 영문 + 숫자 조합
const PASSWORD_MIN = 8
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/

type PwStatus = 'idle' | 'too_short' | 'invalid' | 'ok'

function getPwStatus(value: string): PwStatus {
  if (!value) return 'idle'
  if (value.length < PASSWORD_MIN) return 'too_short'
  if (!PASSWORD_REGEX.test(value)) return 'invalid'
  return 'ok'
}

const PW_MSG: Record<PwStatus, string> = {
  idle:      '',
  too_short: `${PASSWORD_MIN}자 이상 입력해주세요`,
  invalid:   '영문과 숫자를 모두 포함해주세요',
  ok:        '사용 가능한 비밀번호예요',
}

// ── 비밀번호 변경 바텀 시트 ─────────────────────────────────────
function PasswordSheet({ email, onClose }: { email: string; onClose: () => void }) {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const newPwStatus = getPwStatus(newPw)
  const isMatch = newPw === confirmPw && confirmPw.length > 0
  const canSubmit = currentPw.length > 0 && newPwStatus === 'ok' && isMatch && !loading

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [])

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)

    // 현재 비밀번호 검증 (재인증)
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password: currentPw })
    if (authErr) {
      setError('현재 비밀번호가 일치하지 않아요')
      setLoading(false)
      return
    }

    // 새 비밀번호로 변경
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPw })
    setLoading(false)
    if (updateErr) {
      setError('비밀번호 변경에 실패했어요. 다시 시도해주세요')
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="absolute inset-0 z-40 flex items-end" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="w-full bg-white rounded-t-3xl" onClick={e => e.stopPropagation()}>
          <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mt-3 mb-6" />
          <div className="px-5 pb-4 text-center">
            <p className="text-xl mb-2">✓</p>
            <p className="text-base font-bold text-gray-900 mb-1">비밀번호가 변경됐어요</p>
            <p className="text-sm text-gray-400 mb-6">다음 로그인부터 새 비밀번호를 사용해주세요</p>
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl text-base font-bold text-white"
              style={{ background: '#121211' }}
            >
              확인
            </button>
          </div>
          <div style={{ height: 'max(env(safe-area-inset-bottom, 0px), 16px)' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-40 flex items-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mt-3 mb-5" />

        <div className="px-5 pb-2">
          <p className="text-base font-bold text-gray-900 mb-5">비밀번호 변경</p>

          {/* 현재 비밀번호 */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">현재 비밀번호</p>
            <input
              ref={inputRef}
              type="password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              placeholder="현재 비밀번호를 입력해주세요"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 text-sm text-gray-900 outline-none focus:bg-gray-100 transition-colors placeholder:text-gray-400"
            />
          </div>

          {/* 새 비밀번호 */}
          <div className="mb-1">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">새 비밀번호</p>
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="영문 + 숫자 조합 8자 이상"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 text-sm text-gray-900 outline-none focus:bg-gray-100 transition-colors placeholder:text-gray-400"
            />
            {newPwStatus !== 'idle' && (
              <p className="text-xs mt-1.5 text-right" style={{ color: newPwStatus === 'ok' ? '#22C55E' : '#EF4444' }}>
                {PW_MSG[newPwStatus]}
              </p>
            )}
          </div>

          {/* 새 비밀번호 확인 */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-1.5 mt-3">새 비밀번호 확인</p>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="새 비밀번호를 다시 입력해주세요"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 text-sm text-gray-900 outline-none focus:bg-gray-100 transition-colors placeholder:text-gray-400"
            />
            {confirmPw.length > 0 && (
              <p className="text-xs mt-1.5 text-right" style={{ color: isMatch ? '#22C55E' : '#EF4444' }}>
                {isMatch ? '비밀번호가 일치해요' : '비밀번호가 일치하지 않아요'}
              </p>
            )}
          </div>

          {error && <p className="text-xs text-red-500 mb-3 text-center">{error}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-4 text-base font-bold transition-opacity disabled:opacity-40"
          style={{ background: '#121211', color: '#F5F378' }}
        >
          {loading ? '변경 중...' : '변경하기'}
        </button>
        <div style={{ height: 'max(env(safe-area-inset-bottom, 0px), 0px)' }} />
      </div>
    </div>
  )
}

// ── 정보 행 ─────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-4">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  )
}

// ── 페이지 ──────────────────────────────────────────────────────
export default function PrivacyPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [joinedAt, setJoinedAt] = useState('')
  const [showPwSheet, setShowPwSheet] = useState(false)

  useEffect(() => {
    getSession().then(({ data }) => {
      const user = data.session?.user
      if (!user) return
      setEmail(user.email ?? '')
      if (user.created_at) {
        const d = new Date(user.created_at)
        setJoinedAt(`${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}.`)
      }
    })
  }, [])

  return (
    <div className="relative flex flex-col max-w-md mx-auto bg-white" style={{ height: '100dvh' }}>

      {/* 헤더 */}
      <header
        className="flex items-center justify-between px-4 pb-3 border-b border-gray-100 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <button onClick={() => router.back()} className="p-2 -ml-2" aria-label="뒤로가기">
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <span className="text-base font-bold text-gray-900">개인 정보</span>
        <div className="w-9" />
      </header>

      <div className="flex-1 overflow-y-auto">

        {/* 계정 정보 */}
        <div className="px-5 pt-2">
          <p className="text-xs font-semibold text-gray-400 tracking-wide pt-5 pb-1">계정 정보</p>
          <div className="divide-y divide-gray-100">
            <InfoRow label="이메일" value={email || '—'} />
            <InfoRow label="가입일" value={joinedAt || '—'} />
          </div>
        </div>

        <div className="h-px bg-gray-100 mx-5 mt-2" />

        {/* 보안 */}
        <div className="px-5">
          <p className="text-xs font-semibold text-gray-400 tracking-wide pt-5 pb-1">보안</p>
          <button
            onClick={() => setShowPwSheet(true)}
            className="w-full flex items-center justify-between py-4 active:bg-gray-50 -mx-0 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-gray-900 text-left">비밀번호 변경</p>
              <p className="text-xs text-gray-400 mt-0.5 text-left">영문 + 숫자 조합 8자 이상</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

      </div>

      <BottomNav />

      {showPwSheet && (
        <PasswordSheet email={email} onClose={() => setShowPwSheet(false)} />
      )}
    </div>
  )
}
