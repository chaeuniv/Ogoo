'use client'

// 기록 화면 - 날짜 탭 시 노출되는 모달
// CASE 1: 해당 날짜 기록 없음 → 빈 상태 + 소비 기록하기 버튼
// CASE 2: 해당 날짜 기록 있음 → 카드 캐러셀 + 소비 요약 + 자세히 보기

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ── 타입 ──────────────────────────────────────────────────────
// logs/page.tsx 와 공유 (여기서 export → logs에서 import)

export type SpendingRecord = {
  id: string
  title: string           // 소비 내용 (없으면 category 표시)
  category: string | null // 카테고리
  date: string            // YYYY-MM-DD
  photo: string | null
  keyword: string | null
  amount: number
  reviewDone: boolean
}

interface Props {
  date: string               // YYYY-MM-DD
  records: SpendingRecord[]  // 해당 날짜의 기록 목록 (없으면 빈 배열)
  initialId?: string | null  // 상세 화면 뒤로가기 시 복원할 기록 id
  onClose: () => void
}

// ── 빈 상태 "텅" 일러스트 ─────────────────────────────────────

function EmptyIllustration() {
  return (
    <svg width="152" height="206" viewBox="0 0 152 206" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M53.6675 82.9502L52.7955 86.0024L72.7653 85.7408L73.2886 93.4148L59.7718 94.5484V98.0366L77.5616 97.6006L76.0791 109.896L37.3602 109.635L39.2787 69.8695H76.6024L75.1199 82.0782L53.6675 82.9502ZM111.31 79.462L110.525 91.3219L110.263 111.03H88.6366L89.7703 92.8043L82.8811 93.1532L83.3171 82.5142L93.9561 81.8165L94.9153 65.9453H112.705L111.31 79.462ZM84.7996 130.39C85.7298 129.459 86.1949 128.5 86.1949 127.512C86.1949 126.349 85.6426 125.39 84.538 124.634C83.7822 123.878 82.7648 123.355 81.4858 123.064C80.2068 122.716 78.8406 122.599 77.3872 122.716C75.3524 122.716 73.2014 123.355 70.934 124.634C70.062 125.157 69.3644 125.768 68.8411 126.465C68.3179 127.163 68.0563 127.861 68.0563 128.558C68.0563 129.314 68.347 129.983 68.9283 130.564C69.4516 131.203 70.2945 131.785 71.4573 132.308C72.62 132.831 73.8409 133.151 75.1199 133.267C77.2709 133.267 78.8406 133.064 79.8289 132.657C81.6312 132.424 83.288 131.669 84.7996 130.39ZM104.595 120.71C108.083 122.919 109.827 125.564 109.827 128.645C109.827 131.494 108.316 134.168 105.293 136.668C103.549 138.122 101.194 139.43 98.2291 140.593C95.2642 141.755 92.0085 142.685 88.4622 143.383C84.2764 144.081 80.6138 144.43 77.4744 144.43C76.5442 144.43 75.2071 144.371 73.463 144.255C68.8702 144.023 64.6553 143.267 60.8183 141.988C56.9813 140.767 54.0745 139.226 52.0978 137.366C50.3537 135.622 49.4817 133.791 49.4817 131.872C49.4817 129.895 50.3537 127.948 52.0978 126.029C53.8419 124.053 56.2837 122.309 59.423 120.797C66.1087 117.6 73.2014 115.885 80.701 115.652H80.8754C85.5263 115.536 90.0028 115.943 94.3049 116.873C98.607 117.745 102.037 119.024 104.595 120.71Z" fill="#242424"/>
    </svg>
  )
}

// ── 모달 ──────────────────────────────────────────────────────

export default function DayModal({ date, records, initialId, onClose }: Props) {
  const router = useRouter()
  const initialIdx = initialId ? Math.max(records.findIndex(r => r.id === initialId), 0) : 0
  const [currentIdx, setCurrentIdx] = useState(initialIdx)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const hasRecords = records.length > 0
  const record = records[currentIdx] ?? null

  // YYYY-MM-DD → YYYY.MM.DD
  const displayDate = date.replace(/-/g, '.')

  // 소비 내용 우선, 없으면 카테고리
  const displayText = record
    ? (record.title.trim() || record.category || '')
    : ''

  // 기록 플로우 시작 — sessionStorage에 날짜 저장 후 step1 진입
  const handleStartRecord = () => {
    sessionStorage.setItem('presetRecordDate', date)
    onClose()
    router.push('/record/step1')
  }

  // 터치 스와이프로 기록 슬라이드
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const diff = touchStartX - e.changedTouches[0].clientX
    if (diff > 50 && currentIdx < records.length - 1) setCurrentIdx(i => i + 1)
    else if (diff < -50 && currentIdx > 0) setCurrentIdx(i => i - 1)
    setTouchStartX(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-5"
      style={{ background: 'rgba(128,128,128,0.65)' }}
      onClick={onClose}
    >
      {/* ── 카드 + X 버튼 래퍼 ─────────────────────────────── */}
      <div className="relative w-72" onClick={e => e.stopPropagation()}>

        {/* X 버튼 — 카드 바깥, 우측 상단 바로 위 */}
        <button
          onClick={onClose}
          className="absolute -top-9 right-0 p-2"
          aria-label="닫기"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* ── 모달 카드 — 카드 전체 스와이프 가능 ─────────────── */}
        <div
          className="w-full bg-white rounded-3xl overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >

        {/* 날짜 */}
        <p className="pt-5 pb-1 text-sm font-semibold text-gray-700 text-center">
          {displayDate}
        </p>

        {/* ── CASE 2: 기록 있음 ─────────────────────────────── */}
        {hasRecords ? (
          <>
            {/* 인디케이터 도트 */}
            <div className="flex items-center justify-center gap-1.5 py-3">
              {records.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  style={{
                    width: i === currentIdx ? 16 : 6,
                    height: 6,
                    borderRadius: 999,
                    background: i === currentIdx ? '#242424' : '#D1D5DB',
                    transition: 'width 150ms ease',
                  }}
                />
              ))}
            </div>

            {/* 사진 영역 */}
            <div
              className="mx-4 rounded-2xl overflow-hidden bg-gray-100"
              style={{ height: 220 }}
            >
              {record?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={record.photo} alt={displayText} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="w-12 h-12">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              )}
            </div>

            {/* 소비 요약 — 두 줄 */}
            <div className="pt-5 pb-5 text-center px-6">
              <p className="text-base font-bold text-gray-900" style={{ lineHeight: 1.9 }}>
                {/* 첫째 줄: [소비 내용/카테고리]에 */}
                <span style={{ background: '#F5F378', padding: '2px 6px' }}>
                  {displayText}
                </span>
                에
                <br />
                {/* 둘째 줄: [금액]원을 소비했어요 */}
                <span style={{ background: '#F5F378', padding: '2px 6px' }}>
                  {record?.amount.toLocaleString('ko-KR')}원
                </span>
                을 소비했어요
              </p>
            </div>

            {/* 자세히 보기 — 카드 바닥 꽉 채운 다크 버튼 */}
            <button
              onClick={() => {
                sessionStorage.setItem('modalRestore', JSON.stringify({ date, id: record?.id }))
                router.push(`/logs/${record?.id}`)
              }}
              className="w-full py-4 bg-gray-900 text-white text-sm font-semibold active:opacity-80 transition-opacity"
            >
              자세히 보기
            </button>
          </>
        ) : (
          /* ── CASE 1: 기록 없음 ────────────────────────────── */
          <>
            {/* 기록 있는 경우와 세로 높이 맞춤 (dots 30 + photo 220 + text 100 ≈ 350) */}
            <div
              className="flex flex-col items-center justify-center gap-5 px-6"
              style={{ minHeight: 350 }}
            >
              <p className="text-base font-bold text-gray-900">소비 기록이 없어요</p>
              <EmptyIllustration />
            </div>

            {/* 소비 기록하기 — 자세히 보기와 동일한 레이아웃·폰트 */}
            <button
              onClick={handleStartRecord}
              className="w-full py-4 bg-gray-900 text-white text-sm font-semibold active:opacity-80 transition-opacity"
            >
              소비 기록하기
            </button>
          </>
        )}
        </div>{/* /모달 카드 */}
      </div>{/* /래퍼 */}

      {/* 소비 기록 추가하기 — 래퍼 우측 정렬 */}
      {hasRecords && (
        <div className="w-72 flex justify-end mt-3">
          <button
            onClick={e => { e.stopPropagation(); handleStartRecord() }}
            className="text-sm font-medium text-white active:opacity-70"
          >
            소비 기록 추가하기
          </button>
        </div>
      )}
    </div>
  )
}
