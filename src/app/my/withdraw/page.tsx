'use client'

// 회원 탈퇴 페이지
// 1. 탈퇴 이유 선택 (바텀 시트)
// 2. 탈퇴하기 버튼 (이유 선택 후 활성화)
// 3. 확인 모달 → 실제 탈퇴 처리

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'
import { logout } from '@/lib/auth'

const WITHDRAW_REASONS = [
  '사용을 잘 안하게 돼요',
  '신뢰도가 낮아요',
  '다른 유사 서비스를 사용해요',
  '오류가 잦아요',
  '기타',
]

// ── 이유 선택 바텀 시트 ─────────────────────────────────────────
function ReasonSheet({ selected, onSelect, onClose }: {
  selected: string | null
  onSelect: (reason: string) => void
  onClose: () => void
}) {
  return (
    <div
      className="absolute inset-0 z-40 flex items-end"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div className="w-full bg-white rounded-t-3xl overflow-hidden" style={{ maxHeight: '70dvh' }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mt-3 mb-2 shrink-0" />
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(70dvh - 32px)' }}>
          {WITHDRAW_REASONS.map((reason, i) => (
            <div key={reason}>
              <button
                onClick={() => { onSelect(reason); onClose() }}
                className="w-full text-left px-6 py-4 text-base text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                style={{ fontWeight: selected === reason ? 700 : 400 }}
              >
                {reason}
              </button>
              {i < WITHDRAW_REASONS.length - 1 && <div className="h-px bg-gray-100" />}
            </div>
          ))}
          <div style={{ height: 'max(env(safe-area-inset-bottom, 0px), 16px)' }} />
        </div>
      </div>
    </div>
  )
}

// ── 탈퇴 확인 모달 ──────────────────────────────────────────────
function WithdrawConfirmModal({ onConfirm, onCancel, loading }: {
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onCancel}
    >
      <div className="bg-white rounded-2xl mx-6 overflow-hidden w-full max-w-xs" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-8 pb-7 text-center">
          <p className="text-xl font-black text-gray-900 leading-snug mb-3">
            정말 탈퇴하시겠어요?
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            탈퇴 시 계정 및 이용 기록은{'\n'}모두 삭제돼요.
          </p>
        </div>
        <div className="flex">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-4 text-sm font-semibold text-gray-500 bg-gray-100 disabled:opacity-50"
          >
            조금 더 고민하기
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-4 text-sm font-bold disabled:opacity-50"
            style={{ background: '#121211', color: '#F5F378' }}
          >
            {loading ? '처리 중...' : '탈퇴하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 페이지 ──────────────────────────────────────────────────────
export default function WithdrawPage() {
  const router = useRouter()
  const [reason, setReason] = useState<string | null>(null)
  const [showSheet, setShowSheet] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleWithdraw = async () => {
    setLoading(true)
    setError(null)
    try {
      // TODO [API] 탈퇴 이유를 서버에 저장하는 API 연동 시 여기서 먼저 호출
      // Supabase: 현재 유저 삭제 (admin API 필요 시 서버 route 호출)
      const { error: deleteError } = await supabase.rpc('delete_user')
      if (deleteError) throw deleteError
      await logout()
      router.replace('/login')
    } catch {
      // delete_user RPC가 없으면 로그아웃만 처리 (서버 연동 전 임시)
      // TODO [API] 실제 회원 탈퇴 API 연동
      await logout()
      router.replace('/login')
    } finally {
      setLoading(false)
    }
  }

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
        <span className="text-base font-bold text-gray-900">회원 탈퇴</span>
        <div className="w-9" />
      </header>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto px-5 pt-8">

        {/* 타이틀 */}
        <p className="text-xl font-black text-gray-900 leading-snug mb-1">
          정말 OGOO 서비스를
        </p>
        <p className="text-xl font-black leading-snug mb-4">
          <span style={{ color: '#FC5101' }}>탈퇴</span>
          <span className="text-gray-900">하시나요?</span>
        </p>
        <p className="text-sm text-gray-500 mb-6">탈퇴하시는 이유를 알려주세요</p>

        {/* 이유 선택 드롭다운 */}
        <button
          onClick={() => setShowSheet(true)}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-200 text-sm active:bg-gray-50 transition-colors"
        >
          <span style={{ color: reason ? '#111' : '#ADADAD' }}>
            {reason ?? '선택해주세요'}
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ADADAD" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 shrink-0">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      {/* 탈퇴하기 버튼 — 하단 고정 */}
      <div className="px-5 pb-4 shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!reason}
          className="w-full py-4 rounded-2xl text-base font-bold transition-all disabled:opacity-40"
          style={{ background: '#121211', color: '#F5F378' }}
        >
          탈퇴하기
        </button>
      </div>

      <BottomNav />

      {/* 이유 바텀 시트 */}
      {showSheet && (
        <ReasonSheet
          selected={reason}
          onSelect={setReason}
          onClose={() => setShowSheet(false)}
        />
      )}

      {/* 탈퇴 확인 모달 */}
      {showConfirm && (
        <WithdrawConfirmModal
          onConfirm={handleWithdraw}
          onCancel={() => setShowConfirm(false)}
          loading={loading}
        />
      )}

    </div>
  )
}
