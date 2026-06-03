'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { getSession, logout } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const MAX_NICKNAME_LEN = 10

// ── 공통 아이콘 ──────────────────────────────────────────────

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────

function MenuCard({ children }: { children: React.ReactNode }) {
  return <div className="mx-5 rounded-2xl bg-gray-50 overflow-hidden">{children}</div>
}

function SectionLabel({ label }: { label: string }) {
  return <p className="px-5 pt-5 pb-2 text-xs font-semibold text-gray-400 tracking-wide">{label}</p>
}

function MenuItem({ label, color = 'text-gray-800', onClick }: { label: string; color?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium hover:bg-gray-100 transition-colors">
      <span className={color}>{label}</span>
      <ChevronRight />
    </button>
  )
}

function Divider() {
  return <div className="h-px bg-gray-100 mx-5" />
}

// ── 로그아웃 확인 모달 ────────────────────────────────────────

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onCancel}>
      <div className="bg-white rounded-2xl mx-6 overflow-hidden w-full max-w-xs" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-5 text-center">
          <p className="text-base font-bold text-gray-900">로그아웃 하시겠어요?</p>
        </div>
        <div className="flex border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 py-4 text-gray-500 text-sm font-medium border-r border-gray-100">취소</button>
          <button onClick={onConfirm} className="flex-1 py-4 text-red-500 text-sm font-bold">로그아웃</button>
        </div>
      </div>
    </div>
  )
}

// ── 페이지 ────────────────────────────────────────────────────

export default function MyPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [nickname, setNickname] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSession().then(({ data }) => {
      const user = data.session?.user
      if (!user) return
      const saved = user.user_metadata?.nickname as string | undefined
      const fallback = user.email?.split('@')[0] ?? ''
      setNickname(saved || fallback)
    })
  }, [])

  const startEditing = () => {
    setDraft(nickname)
    setError(null)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const cancelEditing = () => {
    setEditing(false)
    setError(null)
  }

  const saveNickname = async () => {
    const trimmed = draft.trim()
    if (!trimmed) { setError('닉네임을 입력해주세요'); return }
    setSaving(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ data: { nickname: trimmed } })
    setSaving(false)
    if (error) {
      setError('저장에 실패했어요. 다시 시도해주세요')
    } else {
      setNickname(trimmed)
      setEditing(false)
    }
  }

  const handleLogoutConfirm = async () => {
    await logout()
    setShowLogoutModal(false)
    router.replace('/login')
  }

  return (
    <div className="relative flex flex-col max-w-md mx-auto bg-white" style={{ height: '100dvh' }}>
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pb-4 border-b border-gray-100 shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}>
        <span className="text-xl font-bold tracking-tight text-zinc-950">OGOO</span>
        <button aria-label="알림" className="p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">

        {/* ── 프로필 영역 ── */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden shrink-0" />

          {/* 닉네임 + 편집 */}
          {editing ? (
            <div className="flex flex-col items-center gap-2 mt-3 w-full px-10">
              <input
                ref={inputRef}
                value={draft}
                onChange={e => { if (e.target.value.length <= MAX_NICKNAME_LEN) setDraft(e.target.value) }}
                onKeyDown={e => { if (e.key === 'Enter') saveNickname(); if (e.key === 'Escape') cancelEditing() }}
                maxLength={MAX_NICKNAME_LEN}
                className="w-full text-center text-lg font-bold text-gray-900 border-b-2 border-zinc-300 focus:border-zinc-900 outline-none pb-1 bg-transparent"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2 mt-1">
                <button onClick={cancelEditing} className="px-4 py-1.5 rounded-full text-xs font-semibold text-gray-500 border border-gray-200">취소</button>
                <button onClick={saveNickname} disabled={saving} className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-zinc-900 disabled:opacity-50">
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-lg font-bold text-gray-900">{nickname || '...'}</span>
              <button onClick={startEditing} aria-label="닉네임 편집" className="p-0.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── 통계 카드 ── */}
        <div className="mx-5 rounded-2xl bg-gray-50 px-4 py-5 mb-3">
          <div className="flex">
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400 font-medium">내 기록</span>
              <span className="text-base font-bold text-gray-900">-</span>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400 font-medium">최다 품목</span>
              <span className="text-base font-bold text-gray-900">-</span>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400 font-medium">최다 감정</span>
              <span className="text-base font-bold text-gray-900">-</span>
            </div>
          </div>
        </div>

        {/* ── 뱃지 배너 ── */}
        <button className="mx-5 w-[calc(100%-40px)] rounded-2xl px-5 py-5 mb-6 flex items-center justify-between active:scale-95 transition-transform" style={{ background: '#121211' }}>
          <div className="flex flex-col gap-1 text-left">
            <span className="text-sm font-bold" style={{ color: '#F5F378' }}>내 뱃지 보러가기!</span>
            <span className="text-sm text-white/70">-</span>
          </div>
          <div className="w-14 h-14 flex items-center justify-center shrink-0" style={{ clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)', background: 'rgba(245,243,120,0.15)' }}>
            <div className="w-8 h-8 rounded-full bg-white/20" />
          </div>
        </button>

        {/* ── 설정 메뉴 그룹 ── */}
        <SectionLabel label="설정" />
        <MenuCard>
          <MenuItem label="내 카테고리 관리" />
          <Divider />
          <MenuItem label="알림 설정" />
          <Divider />
          <MenuItem label="개인 정보" />
          <Divider />
          <MenuItem label="회원 탈퇴" />
          <Divider />
          <MenuItem label="로그아웃" color="text-red-500" onClick={() => setShowLogoutModal(true)} />
        </MenuCard>

        {/* ── 문의 메뉴 그룹 ── */}
        <SectionLabel label="문의" />
        <MenuCard>
          <MenuItem label="문의" />
        </MenuCard>

        <div className="h-6" />
      </div>

      <BottomNav />

      {showLogoutModal && (
        <LogoutModal onConfirm={handleLogoutConfirm} onCancel={() => setShowLogoutModal(false)} />
      )}
    </div>
  )
}
