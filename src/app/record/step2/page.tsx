'use client'

// Step 2: 카테고리(바텀시트) + 금액(인라인) + 소비 내용 입력
// 와이어프레임 기반: 문장형 UI ("카테고리에 / N원을 소비했어요")
// - 카테고리 pill 탭 → 바텀시트 (기본 7개 + 사용자 추가 최대 5개 + [+ 추가] 칩)
// - 날짜: pill 버튼 탭 → 확인 모달 → 스크롤 피커 시트 (미래 날짜 선택 불가)

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRecord, getTotalSteps } from '../RecordProvider'
import CancelConfirmModal from '@/components/CancelConfirmModal'

// ── 카테고리 상수 ─────────────────────────────────────────────
const DEFAULT_CATEGORIES = ['카페·편의점', '외식·배달', '패션잡화', '화장품', '주류', '문화생활', '기타']
const MAX_CUSTOM = 5         // 사용자 추가 카테고리 최대 개수
const MAX_CAT_NAME_LEN = 8  // 카테고리 이름 최대 글자 수

// ── 금액 포맷 ─────────────────────────────────────────────────
// 숫자 문자열 → 한국식 콤마 포맷 (표시용, 저장은 콤마 없이)
function formatAmount(raw: string): string {
  const num = parseInt(raw, 10)
  if (isNaN(num)) return ''
  return num.toLocaleString('ko-KR')
}

// ── 날짜 유틸 ─────────────────────────────────────────────────
// "YYYY-MM-DD" → { year, month, day } 분해
function parseDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { year: y, month: m, day: d }
}

// "YYYY-MM-DD" → "YYYY. MM. DD" (날짜 pill 표시용)
function formatDateDisplay(dateStr: string) {
  const { year, month, day } = parseDate(dateStr)
  return `${year}. ${String(month).padStart(2, '0')}. ${String(day).padStart(2, '0')}`
}

// 해당 연월의 마지막 날 (피커 일 목록 생성에 사용)
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

// ── 스크롤 피커 컬럼 ─────────────────────────────────────────
const ITEM_H = 48   // 각 항목 높이(px)
const VISIBLE = 7   // 화면에 보이는 항목 수

const today = new Date()
const TODAY_YEAR = today.getFullYear()
const TODAY_MONTH = today.getMonth() + 1
const TODAY_DAY = today.getDate()

// 미래 날짜 선택 불가: 2020년~올해, 올해면 현재 월까지
const YEARS = Array.from({ length: TODAY_YEAR - 2020 + 1 }, (_, i) => 2020 + i)
const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

// 드럼롤 스타일 단일 컬럼 (연 / 월 / 일 각각 하나씩 사용)
function ScrollCol({
  items,
  label,
  selectedIdx,
  onIdxChange,
}: {
  items: number[]
  label: (v: number) => string
  selectedIdx: number
  onIdxChange: (idx: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const lastSynced = useRef(selectedIdx)

  // 마운트 시 선택 항목으로 즉시 스크롤
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = selectedIdx * ITEM_H
      lastSynced.current = selectedIdx
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 외부(연/월 변경)로 selectedIdx가 바뀌면 스크롤 동기화
  useEffect(() => {
    if (ref.current && lastSynced.current !== selectedIdx) {
      ref.current.scrollTop = selectedIdx * ITEM_H
      lastSynced.current = selectedIdx
    }
  }, [selectedIdx])

  // 스크롤 멈추면 가장 가까운 항목 인덱스를 부모에 전달
  const handleScroll = () => {
    if (!ref.current) return
    const idx = Math.round(ref.current.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(idx, items.length - 1))
    lastSynced.current = clamped
    onIdxChange(clamped)
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* 선택 항목 하이라이트 배경 */}
      <div
        className="absolute inset-x-1 pointer-events-none rounded-xl"
        style={{ top: ITEM_H * 3, height: ITEM_H, background: 'rgba(0,0,0,0.07)', zIndex: 1 }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        style={{
          height: ITEM_H * VISIBLE,
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}
      >
        {/* 위아래 패딩: 선택 항목이 중앙에 오도록 */}
        <div style={{ height: ITEM_H * 3 }} />
        {items.map((item, i) => (
          <div
            key={item}
            style={{
              height: ITEM_H,
              scrollSnapAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: i === selectedIdx ? 18 : 15,
              fontWeight: i === selectedIdx ? 700 : 400,
              color: i === selectedIdx ? '#111' : '#bbb',
            }}
          >
            {label(item)}
          </div>
        ))}
        <div style={{ height: ITEM_H * 3 }} />
      </div>
    </div>
  )
}

// ── 페이지 ────────────────────────────────────────────────────

export default function Step2Page() {
  const router = useRouter()
  const { state, set, reset } = useRecord()
  const [attempted, setAttempted] = useState(false)

  // 프로그레스바 1번째 칸 / 총 칸 수 (최근:4, 과거:5)
  const totalSteps = getTotalSteps(state.recordDate)
  const progressPct = (1 / totalSteps) * 100

  // ── 카테고리 상태 ──────────────────────────────────────────
  // ⚠️ customCategories는 로컬 상태 — API 연동 시 마이페이지와 동기화 필요
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [showCategorySheet, setShowCategorySheet] = useState(false)
  const [sheetSelected, setSheetSelected] = useState<string | null>(null) // 시트 내 임시 선택값 (확인 전까지 반영 안 됨)
  const [showAddInput, setShowAddInput] = useState(false)   // + 추가 입력창 표시 여부
  const [addInputValue, setAddInputValue] = useState('')    // + 추가 입력 텍스트
  const [toast, setToast] = useState<string | null>(null)   // 토스트 메시지
  const addInputRef = useRef<HTMLInputElement>(null)

  // 기본 카테고리 뒤, + 추가 앞에 사용자 추가 카테고리 배치
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories]

  // 토스트 표시 후 3초 뒤 자동 숨김
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // 카테고리 pill 탭 → 바텀시트 열기 (현재 선택값 미리 반영)
  const openCategorySheet = () => {
    setSheetSelected(state.category)
    setShowAddInput(false)
    setAddInputValue('')
    setShowCategorySheet(true)
  }

  // 시트 내 칩 선택 (재탭 시 해제)
  const handleSheetChipSelect = (cat: string) => {
    setSheetSelected(prev => prev === cat ? null : cat)
  }

  // 바텀시트 확인 → RecordProvider에 저장 후 닫기
  const handleSheetConfirm = () => {
    set({ category: sheetSelected })
    setShowCategorySheet(false)
  }

  // + 추가 칩 탭: 최대 초과 시 토스트, 아니면 입력창 표시
  const handleAddChipTap = () => {
    if (customCategories.length >= MAX_CUSTOM) {
      showToast('최대 5개까지 추가할 수 있어요')
      return
    }
    setShowAddInput(true)
    setAddInputValue('')
    setTimeout(() => addInputRef.current?.focus(), 50)
  }

  // 커스텀 카테고리 확인: 목록 추가 + 시트 내 자동 선택
  const handleAddConfirm = () => {
    const trimmed = addInputValue.trim()
    if (!trimmed) { setShowAddInput(false); return }
    setCustomCategories(prev => [...prev, trimmed])
    setSheetSelected(trimmed)
    setShowAddInput(false)
    setAddInputValue('')
  }

  // ── 날짜 피커 상태 ─────────────────────────────────────────
  const [showDatePicker, setShowDatePicker] = useState(false)

  const initDate = parseDate(state.recordDate)
  const [pickerYearIdx, setPickerYearIdx] = useState(() => {
    const idx = YEARS.indexOf(initDate.year)
    return idx >= 0 ? idx : 0
  })
  const [pickerMonthIdx, setPickerMonthIdx] = useState(() => initDate.month - 1)
  const [pickerDayIdx, setPickerDayIdx] = useState(() => initDate.day - 1)

  const pickerYear = YEARS[pickerYearIdx] ?? YEARS[0]
  // 올해면 현재 월까지만, 이전 연도면 12달 전부
  const months = pickerYear === TODAY_YEAR ? ALL_MONTHS.slice(0, TODAY_MONTH) : ALL_MONTHS
  const pickerMonth = months[pickerMonthIdx] ?? 1
  // 올해 이번 달이면 오늘까지만, 그 외엔 해당 월의 마지막 날까지
  const maxDay =
    pickerYear === TODAY_YEAR && pickerMonth === TODAY_MONTH
      ? TODAY_DAY
      : getDaysInMonth(pickerYear, pickerMonth)
  const days = Array.from({ length: maxDay }, (_, i) => i + 1)

  // 연도 변경 시 월 인덱스 범위 초과 방지
  useEffect(() => {
    if (pickerMonthIdx >= months.length) setPickerMonthIdx(months.length - 1)
  }, [pickerYearIdx, months.length])

  // 월/연도 변경 시 일 인덱스 범위 초과 방지
  useEffect(() => {
    if (pickerDayIdx >= days.length) setPickerDayIdx(days.length - 1)
  }, [pickerMonthIdx, pickerYearIdx, days.length])

  // 날짜 pill 탭 → 현재 선택 날짜로 피커 초기화 후 시트 열기
  const openDatePicker = () => {
    const { year, month, day } = parseDate(state.recordDate)
    const yIdx = YEARS.indexOf(year)
    setPickerYearIdx(yIdx >= 0 ? yIdx : 0)
    setPickerMonthIdx(month - 1)
    setPickerDayIdx(day - 1)
    setShowDatePicker(true)
  }

  // 피커 완료 → "YYYY-MM-DD" 형식으로 RecordProvider에 저장
  const handleDatePickerConfirm = () => {
    const y = pickerYear
    const m = String(pickerMonth).padStart(2, '0')
    const d = String(days[pickerDayIdx] ?? 1).padStart(2, '0')
    set({ recordDate: `${y}-${m}-${d}` })
    setShowDatePicker(false)
  }

  // ── 금액 입력 ──────────────────────────────────────────────
  // 숫자 이외 문자 제거 후 저장 (표시는 formatAmount로 콤마 포맷)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '')
    set({ amount: digits })
  }

  // ── 다음 버튼 ──────────────────────────────────────────────
  // 카테고리·금액 미입력 시 에러 표시, 둘 다 있으면 step3 이동
  const handleNext = () => {
    setAttempted(true)
    if (!state.category || !state.amount || !state.description.trim()) return
    router.push('/record/step3')
  }

  // 기록화면 날짜 모달에서 날짜 지정 후 진입한 경우 → 해당 날짜로 자동 설정
  useEffect(() => {
    const preset = sessionStorage.getItem('presetRecordDate')
    if (preset && /^\d{4}-\d{2}-\d{2}$/.test(preset)) {
      set({ recordDate: preset })
      sessionStorage.removeItem('presetRecordDate')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // OCR 결과가 있으면 description, amount 자동 채움 (이미 값이 없을 때만)
  useEffect(() => {
    const patch: Record<string, string> = {}
    if (!state.description && state.ocrTitle) patch.description = state.ocrTitle
    if (!state.amount && state.ocrAmount) patch.amount = state.ocrAmount
    if (Object.keys(patch).length > 0) set(patch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 상세 화면 수정하기에서 사진 있는 기록으로 진입한 경우 → 기존 사진 미리 주입
  useEffect(() => {
    const presetPhoto = sessionStorage.getItem('presetPhoto')
    if (presetPhoto) {
      set({ photo: presetPhoto })
      sessionStorage.removeItem('presetPhoto')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [showCancelModal, setShowCancelModal] = useState(false)

  // X 버튼: 확인 팝업 열기
  const handleCancel = () => setShowCancelModal(true)

  // 팝업 확인: 상태 초기화 후 기록화면으로
  const handleConfirmCancel = () => { reset(); router.push('/logs') }

  const isCategoryError = attempted && !state.category
  const isAmountError = attempted && !state.amount
  const isDescriptionError = attempted && !state.description.trim()

  return (
    <div className="relative flex flex-col max-w-md mx-auto bg-white overflow-hidden" style={{ height: '100dvh' }}>
      {showCancelModal && <CancelConfirmModal onConfirm={handleConfirmCancel} onClose={() => setShowCancelModal(false)} />}
      {/* 상단 네비게이션 */}
      <div
        className="flex items-center justify-between px-5 pb-4 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <button onClick={() => router.push('/record/step1')} className="p-2 -ml-2" aria-label="뒤로가기">
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

      {/* 프로그레스 바: 1/totalSteps */}
      <div className="h-1 bg-gray-200 shrink-0">
        <div className="h-full bg-yellow-400" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="flex-1 flex flex-col px-5 pt-6 gap-8 overflow-y-auto pb-6">

        {/* 날짜 pill */}
        <div className="flex justify-center">
          <button
            onClick={openDatePicker}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white active:bg-gray-50 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span className="text-sm font-semibold text-gray-800">{formatDateDisplay(state.recordDate)}</span>
          </button>
        </div>

        {/* 사진 — 중앙 크게 */}
        <div className="flex justify-center">
          {state.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.photo} alt="선택한 사진" className="w-56 h-56 rounded-2xl object-cover" />
          ) : (
            <div className="w-56 h-44 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="w-10 h-10">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          )}
        </div>

        {/* "카테고리 ∨ 에" 문장형 행 — 탭 시 바텀시트 오픈 */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={openCategorySheet}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                isCategoryError ? 'border-red-400 text-red-400' : 'border-gray-300 text-gray-900'
              }`}
            >
              <span>{state.category || '카테고리'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <span className="text-lg font-semibold text-gray-900">에</span>
          </div>
          {isCategoryError && (
            <p className="text-red-500 text-xs">카테고리를 선택해주세요</p>
          )}
        </div>

        {/* "소비 금액 [인라인 입력] 원을 소비했어요" 문장형 행 */}
        <div className="flex flex-col items-center gap-1.5">
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
            <p className="text-red-500 text-xs">금액을 입력해주세요</p>
          )}
        </div>

        {/* 소비 내용 입력 */}
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            placeholder="소비 내용 입력"
            value={state.description}
            onChange={(e) => set({ description: e.target.value })}
            className={`w-full px-4 py-4 rounded-xl text-sm text-gray-900 outline-none placeholder:text-gray-400 transition-colors ${
              isDescriptionError ? 'bg-red-50 ring-1 ring-red-300' : 'bg-gray-100 focus:bg-gray-50'
            }`}
          />
          {isDescriptionError && (
            <p className="text-red-500 text-xs">소비 내용을 입력해주세요</p>
          )}
        </div>
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={handleNext}
        className="w-full py-5 bg-black text-white text-base font-semibold shrink-0"
      >
        다음
      </button>

      {/* ── 카테고리 바텀시트 ────────────────────────────────── */}
      {showCategorySheet && (
        <div
          className="absolute inset-0 z-30 flex items-end"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowCategorySheet(false)}
        >
          <div className="w-full bg-white rounded-t-3xl" onClick={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <p className="text-base font-bold text-gray-900">카테고리</p>
              <button onClick={() => setShowCategorySheet(false)} className="p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 칩 목록: 기본 + 사용자 추가 + [+ 추가] */}
            <div className="px-5 pt-4 pb-2 flex flex-wrap gap-2">
              {allCategories.map((cat) => {
                const selected = sheetSelected === cat
                return (
                  <button
                    key={cat}
                    onClick={() => handleSheetChipSelect(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      selected
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}

              {/* + 추가 칩: 최대 도달 시 비활성 */}
              <button
                onClick={handleAddChipTap}
                className={`px-4 py-2 rounded-full text-sm font-medium border border-dashed transition-colors ${
                  customCategories.length >= MAX_CUSTOM
                    ? 'border-gray-200 text-gray-300 cursor-default'
                    : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                + 추가
              </button>
            </div>

            {/* + 추가 입력창 (시트 내부) */}
            {showAddInput && (
              <div className="flex gap-2 items-center px-5 pt-1 pb-1">
                <input
                  ref={addInputRef}
                  type="text"
                  value={addInputValue}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CAT_NAME_LEN) setAddInputValue(e.target.value)
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddConfirm() }}
                  placeholder={`카테고리 이름 (최대 ${MAX_CAT_NAME_LEN}자)`}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
                  maxLength={MAX_CAT_NAME_LEN}
                />
                <button onClick={handleAddConfirm} className="px-3 py-2 bg-black text-white rounded-xl text-sm font-semibold shrink-0">확인</button>
                <button onClick={() => setShowAddInput(false)} className="px-3 py-2 text-gray-400 text-sm shrink-0">취소</button>
              </div>
            )}

            {/* 확인 버튼 */}
            <div className="px-5 pt-4 pb-8">
              <button
                onClick={handleSheetConfirm}
                className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-base"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 날짜 스크롤 피커 시트 ────────────────────────────── */}
      {showDatePicker && (
        <div
          className="absolute inset-0 z-30 flex items-end"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowDatePicker(false)}
        >
          <div className="w-full bg-white rounded-t-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <p className="text-base font-bold text-gray-900">캘린더 날짜 변경</p>
              <button onClick={() => setShowDatePicker(false)} className="p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex px-2 pb-2">
              <ScrollCol items={YEARS}  label={(v) => `${v}년`} selectedIdx={pickerYearIdx}  onIdxChange={setPickerYearIdx} />
              <ScrollCol items={months} label={(v) => `${v}월`} selectedIdx={pickerMonthIdx} onIdxChange={setPickerMonthIdx} />
              <ScrollCol items={days}   label={(v) => `${v}일`} selectedIdx={pickerDayIdx}   onIdxChange={setPickerDayIdx} />
            </div>
            <div className="px-4 pb-8 pt-2">
              <button
                onClick={handleDatePickerConfirm}
                className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-base"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 (최대 카테고리 초과 등) */}
      {toast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}
