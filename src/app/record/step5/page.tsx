'use client'

// Step 5: 메모 입력 + 저장 or Step 6 이동
// 소비 날짜 기준 4일 이상 경과 여부에 따라 하단 버튼 분기:
//   - 최근(4일 미만): 완료(저장→홈) / 이어서 기록하기(저장→step1)
//   - 과거(4일 이상): 다음(→step6, 저장 없이 이동)
// 메모는 선택사항, 최대 50자

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRecord, isPastRecord, getTotalSteps } from '../RecordProvider'
import CancelConfirmModal from '@/components/CancelConfirmModal'
import { authFetch } from '@/lib/api'
import { toCategoryEnum, toKeywordEnum } from '@/lib/mappings'
import { photoUrlToFile } from '@/lib/photo'

const MAX_CHARS = 50

export default function Step5Page() {
  const router = useRouter()
  const { state, set, reset } = useRecord()
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // 소비 날짜 기준 4일 이상 경과 여부 → 버튼 및 프로그레스바 분기
  const isPast = isPastRecord(state.recordDate)
  // 프로그레스바 4번째 칸 (step5) / 총 칸 수 (최근: 4/4=100%, 과거: 4/5=80%)
  const totalSteps = getTotalSteps(state.recordDate)
  const progressPct = (4 / totalSteps) * 100

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const save = async () => {
    // 사진이 있으면 먼저 Storage에 업로드하고 upload_id 획득
    let upload_id: string | undefined
    if (state.photo) {
      try {
        const file = await photoUrlToFile(state.photo)
        const formData = new FormData()
        formData.append('image', file)
        formData.append('source', state.photoSource ?? 'CAMERA')
        const uploadRes = await authFetch('/api/consumptions/receipt/upload', { method: 'POST', body: formData })
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json()
          upload_id = uploadJson.data?.upload_id as string | undefined
        } else {
          const errJson = await uploadRes.json().catch(() => ({}))
          console.error('Photo upload failed:', uploadRes.status, errJson)
          showToast('사진 업로드에 실패했어요. 소비 기록만 저장됩니다.')
        }
      } catch (err) {
        console.error('Photo upload error:', err)
        showToast('사진 업로드 중 오류가 발생했어요.')
      }
    }

    const title = state.description.trim() || state.category || '소비'
    const body = JSON.stringify({
      title,
      amount: parseInt(state.amount, 10),
      category: toCategoryEnum(state.category ?? '기타'),
      keyword: toKeywordEnum(state.keyword ?? '잘 모르겠어요'),
      emotion: state.emotionTemp,
      consumed_at: state.recordDate,
      ...(state.memo.trim() ? { memo: state.memo.trim() } : {}),
      ...(upload_id ? { upload_id } : {}),
    })

    const editId = sessionStorage.getItem('editRecordId')
    const res = editId
      ? await authFetch(`/api/consumptions/${editId}`, { method: 'PATCH', body })
      : await authFetch('/api/consumptions', { method: 'POST', body })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error((json as { error?: string }).error ?? '저장에 실패했습니다')
    }
  }

  // 완료: 저장 후 홈으로 이동 (최근 날짜만)
  const handleSave = async () => {
    setSaving(true)
    try {
      await save()
      sessionStorage.removeItem('editRecordId')
      reset()
      router.push('/')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '잠시 후 다시 시도해주세요')
    } finally {
      setSaving(false)
    }
  }

  // 이어서 기록하기: 저장 후 step1 + 상태 초기화 (최근 날짜만)
  const handleContinue = async () => {
    setSaving(true)
    try {
      await save()
      sessionStorage.removeItem('editRecordId')
      reset()
      router.push('/record/step1')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '잠시 후 다시 시도해주세요')
    } finally {
      setSaving(false)
    }
  }

  // 다음: step6로 이동 (과거 날짜만 — 저장은 step6에서)
  const handleNext = () => {
    router.push('/record/step6')
  }

  const [showCancelModal, setShowCancelModal] = useState(false)
  const handleCancel = () => setShowCancelModal(true)
  const handleConfirmCancel = () => { reset(); router.push('/logs') }

  return (
    <div className="relative flex flex-col max-w-md mx-auto bg-white overflow-hidden" style={{ height: '100dvh' }}>
      {showCancelModal && <CancelConfirmModal onConfirm={handleConfirmCancel} onClose={() => setShowCancelModal(false)} />}
      {/* 상단 네비게이션 */}
      <div
        className="flex items-center justify-between px-5 pb-4 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <button onClick={() => router.back()} className="p-2 -ml-2" aria-label="뒤로가기">
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <button onClick={handleCancel} className="p-2 -mr-2" aria-label="기록 취소">
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 프로그레스 바: 4/totalSteps (최근=4/4=100%, 과거=4/5=80%) */}
      <div className="h-1 bg-gray-200 shrink-0">
        <div className="h-full bg-yellow-400" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="px-5 pb-2 pt-6 shrink-0">
        <h1 className="text-xl font-bold text-gray-900">메모</h1>
        <p className="text-sm text-gray-400 mt-1">선택사항이에요</p>
      </div>

      {/* 메모 입력창 + 글자 수 카운터 */}
      <div className="flex-1 px-5 py-4">
        <div className="relative">
          <textarea
            value={state.memo}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) set({ memo: e.target.value })
            }}
            placeholder="이번 소비에 대해 한 마디..."
            rows={6}
            className="w-full border-2 border-gray-100 rounded-2xl px-4 py-4 text-base resize-none outline-none focus:border-gray-300 transition-colors placeholder:text-gray-300 text-gray-900"
          />
          <span className="absolute bottom-4 right-4 text-xs text-gray-400 select-none">
            {state.memo.length}/{MAX_CHARS}
          </span>
        </div>
      </div>

      {/* ── 하단 버튼: 날짜 조건에 따라 분기 ─────────────────── */}

      {isPast ? (
        // 과거 날짜 (4일+): 다음 → step6 회고 Rating
        <button
          onClick={handleNext}
          className="w-full py-5 bg-black text-white text-base font-semibold shrink-0"
        >
          다음
        </button>
      ) : (
        // 최근 날짜: 이어서 기록하기(외곽선) + 완료(꽉찬 검정)
        <>
          <div className="px-5 pb-4 pt-2 shrink-0">
            <button
              onClick={handleContinue}
              disabled={saving}
              className="w-full py-4 rounded-2xl text-base font-semibold border-2 border-black text-black hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              이어서 기록하기
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-5 bg-black text-white text-base font-semibold shrink-0 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '완료'}
          </button>
        </>
      )}

      {/* 에러 토스트 */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}
