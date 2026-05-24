// 홈 화면
// 바구니 렌더링 순서: ① clipPath defs → ② 아이템(clipPath 적용) → ③ 바구니 앞면 선(DOM 마지막)
// DOM 순서로 앞면이 아이템 위에 자연스럽게 겹침 (z-index 미사용)

import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

// ── 테스트용 소비 기록 카드 ───────────────────────────────────────
// API 연동 전 레이아웃·클리핑·DOM 순서 확인용
// 실제 서비스: 기록 완료 시 API 응답(키워드 + 감정온도)으로 동적 렌더링 예정
//
// 모든 path·circle 좌표: 감정+소비키워드_수정.svg 원본 그대로 사용
// viewBox로 해당 영역만 잘라 80×N 크기로 렌더링
// (파일 좌표계를 유지해야 눈·코·입 간격이 정확하게 나옴)

// 합리적소비 diamond (#CBFFC5) + 행복 표정
// SVG 원본 위치: x≈689~893, y≈835~1050 / 눈 cy=940.9
function CardDiamond() {
  return (
    <svg width="80" height="72" viewBox="670 835 240 215" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 회전 다이아몬드 도형 */}
      <rect x="791.419" y="846.1" width="144" height="144" rx="29.4961" transform="rotate(45.9051 791.419 846.1)" fill="#CBFFC5" />
      {/* 눈썹 */}
      <path d="M765.147 929.041C765.147 929.041 769.068 926.418 771.947 925.87C774.763 925.333 779.278 926.27 779.278 926.27" stroke="#242424" strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M814.931 929.041C814.931 929.041 811.01 926.418 808.131 925.87C805.315 925.333 800.8 926.27 800.8 926.27" stroke="#242424" strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* 눈 흰자 */}
      <circle cx="774.8" cy="940.9" r="10" fill="white" />
      <circle cx="803.989" cy="940.9" r="10" fill="white" />
      {/* 눈동자 */}
      <circle cx="777.503" cy="940.9" r="4.05405" fill="#242424" />
      <circle cx="807.232" cy="940.9" r="4.05405" fill="#242424" />
      {/* 미소 */}
      <path d="M764.8 954.9C764.8 954.9 770.8 963.692 790.348 963.692C808.4 963.692 813.6 954.9 813.6 954.9" stroke="#242424" strokeWidth="6.4" strokeLinecap="round" />
    </svg>
  )
}

// 충동적소비 clover (#FFD8B6) + 행복 표정
// SVG 원본 위치: x≈413~654, y≈920~1042 / 눈 cy=978.227
function CardClover() {
  return (
    <svg width="96" height="44" viewBox="395 918 272 124" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 세 잎 클로버 도형 */}
      <path d="M603.473 934.9C631.157 934.9 653.6 957.286 653.6 984.9C653.6 1012.51 631.157 1034.9 603.473 1034.9C589.886 1034.9 577.565 1029.51 568.537 1020.75C559.508 1029.51 547.187 1034.9 533.6 1034.9C520.013 1034.9 507.691 1029.51 498.663 1020.75C489.634 1029.5 477.313 1034.9 463.727 1034.9C436.043 1034.9 413.6 1012.51 413.6 984.9C413.6 957.286 436.043 934.9 463.727 934.9C477.313 934.9 489.634 940.294 498.663 949.049C507.691 940.294 520.013 934.9 533.6 934.9C547.187 934.9 559.508 940.294 568.537 949.049C577.565 940.294 589.887 934.9 603.473 934.9Z" fill="#FFD8B6" />
      {/* 눈썹 */}
      <path d="M574.747 966.367C574.747 966.367 578.668 963.744 581.546 963.196C584.363 962.66 588.878 963.596 588.878 963.596" stroke="#242424" strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M624.531 966.367C624.531 966.367 620.609 963.744 617.731 963.196C614.915 962.66 610.4 963.596 610.4 963.596" stroke="#242424" strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* 눈 흰자 */}
      <circle cx="584.4" cy="978.227" r="10" fill="white" />
      <circle cx="613.589" cy="978.227" r="10" fill="white" />
      {/* 눈동자 */}
      <circle cx="587.102" cy="978.227" r="4.05405" fill="#242424" />
      <circle cx="616.832" cy="978.227" r="4.05405" fill="#242424" />
      {/* 미소 */}
      <path d="M574.4 992.227C574.4 992.227 580.4 1001.02 599.948 1001.02C618 1001.02 623.2 992.227 623.2 992.227" stroke="#242424" strokeWidth="6.4" strokeLinecap="round" />
    </svg>
  )
}

// 스트레스 star (#FFA4A4) + 행복 표정
// SVG 원본 위치: x≈1000~1195, y≈835~1025 / 눈 cy=920.1
function CardStar() {
  return (
    <svg width="80" height="76" viewBox="1000 835 200 192" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 뾰족 별 도형 */}
      <path d="M1093.29 847.715C1093.86 846.104 1096.14 846.104 1096.71 847.715L1110.45 886.343C1110.84 887.418 1112.1 887.879 1113.09 887.301L1148.44 866.544C1149.92 865.678 1151.66 867.143 1151.07 868.746L1136.76 907.169C1136.37 908.238 1137.04 909.406 1138.17 909.596L1178.59 916.421C1180.28 916.706 1180.68 918.95 1179.19 919.795L1143.53 940.035C1142.54 940.598 1142.31 941.926 1143.05 942.795L1169.63 974.009C1170.74 975.311 1169.6 977.285 1167.92 976.976L1127.59 969.562C1126.47 969.356 1125.44 970.222 1125.45 971.364L1125.74 1012.36C1125.76 1014.07 1123.62 1014.85 1122.53 1013.53L1096.4 981.935C1095.67 981.055 1094.33 981.055 1093.6 981.935L1067.47 1013.53C1066.38 1014.85 1064.24 1014.07 1064.26 1012.36L1064.55 971.364C1064.56 970.222 1063.53 969.356 1062.41 969.562L1022.08 976.976C1020.4 977.285 1019.26 975.311 1020.37 974.009L1046.95 942.795C1047.69 941.926 1047.46 940.598 1046.47 940.035L1010.81 919.795C1009.32 918.95 1009.72 916.706 1011.41 916.421L1051.83 909.596C1052.96 909.406 1053.63 908.238 1053.24 907.169L1038.93 868.746C1038.34 867.143 1040.08 865.678 1041.56 866.544L1076.91 887.301C1077.9 887.879 1079.16 887.418 1079.55 886.343L1093.29 847.715Z" fill="#FFA4A4" />
      {/* 눈썹 */}
      <path d="M1074.15 908.24C1074.15 908.24 1078.07 905.618 1080.95 905.069C1083.76 904.533 1088.28 905.469 1088.28 905.469" stroke="#242424" strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1123.93 908.24C1123.93 908.24 1120.01 905.618 1117.13 905.069C1114.31 904.533 1109.8 905.469 1109.8 905.469" stroke="#242424" strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* 눈 흰자 */}
      <circle cx="1083.8" cy="920.1" r="10" fill="white" />
      <circle cx="1112.99" cy="920.1" r="10" fill="white" />
      {/* 눈동자 */}
      <circle cx="1086.5" cy="920.1" r="4.05405" fill="#242424" />
      <circle cx="1116.23" cy="920.1" r="4.05405" fill="#242424" />
      {/* 미소 */}
      <path d="M1073.8 934.1C1073.8 934.1 1079.8 942.892 1099.35 942.892C1117.4 942.892 1122.6 934.1 1122.6 934.1" stroke="#242424" strokeWidth="6.4" strokeLinecap="round" />
    </svg>
  )
}

// ── 바구니 + 아이템 SVG ──────────────────────────────────────────
// 좌표계: viewBox="0 0 300 215"
// 바구니 내부 사다리꼴: M18 42 L282 42 L262 192 L38 192 Z
//
// DOM 렌더 순서:
//   ① <defs> clipPath 정의
//   ② <g clipPath="url(#basket-interior)"> 아이템들
//   ③ 바구니 격자선·외곽선·손잡이 (앞면) ← 아이템보다 나중에 렌더 → 자연스럽게 앞에 표시

function BasketWithItems() {
  return (
    <svg
      viewBox="0 0 300 215"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* ① 클리핑 영역 정의 — 바구니 내부 사다리꼴과 동일 */}
      <defs>
        <clipPath id="basket-interior">
          <path d="M18 42 L282 42 L262 192 L38 192 Z" />
        </clipPath>
      </defs>

      {/* ② 아이템 — clipPath로 바구니 경계 밖으로 나가지 않게 제한 */}
      <g clipPath="url(#basket-interior)">
        {/* 아이템1: 합리적소비 diamond (80×72), 좌측 하단, -10° */}
        <g transform="translate(30, 103) rotate(-10, 40, 36)">
          <CardDiamond />
        </g>
        {/* 아이템2: 충동적소비 clover (96×44), 중앙 하단, +5° */}
        <g transform="translate(105, 130) rotate(5, 48, 22)">
          <CardClover />
        </g>
        {/* 아이템3: 스트레스 star (80×76), 우측 위, -5° */}
        <g transform="translate(185, 87) rotate(-5, 40, 38)">
          <CardStar />
        </g>
      </g>

      {/* ③ 바구니 앞면 — DOM 마지막 렌더 → z-index 없이 아이템 앞에 표시 */}
      {/* 외곽 사다리꼴 */}
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
        <BasketWithItems />
      </div>

      {/* + 버튼 (플로팅 FAB) — BottomNav 위 16px에 고정 */}
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
