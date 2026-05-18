'use client'

// Step 2: 카테고리(드롭다운) + 금액(인라인) + 소비 내용 입력
// 와이어프레임 기반: 문장형 UI ("카테고리에 / N원을 소비했어요")

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRecord } from '../RecordProvider'

const CATEGORIES = ['카페', '배달', '쇼핑', '편의점', '기타']

// 숫자 문자열 → "1,000" 포맷
function formatAmount(raw: string): string {
  const num = parseInt(raw, 10)
  if (isNaN(num)) return ''
  return num.toLocaleString('ko-KR')
}

export default function Step2Page() {
  const router = useRouter()
  const { state, set, reset } = useRecord()
  const [attempted, setAttempted] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '')
    set({ amount: digits })
  }

  const handleNext = () => {
    setAttempted(true)
    if (!state.category || !state.amount) return
    router.push('/record/step3')
  }

  const handleCancel = () => {
    reset()
    router.push('/')
  }

  const isCategoryError = attempted && !state.category
  const isAmountError = attempted && !state.amount

  return (
    <div className="flex flex-col max-w-md mx-auto bg-white overflow-hidden" style={{ height: '100dvh' }}>
      {/* 상단 네비게이션 */}
      <div
        className="flex items-center justify-between px-5 pb-4 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <button
          onClick={() => router.push('/record/step1')}
          className="p-2 -ml-2"
          aria-label="뒤로가기"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <button
          onClick={handleCancel}
          className="p-2 -mr-2"
          aria-label="기록 취소"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 프로그레스 바: 2/5 = 40% */}
      <div className="h-1 bg-gray-200">
        <div className="h-full bg-yellow-400" style={{ width: '25%' }} />
      </div>

      <div className="flex-1 flex flex-col px-5 pt-8 gap-8 overflow-y-auto pb-6">
        {/* 사진 — 중앙 크게 */}
        <div className="flex justify-center">
          {state.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.photo}
              alt="선택한 사진"
              className="w-56 h-56 rounded-2xl object-cover"
            />
          ) : (
            // 사진 없을 때 회색 플레이스홀더
            <div className="w-56 h-44 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="w-10 h-10">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          )}
        </div>

        {/* "카테고리 ∨ 에" 문장형 행 */}
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            {/* 드롭다운 트리거 버튼 */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                isCategoryError
                  ? 'border-red-400 text-red-400'
                  : 'border-gray-300 text-gray-900'
              }`}
            >
              <span>{state.category || '카테고리'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* 드롭다운 목록 */}
            {dropdownOpen && (
              <>
                {/* 투명 배경 — 바깥 클릭 시 닫힘 */}
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 min-w-36 overflow-hidden">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { set({ category: cat }); setDropdownOpen(false) }}
                      className={`w-full text-left px-5 py-3 text-sm hover:bg-gray-50 transition-colors ${
                        state.category === cat ? 'font-bold text-black' : 'text-gray-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <span className="text-lg font-semibold text-gray-900">에</span>
        </div>
        {isCategoryError && (
          <p className="text-red-500 text-xs -mt-6 text-center">카테고리를 선택해주세요</p>
        )}

        {/* "소비 금액 [인라인 입력] 원을 소비했어요" 문장형 행 */}
        <div className="flex items-baseline justify-center gap-2 flex-wrap">
          <span className="text-sm text-gray-700 font-medium">소비 금액</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formatAmount(state.amount)}
            onChange={handleAmountChange}
            placeholder="₩ 0"
            className={`w-28 border-b-2 pb-0.5 text-center text-lg font-bold outline-none bg-transparent text-gray-900 transition-colors placeholder:text-gray-300 ${
              isAmountError ? 'border-red-400' : 'border-gray-300 focus:border-black'
            }`}
          />
          <span className="text-lg font-semibold text-gray-900">원을 소비했어요</span>
        </div>
        {isAmountError && (
          <p className="text-red-500 text-xs -mt-6 text-center">금액을 입력해주세요</p>
        )}

        {/* 소비 내용 입력 */}
        <input
          type="text"
          placeholder="소비 내용 입력"
          value={state.description}
          onChange={(e) => set({ description: e.target.value })}
          className="w-full px-4 py-4 rounded-xl bg-gray-100 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:bg-gray-50 transition-colors"
        />
      </div>

      {/* 다음 버튼 — 풀width, 검은색, 하단 고정 */}
      <button
        onClick={handleNext}
        className="w-full py-5 bg-black text-white text-base font-semibold shrink-0"
      >
        다음
      </button>
    </div>
  )
}
