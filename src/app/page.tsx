import Link from 'next/link'

function BasketIllustration() {
  /*
   * 사다리꼴 바구니: 위쪽이 넓고 아래로 살짝 좁아지는 형태
   * 상단: x 18~282 (폭 264), 하단: x 38~262 (폭 224), 높이 150
   *
   * 세로 격자 5개 (6칸 균등 분할):
   *   상단 간격 44px, 하단 간격 37.3px
   *   i=1: 62→75  i=2: 106→113  i=3: 150→150  i=4: 194→187  i=5: 238→225
   *
   * 가로 격자 (t = (y-42)/150, left=18+20t, right=282-20t):
   *   y=92 → x(25, 275)
   *   y=135 → x(30, 270)
   *   y=170 → x(35, 265)
   */
  return (
    <svg
      viewBox="0 0 300 215"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* 바구니 외곽선 (사다리꼴) */}
      <path
        d="M18 42 L282 42 L262 192 L38 192 Z"
        stroke="#C8C8C8"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* 세로 격자선 (사다리꼴에 맞게 기울어짐) */}
      <line x1="62"  y1="42" x2="75"  y2="192" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="106" y1="42" x2="113" y2="192" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="150" y1="42" x2="150" y2="192" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="194" y1="42" x2="187" y2="192" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="238" y1="42" x2="225" y2="192" stroke="#C8C8C8" strokeWidth="2.5" />

      {/* 가로 격자선 (사다리꼴 안에 맞게 끝점 계산) */}
      <line x1="25" y1="92"  x2="275" y2="92"  stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="30" y1="135" x2="270" y2="135" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="35" y1="170" x2="265" y2="170" stroke="#C8C8C8" strokeWidth="2.5" />

      {/* 하단 둥근 바닥 바 */}
      <rect x="34" y="190" width="232" height="15" rx="7.5" fill="#C8C8C8" />
    </svg>
  )
}

const TABS = [
  {
    label: '홈',
    active: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: '기록',
    active: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    label: '분석',
    active: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: '마이',
    active: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function Home() {
  const today = new Date()
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`

  return (
    <div
      className="flex flex-col max-w-md mx-auto bg-white"
      style={{ height: '100dvh' }}
    >
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

      {/* 날짜 + 서브타이틀 */}
      <div className="text-center pt-7 pb-4 shrink-0">
        <p className="text-base font-medium text-gray-800">{dateStr}</p>
        <p className="text-sm text-gray-400 mt-1">오늘의 소비를 등록해보세요</p>
      </div>

      {/* 바구니 일러스트 — 남은 공간 모두 사용 */}
      <div className="flex-1 flex items-center justify-center px-8 min-h-0">
        <BasketIllustration />
      </div>

      {/* + 버튼 */}
      <div className="flex justify-end px-6 py-4 shrink-0">
        <Link
          href="/record/step1"
          className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          aria-label="소비 기록 추가"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
      </div>

      {/* 하단 탭바 */}
      <nav
        className="flex border-t border-gray-100 shrink-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.label}
            className={`flex-1 flex flex-col items-center pt-3 pb-2 gap-1 text-xs transition-colors ${
              tab.active ? 'text-black font-semibold' : 'text-gray-400'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
