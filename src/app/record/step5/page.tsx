'use client'

// Step 5: 메모 입력 + 저장
// - 메모는 선택사항, 최대 50자
// - 완료: 저장 후 홈으로 / 이어서 기록하기: 저장 후 step1으로 (상태 초기화)
// - 저장 실패 시 토스트 메시지 표시

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRecord } from '../RecordProvider'

const MAX_CHARS = 50

export default function Step5Page() {
  const router = useRouter()
  const { state, set, reset } = useRecord()
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // TODO: 실제 저장 로직으로 교체 (현재 400ms 딜레이 플레이스홀더)
  const save = async () => {
    await new Promise((r) => setTimeout(r, 400))
    // ex) await fetch('/api/records', { method: 'POST', body: JSON.stringify(state) })
  }

  const handleSave = async () => {
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

  const handleContinue = async () => {
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

  const handleCancel = () => {
    reset()
    router.push('/')
  }

  return (
    <div className="flex flex-col max-w-md mx-auto bg-white overflow-hidden" style={{ height: '100dvh' }}>
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

      {/* 프로그레스 바: 5/5 = 100% */}
      <div className="h-1 bg-gray-200 shrink-0">
        <div className="h-full bg-yellow-400" style={{ width: '100%' }} />
      </div>

      <div className="px-5 pb-2 pt-6">
        <h1 className="text-xl font-bold text-gray-900">메모</h1>
        <p className="text-sm text-gray-400 mt-1">선택사항이에요</p>
      </div>

      <div className="flex-1 px-5 py-4">
        <div className="relative">
          <textarea
            value={state.memo}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) {
                set({ memo: e.target.value })
              }
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

      {/* 하단 버튼 영역 */}
      <div className="px-5 pb-10 pt-2 flex flex-col gap-3">
        <button
          onClick={handleContinue}
          disabled={saving}
          className="w-full py-4 rounded-2xl text-base font-semibold border-2 border-black text-black hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          이어서 기록하기
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl text-base font-semibold bg-black text-white disabled:opacity-50"
        >
          {saving ? '저장 중...' : '완료'}
        </button>
      </div>

      {/* 에러 토스트 */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}
