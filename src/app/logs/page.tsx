'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import DayModal, { SpendingRecord } from '@/components/DayModal'
import { authFetch } from '@/lib/api'
import { enumToKeyword, ENUM_DOT_COLORS } from '@/lib/mappings'

// ── 날짜 유틸 ─────────────────────────────────────────────────

const today = new Date()
const TODAY_YEAR = today.getFullYear()
const TODAY_MONTH = today.getMonth() + 1

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

function getCalendarCells(year: number, month: number): (number | null)[] {
  const firstDay = getFirstDayOfWeek(year, month)
  const days = getDaysInMonth(year, month)
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

// ── 스크롤 피커 컬럼 ─────────────────────────────────────────

const ITEM_H = 48
const VISIBLE = 7
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

// ── API 타입 ──────────────────────────────────────────────────

interface CalendarDay {
  date: string
  total_amount: number
  consumption_count: number
  dominant_emotion: string | null
  has_record: boolean
}

interface ApiItem {
  consumption_id: string
  title: string
  amount: number
  category: string
  emotion_tag: string
  emotion: number
  created_at: string
  thumbnail_url: string | null
}

// ── 페이지 ────────────────────────────────────────────────────

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function isTappable(y: number, m: number, d: number): boolean {
  const cell = new Date(y, m - 1, d)
  cell.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return cell <= now
}

export default function LogsPage() {
  const [year, setYear] = useState(TODAY_YEAR)
  const [month, setMonth] = useState(TODAY_MONTH)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerYearIdx, setPickerYearIdx] = useState(() => YEARS.indexOf(TODAY_YEAR))
  const [pickerMonthIdx, setPickerMonthIdx] = useState(() => TODAY_MONTH - 1)
<<<<<<< HEAD
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // ── API 데이터 상태 ────────────────────────────────────────
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [loadingCalendar, setLoadingCalendar] = useState(false)
  const [dayRecords, setDayRecords] = useState<SpendingRecord[]>([])
=======
  // sessionStorage에서 모달 복원 정보를 첫 렌더 전에 동기적으로 읽어 번쩍임 방지
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const raw = sessionStorage.getItem('modalRestore')
    return raw ? (JSON.parse(raw) as { date: string; id: string }).date : null
  })
  const [modalInitialId, setModalInitialId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const raw = sessionStorage.getItem('modalRestore')
    if (!raw) return null
    sessionStorage.removeItem('modalRestore')
    return (JSON.parse(raw) as { date: string; id: string }).id
  })
>>>>>>> fc64e4e (fix : 모달창<->기록상세화면 흐름 동작 수정)

  const pickerYear = YEARS[pickerYearIdx] ?? YEARS[0]
  const months = pickerYear === TODAY_YEAR ? ALL_MONTHS.slice(0, TODAY_MONTH) : ALL_MONTHS

  useEffect(() => {
    if (pickerMonthIdx >= months.length) setPickerMonthIdx(months.length - 1)
  }, [pickerYearIdx, months.length])

  // 연/월 변경 시 캘린더 데이터 fetch
  useEffect(() => {
    setLoadingCalendar(true)
    setCalendarDays([])
    authFetch(`/api/records/calendar?year=${year}&month=${month}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setCalendarDays(json.data.days)
      })
      .catch(() => {})
      .finally(() => setLoadingCalendar(false))
  }, [year, month])

  // 날짜 탭 시 해당 날짜 기록 fetch
  useEffect(() => {
    if (!selectedDate) { setDayRecords([]); return }
    authFetch(`/api/home/consumptions/today?date=${selectedDate}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setDayRecords(
            (json.data.items as ApiItem[]).map(item => ({
              id: item.consumption_id,
              title: item.title,
              category: item.category,
              date: selectedDate,
              photo: item.thumbnail_url,
              keyword: enumToKeyword(item.emotion_tag),
              amount: item.amount,
              reviewDone: false,
            }))
          )
        } else {
          setDayRecords([])
        }
      })
      .catch(() => setDayRecords([]))
  }, [selectedDate])

  // ── 파생 상태 ─────────────────────────────────────────────

  const hasAnyRecord = calendarDays.some(d => d.has_record)

  const dotMap = useMemo(() => {
    const map: Record<string, string> = {}
    calendarDays.forEach(day => {
      if (day.dominant_emotion && ENUM_DOT_COLORS[day.dominant_emotion]) {
        map[day.date] = ENUM_DOT_COLORS[day.dominant_emotion]
      }
    })
    return map
  }, [calendarDays])

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
            const tappable = isTappable(year, month, day)

            return (
              <button
                key={i}
                onClick={tappable ? () => setSelectedDate(dateStr) : undefined}
                className="flex flex-col items-center py-1"
                style={{ cursor: tappable ? 'pointer' : 'default' }}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <span className={`text-sm ${tappable ? 'text-gray-800' : 'text-gray-300'}`}>
                    {String(day).padStart(2, '0')}
                  </span>
                </div>
                <div className="h-2 flex items-center justify-center mt-0.5">
                  {dotColor && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* 기록 없음 빈 상태 */}
        {!loadingCalendar && !hasAnyRecord && (
          <div className="mx-4 mt-6 rounded-2xl bg-gray-50 flex items-center justify-center py-8">
            <p className="text-sm text-gray-400 font-medium">아직 기록이 없어요</p>
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

      {/* 날짜 탭 모달 */}
      {selectedDate && (
        <DayModal
          date={selectedDate}
<<<<<<< HEAD
          records={dayRecords}
          onClose={() => setSelectedDate(null)}
=======
          records={recordsByDate[selectedDate] ?? []}
          initialId={modalInitialId}
          onClose={() => { setSelectedDate(null); setModalInitialId(null) }}
>>>>>>> fc64e4e (fix : 모달창<->기록상세화면 흐름 동작 수정)
        />
      )}

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
