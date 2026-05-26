'use client'

// Step 6: 회고 Rating (과거 날짜 기록 전용, 4일 이상 경과 시만 노출)
// - 별점 1~5 선택 → 이유 칩 즉시 노출 (별점 1~2: 불만족 칩, 3~5: 만족 칩)
// - 별점 변경 시 이유 초기화
// - 이유 칩 선택은 선택사항 (재탭 시 해제)
// - 완료(저장→홈) / 이어서 기록하기(저장→step1)
// - 프로그레스 바: 6/6 = 100%

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRecord } from '../RecordProvider'
import CancelConfirmModal from '@/components/CancelConfirmModal'

// ── 이유 칩 목록 ─────────────────────────────────────────────
const CHIPS_NEGATIVE = [
  '순간 감정에 휩쓸렸어',
  '품질·가성비가 별로야',
  '비슷한 게 있었어',
  '예산을 초과했어',
  '기타',
]
const CHIPS_POSITIVE = [
  '기분이 풀렸어',
  '품질·가성비가 좋아',
  '갖고 싶었던 거야',
  '딱 필요했던 거야',
  '기타',
]

// ── 별점 아이콘 ───────────────────────────────────────────────

function StarIcon({ filled, size = 36 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#242424' : 'none'}
      stroke="#242424"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export default function Step6Page() {
  const router = useRouter()
  const { state, set, reset } = useRecord()
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [hovered, setHovered] = useState<number | null>(null) // 호버 중인 별 인덱스

  // 별점과 이유는 RecordProvider state에 저장
  const rating = state.rating      // 1~5, null이면 미선택
  const reason = state.reviewReason // 선택된 이유 칩, null이면 미선택

  // 별점 선택 시 이유 초기화 후 새 별점 저장
  const handleStarClick = (star: number) => {
    set({ rating: star, reviewReason: null })
  }

  // 이유 칩 토글 (재탭 시 해제)
  const handleChipClick = (chip: string) => {
    set({ reviewReason: reason === chip ? null : chip })
  }

  // 별점 기준으로 칩 목록 결정
  const chips = rating !== null ? (rating <= 2 ? CHIPS_NEGATIVE : CHIPS_POSITIVE) : []
  const chipQuestion = rating !== null
    ? (rating <= 2 ? '소비에 불만족하는 이유가 뭔가요?' : '소비에 만족한 이유가 뭔가요?')
    : ''

  // 완료 버튼 활성 조건: 별점 선택됨 (이유는 선택사항)
  const canSubmit = rating !== null

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // TODO: 실제 저장 로직으로 교체
  const save = async () => {
    await new Promise((r) => setTimeout(r, 400))
    // ex) await fetch('/api/records', { method: 'POST', body: JSON.stringify(state) })
  }

  // 완료: 저장 후 홈으로
  const handleSave = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      await save()
      reset()
      router.push('/')
    } catch {
      showToast('잠시 후 다시 시도해주세요')
    } finally {
      setSaving(false)
    }
  }

  // 이어서 기록하기: 저장 후 step1 + 상태 초기화
  const handleContinue = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      await save()
      reset()
      router.push('/record/step1')
    } catch {
      showToast('잠시 후 다시 시도해주세요')
    } finally {
      setSaving(false)
    }
  }

  const [showCancelModal, setShowCancelModal] = useState(false)

  // X 버튼: 확인 팝업 열기
  const handleCancel = () => setShowCancelModal(true)
  const handleConfirmCancel = () => { reset(); router.push('/logs') }

  // 표시할 별 인덱스 (hover 우선, 없으면 실제 선택값)
  const displayRating = hovered ?? rating ?? 0

  return (
    <div className="relative flex flex-col max-w-md mx-auto bg-white overflow-hidden" style={{ height: '100dvh' }}>
      {showCancelModal && <CancelConfirmModal onConfirm={handleConfirmCancel} onClose={() => setShowCancelModal(false)} />}
      {/* 상단 네비게이션 */}
      <div
        className="flex items-center justify-between px-5 pb-4 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        {/* ← 뒤로가기: step5로 복귀, 데이터 유지 */}
        <button onClick={() => router.back()} className="p-2 -ml-2" aria-label="뒤로가기">
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        {/* X 버튼: 기록 전체 취소 */}
        <button onClick={handleCancel} className="p-2 -mr-2" aria-label="기록 취소">
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 프로그레스 바: 6/6 = 100% */}
      <div className="h-1 bg-gray-200 shrink-0">
        <div className="h-full bg-yellow-400" style={{ width: '100%' }} />
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col px-5 pt-10 gap-8 overflow-y-auto pb-6">

        {/* 질문 + 별점 UI */}
        <div className="flex flex-col gap-6">
          <h1 className="text-xl font-bold text-gray-900 leading-snug">
            소비에 얼마나<br />만족하나요?
          </h1>

          {/* 별점 선택: 1~5개 탭으로 선택, 호버 효과 */}
          <div
            className="flex gap-2"
            onMouseLeave={() => setHovered(null)}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => setHovered(star)}
                className="p-1 active:scale-90 transition-transform"
                aria-label={`별점 ${star}개`}
              >
                <StarIcon filled={star <= displayRating} size={36} />
              </button>
            ))}
          </div>
        </div>

        {/* 이유 칩 — 별점 선택 즉시 노출, 별점 변경 시 초기화 */}
        {rating !== null && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-700">{chipQuestion}</p>
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => {
                const selected = reason === chip
                return (
                  <button
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      selected
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {chip}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 하단 버튼: 이어서 기록하기 + 완료 ─────────────────── */}
      {/* 별점 미선택 시 두 버튼 모두 비활성 */}

      <div className="px-5 pb-4 pt-2 shrink-0">
        <button
          onClick={handleContinue}
          disabled={!canSubmit || saving}
          className="w-full py-4 rounded-2xl text-base font-semibold border-2 border-black text-black hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          이어서 기록하기
        </button>
      </div>
      <button
        onClick={handleSave}
        disabled={!canSubmit || saving}
        className="w-full py-5 bg-black text-white text-base font-semibold shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {saving ? '저장 중...' : '완료'}
      </button>

      {/* 에러 토스트 */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}
