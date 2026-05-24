'use client'

// 기록(로그) 페이지
// 월 캘린더 + 감정 도트 + 회고 대기 섹션 + 소비 기록 추가 버튼(+)
// 기록 없음 / 있음 상태를 hasAnyRecord 플래그로 엄격히 구분

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

// ── 데이터 타입 ───────────────────────────────────────────────
// API 연동 시 이 타입을 기준으로 실제 데이터로 교체하세요

type SpendingRecord = {
  id: string
  title: string          // 소비명
  date: string           // YYYY-MM-DD
  photo: string | null   // 썸네일 이미지 URL (없으면 null)
  keyword: string | null // 소비 키워드
  amount: number         // 소비 금액
  reviewDone: boolean    // 회고 완료 여부
}

// ── 목 데이터 ─────────────────────────────────────────────────
// ⚠️ API 연동 시 아래 상수를 제거하고 실제 fetch 결과로 교체하세요.
// 데이터가 없으면 빈 배열([])로 두면 자동으로 빈 상태 UI가 표시됩니다.

const MOCK_RECORDS: SpendingRecord[] = [
  // 회고 미완료 (3일+ 경과) → 회고 대기 섹션 노출
  { id: '1', title: '말차 아인슈페너', date: '2026-05-10', photo: null, keyword: '소확행',    amount: 7500,  reviewDone: false },
  { id: '2', title: '배달',           date: '2026-04-20', photo: null, keyword: '충동적 소비', amount: 25000, reviewDone: false },
  { id: '3', title: '패션잡화',       date: '2026-04-10', photo: null, keyword: '충동적 소비', amount: 89000, reviewDone: false },
  // 회고 완료 → 캘린더 도트만 표시
  { id: '4', title: '편의점 간식',   date: '2026-05-08', photo: null, keyword: '합리적 소비',   amount: 4800,  reviewDone: true },
  { id: '5', title: '카페',          date: '2026-05-06', photo: null, keyword: '소확행',      amount: 6000,  reviewDone: true },
  { id: '6', title: '온라인 쇼핑',  date: '2026-05-03', photo: null, keyword: '충동적 소비', amount: 52000, reviewDone: true },
  { id: '7', title: '헬스장',       date: '2026-05-01', photo: null, keyword: '합리적 소비',   amount: 60000, reviewDone: true },
  { id: '8', title: '서점',         date: '2026-05-15', photo: null, keyword: '소확행',      amount: 18000, reviewDone: true },
]

// ── 날짜 유틸 ─────────────────────────────────────────────────

const today = new Date()
const TODAY_YEAR = today.getFullYear()
const TODAY_MONTH = today.getMonth() + 1

// 오늘로부터 dateStr까지 경과 일수 (회고 대기 조건 판단에 사용)
function daysSince(dateStr: string): number {
  const base = new Date(today)
  base.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.floor((base.getTime() - target.getTime()) / 86400000)
}

// "YYYY-MM-DD" → "YYYY.MM.DD" (회고 카드 날짜 표시용)
function formatRecordDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y}.${m}.${d}`
}

// 해당 연월의 마지막 날 (캘린더 셀 생성에 사용)
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

// 해당 연월 1일의 요일 (0=일 ~ 6=토, 그리드 앞 빈칸 계산에 사용)
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

// 7×N 캘린더 셀 배열 생성 (빈 칸은 null)
function getCalendarCells(year: number, month: number): (number | null)[] {
  const firstDay = getFirstDayOfWeek(year, month)
  const days = getDaysInMonth(year, month)
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

// 감정 도트 색상 결정
// 긍정(소확행) → 초록 / 그 외 → 주황
const POSITIVE_KEYWORDS = ['소확행']
function getDotColor(keyword: string | null): string | null {
  if (!keyword) return null
  return POSITIVE_KEYWORDS.includes(keyword) ? '#4ADE80' : '#FB923C'
}

// ── 스크롤 피커 컬럼 ─────────────────────────────────────────
// 캘린더 연/월 이동 시 사용하는 드럼롤 스타일 피커 (미래 달 선택 불가)

const ITEM_H = 48   // 각 항목 높이(px)
const VISIBLE = 7   // 화면에 보이는 항목 수
const YEARS = Array.from({ length: TODAY_YEAR - 2020 + 1 }, (_, i) => 2020 + i)
const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

function ScrollCol({
  items, label, selectedIdx, onIdxChange,
}: {
  items: number[]
  label: (v: number) => string
  selectedIdx: number
  onIdxChange: (idx: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const lastSynced = useRef(selectedIdx)

  useEffect(() => {
    if (ref.current) { ref.current.scrollTop = selectedIdx * ITEM_H; lastSynced.current = selectedIdx }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ref.current && lastSynced.current !== selectedIdx) {
      ref.current.scrollTop = selectedIdx * ITEM_H; lastSynced.current = selectedIdx
    }
  }, [selectedIdx])

  const handleScroll = () => {
    if (!ref.current) return
    const idx = Math.round(ref.current.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(idx, items.length - 1))
    lastSynced.current = clamped; onIdxChange(clamped)
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <div className="absolute inset-x-1 pointer-events-none rounded-xl" style={{ top: ITEM_H * 3, height: ITEM_H, background: 'rgba(0,0,0,0.07)', zIndex: 1 }} />
      <div ref={ref} onScroll={handleScroll} style={{ height: ITEM_H * VISIBLE, overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div style={{ height: ITEM_H * 3 }} />
        {items.map((item, i) => (
          <div key={item} style={{ height: ITEM_H, scrollSnapAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i === selectedIdx ? 18 : 15, fontWeight: i === selectedIdx ? 700 : 400, color: i === selectedIdx ? '#111' : '#bbb' }}>
            {label(item)}
          </div>
        ))}
        <div style={{ height: ITEM_H * 3 }} />
      </div>
    </div>
  )
}

// ── 회고 대기 카드 ────────────────────────────────────────────

function PendingCard({ record }: { record: SpendingRecord }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      {/* 썸네일 */}
      <div className="w-14 h-14 rounded-xl bg-gray-200 shrink-0 overflow-hidden">
        {record.photo
          ? <img src={record.photo} alt={record.title} className="w-full h-full object-cover" />
          : null}
      </div>
      {/* 소비 정보 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{record.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatRecordDate(record.date)}</p>
      </div>
    </div>
  )
}

// ── 페이지 ────────────────────────────────────────────────────

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const PENDING_DISPLAY_LIMIT = 3

export default function LogsPage() {
  const [year, setYear] = useState(TODAY_YEAR)
  const [month, setMonth] = useState(TODAY_MONTH)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerYearIdx, setPickerYearIdx] = useState(() => YEARS.indexOf(TODAY_YEAR))
  const [pickerMonthIdx, setPickerMonthIdx] = useState(() => TODAY_MONTH - 1)

  const pickerYear = YEARS[pickerYearIdx] ?? YEARS[0]
  const months = pickerYear === TODAY_YEAR ? ALL_MONTHS.slice(0, TODAY_MONTH) : ALL_MONTHS

  useEffect(() => {
    if (pickerMonthIdx >= months.length) setPickerMonthIdx(months.length - 1)
  }, [pickerYearIdx, months.length])

  // ── 데이터 파생 상태 ─────────────────────────────────────────

  const hasAnyRecord = MOCK_RECORDS.length > 0

  // 날짜별 대표 감정 도트 색상 맵 (YYYY-MM-DD → color)
  const dotMap = useMemo(() => {
    const byDate: Record<string, SpendingRecord[]> = {}
    MOCK_RECORDS.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = []
      byDate[r.date].push(r)
    })
    const map: Record<string, string> = {}
    Object.entries(byDate).forEach(([date, records]) => {
      // 긍정 기록이 하나라도 있으면 초록, 없으면 주황
      // ⚠️ 대표 감정 기준은 팀 확인 필요 — 현재는 긍정 우선
      const representativeKeyword = records.find(r => POSITIVE_KEYWORDS.includes(r.keyword ?? ''))?.keyword
        ?? records[0]?.keyword
        ?? null
      const color = getDotColor(representativeKeyword)
      if (color) map[date] = color
    })
    return map
  }, [])

  // 회고 대기 목록: 3일+ 경과 & 회고 미완료, 최신순
  const pendingRecords = useMemo(() =>
    MOCK_RECORDS
      .filter(r => !r.reviewDone && daysSince(r.date) >= 3)
      .sort((a, b) => b.date.localeCompare(a.date)),
    []
  )
  const showPendingSection = pendingRecords.length > 0
  const displayedPending = pendingRecords.slice(0, PENDING_DISPLAY_LIMIT)
  const hasMore = pendingRecords.length > PENDING_DISPLAY_LIMIT

  // 캘린더
  const cells = getCalendarCells(year, month)
  const shortYear = String(year).slice(2)
  const isNextDisabled = year > TODAY_YEAR || (year === TODAY_YEAR && month >= TODAY_MONTH)

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1) }
  const nextMonth = () => {
    if (isNextDisabled) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1)
  }
  const openPicker = () => { setPickerYearIdx(YEARS.indexOf(year)); setPickerMonthIdx(month - 1); setShowPicker(true) }
  const handlePickerConfirm = () => { setYear(pickerYear); setMonth(months[pickerMonthIdx] ?? 1); setShowPicker(false) }

  return (
    <div className="relative flex flex-col max-w-md mx-auto bg-white" style={{ height: '100dvh' }}>
      {/* 헤더 */}
      <header
        className="flex items-center justify-between px-5 pb-4 border-b border-gray-100 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <span className="text-xl font-bold tracking-tight text-zinc-950">OGOO</span>
        <button aria-label="알림" className="p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* 캘린더 연/월 헤더 */}
        <div className="flex items-center justify-center gap-4 py-4">
          <button onClick={prevMonth} className="p-2" aria-label="이전 달">
            <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button onClick={openPicker} className="text-base font-bold text-gray-900">
            {shortYear}년 {month}월
          </button>
          <button onClick={nextMonth} disabled={isNextDisabled} className="p-2 disabled:opacity-30" aria-label="다음 달">
            <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 px-3 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 px-3 gap-y-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} className="w-8 h-8 mx-auto" />

            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dotColor = dotMap[dateStr] ?? null

            return (
              <div key={i} className="flex flex-col items-center py-1">
                <div className="w-8 h-8 flex items-center justify-center">
                  <span className="text-sm text-gray-800">{String(day).padStart(2, '0')}</span>
                </div>
                {/* 감정 도트 — 기록 있는 날만 표시 */}
                <div className="h-2 flex items-center justify-center mt-0.5">
                  {dotColor && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── 기록 없음 빈 상태 ──────────────────────────────── */}
        {!hasAnyRecord && (
          <div className="mx-4 mt-6 rounded-2xl bg-gray-50 flex items-center justify-center py-8">
            <p className="text-sm text-gray-400 font-medium">아직 기록이 없어요</p>
          </div>
        )}

        {/* ── 회고 대기 섹션 ─────────────────────────────────── */}
        {/* 조건: 기록 존재 + 3일 이상 경과 + 회고 미완료 1개 이상 */}
        {hasAnyRecord && showPendingSection && (
          <div className="mt-10">
            <p className="px-5 text-base font-bold text-gray-900 mb-2">
              아직 돌아보지 못한 소비가 있어요
            </p>

            <div className="divide-y divide-gray-50">
              {displayedPending.map(record => (
                <PendingCard key={record.id} record={record} />
              ))}
            </div>

            {/* 더보기 버튼 — 3개 초과 시 */}
            {hasMore && (
              <button className="w-full py-3 text-sm text-gray-400 font-medium">
                더보기
              </button>
            )}
          </div>
        )}

        <div className="h-28" />
      </div>

      {/* + 버튼 (플로팅) */}
      <div className="absolute right-6 pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom, 16px) + 70px + 16px)' }}>
        <Link
          href="/record/step1"
          className="pointer-events-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          aria-label="소비 기록 추가"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
      </div>

      <BottomNav />

      {/* 연/월 스크롤 피커 시트 */}
      {showPicker && (
        <div className="absolute inset-0 z-30 flex items-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowPicker(false)}>
          <div className="w-full bg-white rounded-t-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <p className="text-base font-bold text-gray-900">날짜 이동</p>
              <button onClick={() => setShowPicker(false)} className="p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex px-2 pb-2">
              <ScrollCol items={YEARS} label={v => `${v}년`} selectedIdx={pickerYearIdx} onIdxChange={setPickerYearIdx} />
              <ScrollCol items={months} label={v => `${v}월`} selectedIdx={pickerMonthIdx} onIdxChange={setPickerMonthIdx} />
            </div>
            <div className="px-4 pb-8 pt-2">
              <button onClick={handlePickerConfirm} className="w-full py-4 rounded-2xl bg-black text-white font-semibold text-base">완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
