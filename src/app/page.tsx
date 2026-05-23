// 홈 화면
// 오늘 날짜 + 바구니 일러스트 + 소비 기록 추가 버튼(+)

import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

// 바구니 일러스트 SVG — 디자인 시안 기반
function BasketIllustration() {
  return (
    <svg
      viewBox="0 0 300 215"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* 바구니 외곽 사다리꼴 */}
      <path d="M18 42 L282 42 L262 192 L38 192 Z" stroke="#C8C8C8" strokeWidth="3.5" strokeLinejoin="round" />
      {/* 세로 격자선 */}
      <line x1="62"  y1="42" x2="75"  y2="192" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="106" y1="42" x2="113" y2="192" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="150" y1="42" x2="150" y2="192" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="194" y1="42" x2="187" y2="192" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="238" y1="42" x2="225" y2="192" stroke="#C8C8C8" strokeWidth="2.5" />
      {/* 가로 격자선 */}
      <line x1="25" y1="92"  x2="275" y2="92"  stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="30" y1="135" x2="270" y2="135" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="35" y1="170" x2="265" y2="170" stroke="#C8C8C8" strokeWidth="2.5" />
      {/* 바구니 바닥 손잡이 */}
      <rect x="34" y="190" width="232" height="15" rx="7.5" fill="#C8C8C8" />
    </svg>
  )
}

export default function Home() {
  const today = new Date()
  // "YYYY.MM.DD" 형식으로 오늘 날짜 표시
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className="relative flex flex-col max-w-md mx-auto bg-white" style={{ height: '100dvh' }}>
      {/* 상단 헤더: 로고 + 알림 아이콘 */}
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

      {/* 날짜 + 서브타이틀 */}
      <div className="text-center pt-7 pb-4 shrink-0">
        <p className="text-base font-medium text-gray-800">{dateStr}</p>
        <p className="text-sm text-gray-400 mt-1">오늘의 소비를 등록해보세요</p>
      </div>

      {/* 바구니 일러스트 — pb-[88px]로 + 버튼 공간만큼 시각적 중심 보정 */}
      <div className="flex-1 flex items-center justify-center px-8 min-h-0 pb-[88px]">
        <BasketIllustration />
      </div>

      {/* + 버튼 (플로팅 FAB) — BottomNav 위 16px에 고정, 레이아웃 공간 차지 안 함 */}
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
    </div>
  )
}
