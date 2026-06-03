'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { KEYWORD_COLORS } from '@/lib/keywords'
import { authFetch } from '@/lib/api'
import { enumToKeyword } from '@/lib/mappings'

// ── 슬롯 포지션 ──────────────────────────────────────────────────
// 바구니 내부 사다리꼴: M18 42 L282 42 L262 192 L38 192
// index 0 = 첫 번째 기록 = 바닥(배경), index 5 = 최신 기록 = 맨 위(전경)
// translate(x, y): 아이콘 좌상단 기준, rotate(deg, cx, cy): 아이콘 중심 기준
const SLOT_POSITIONS = [
  { x: 28,  y: 100, r: -10 },  // 1st: 좌하단
  { x: 162, y: 108, r:   7 },  // 2nd: 우하단
  { x: 92,  y: 118, r:   3 },  // 3rd: 중하단 (1·2와 살짝 겹침)
  { x: 168, y: 56,  r:  -6 },  // 4th: 우상단
  { x: 28,  y: 50,  r:  11 },  // 5th: 좌상단
  { x: 102, y: 56,  r:  -8 },  // 6th: 중상단 (맨 위)
]

// ── 아이콘 크기 ────────────────────────────────────────────────
// 충동적 소비 shape는 가로로 긴 비율(348:160), 나머지는 정사각형에 가까움
function itemSize(keyword: string) {
  return keyword === '충동적 소비' ? { w: 96, h: 44, cx: 48, cy: 22 } : { w: 80, h: 80, cx: 40, cy: 40 }
}

// ── 얼굴 표정 레이어 ─────────────────────────────────────────────
// 상세화면 EmotionFace와 동일한 viewBox / path 좌표 사용
// 크기는 상세화면 FACE_SIZES 기준으로 80×80 카드에 비례 변환
//   합리적/소확행/스트레스/보상심리/잘모름: 46×42(SHAPE92) → 40×37(80카드), 중앙 x=20 y=21
//   충동적: 30×26 pos(top:33,left:56)(SHAPE92) → 31×27 pos(x=58,y=9)(96×44카드)
function FaceInSvg({ keyword, temp }: { keyword: string; temp: number }) {
  const isWide = keyword === '충동적 소비'

  // 충동적 소비: 오른쪽 원 위에 고정 배치
  const fx = isWide ? 58 : 20
  const fy = isWide ? 9  : 21
  const fw = isWide ? 31 : 40
  const fh = isWide ? 27 : 37

  if (temp >= 75) {
    return (
      <svg viewBox="850 295 88 68" x={fx} y={fy} width={fw} height={fh} fill="none">
        <path d="M864.434 309.676C864.434 309.676 869.335 306.397 872.933 305.712C876.454 305.041 882.097 306.212 882.097 306.212" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M926.663 309.676C926.663 309.676 921.762 306.397 918.164 305.712C914.643 305.041 909 306.212 909 306.212" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="876.5" cy="324.5" r="12.5" fill="white"/>
        <circle cx="912.986" cy="324.5" r="12.5" fill="white"/>
        <circle cx="879.878" cy="324.5" r="5.06757" fill="#242424"/>
        <circle cx="917.04" cy="324.5" r="5.06757" fill="#242424"/>
        <path d="M864 342C864 342 871.5 352.99 895.935 352.99C918.5 352.99 925 342 925 342" stroke="#242424" strokeWidth="8" strokeLinecap="round"/>
      </svg>
    )
  }
  if (temp >= 55) {
    return (
      <svg viewBox="850 413 88 62" x={fx} y={fy} width={fw} height={fh} fill="none">
        <path d="M864.434 428.666L873 427L882.097 425.202" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M924.819 425.239L916.106 425.73L906.846 426.224" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="876.5" cy="443.49" r="12.5" fill="white"/>
        <circle cx="912.986" cy="443.49" r="12.5" fill="white"/>
        <circle cx="877.068" cy="443.068" r="5.06757" fill="#242424"/>
        <circle cx="914.23" cy="443.068" r="5.06757" fill="#242424"/>
        <path d="M878 465H914.5" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
  if (temp >= 35) {
    return (
      <svg viewBox="850 530 88 68" x={fx} y={fy} width={fw} height={fh} fill="none">
        <path d="M864.434 547.656L873 545.99L882.097 544.193" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M923.899 548.72L916.074 544.856L907.772 540.725" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="876.5" cy="562.481" r="12.5" fill="white"/>
        <circle cx="912.986" cy="562.481" r="12.5" fill="white"/>
        <circle cx="880.068" cy="562.068" r="5.06757" fill="#242424"/>
        <circle cx="917.23" cy="562.068" r="5.06757" fill="#242424"/>
        <path d="M870 588L876.783 582L885.449 588L895.623 582L903.159 588L915.594 582L922 588" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
  if (temp >= 15) {
    return (
      <svg viewBox="850 648 88 65" x={fx} y={fy} width={fw} height={fh} fill="none">
        <path d="M865.302 660.73L873.022 664.8L881.237 669.101" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M923.824 659.58L916.078 663.6L907.835 667.846" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="876.5" cy="681.471" r="12.5" fill="white"/>
        <circle cx="912.986" cy="681.471" r="12.5" fill="white"/>
        <circle cx="877.068" cy="681.048" r="5.06757" fill="#242424"/>
        <circle cx="914.23" cy="681.048" r="5.06757" fill="#242424"/>
        <path d="M880 702C880 702 885.41 694 903.035 694C919.311 694 924 702 924 702" stroke="#242424" strokeWidth="8" strokeLinecap="round"/>
      </svg>
    )
  }
  return (
    <svg viewBox="850 771 88 65" x={fx} y={fy} width={fw} height={fh} fill="none">
      <path d="M866.006 791.384L873.726 787.313L881.941 783.012" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M924.528 792.534L916.782 788.514L908.539 784.267" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="876.5" cy="800.461" r="12.5" fill="white"/>
      <circle cx="912.986" cy="800.461" r="12.5" fill="white"/>
      <circle cx="881.068" cy="800.068" r="5.06757" fill="#242424"/>
      <circle cx="918.068" cy="800.068" r="5.06757" fill="#242424"/>
      <path d="M874 826C874 826 879.41 818 897.035 818C913.311 818 918 826 918 826" stroke="#242424" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  )
}

// ── 키워드 쉐이프 레이어 ─────────────────────────────────────────
// 상세화면 KeywordShape와 동일한 viewBox / path 좌표 사용
function ShapeInSvg({ keyword, w, h }: { keyword: string; w: number; h: number }) {
  const fill = KEYWORD_COLORS[keyword as keyof typeof KEYWORD_COLORS] ?? '#EEEEEE'

  if (keyword === '소확행') return (
    <svg viewBox="1648 432 236 240" width={w} height={h}>
      <path d="M1753.68 449.488C1760.93 440.401 1774.74 440.401 1782 449.488L1791.11 460.891C1795.34 466.197 1802.19 468.689 1808.85 467.348L1823.15 464.466C1834.55 462.17 1845.14 471.049 1844.85 482.674L1844.5 497.262C1844.33 504.051 1847.98 510.362 1853.94 513.614L1866.75 520.601C1876.96 526.169 1879.36 539.773 1871.67 548.497L1862.02 559.445C1857.53 564.539 1856.27 571.716 1858.74 578.039L1864.07 591.627C1868.31 602.454 1861.4 614.417 1849.9 616.158L1835.47 618.342C1828.76 619.359 1823.18 624.043 1821.01 630.479L1816.35 644.309C1812.64 655.329 1799.66 660.053 1789.74 653.997L1777.28 646.396C1771.48 642.859 1764.19 642.859 1758.4 646.396L1745.94 653.997C1736.01 660.053 1723.03 655.329 1719.32 644.309L1714.67 630.479C1712.5 624.043 1706.92 619.359 1700.2 618.342L1685.77 616.158C1674.28 614.417 1667.37 602.454 1671.61 591.627L1676.93 578.039C1679.41 571.716 1678.14 564.539 1673.65 559.445L1664.01 548.497C1656.32 539.773 1658.72 526.169 1668.92 520.601L1681.74 513.614C1687.7 510.362 1691.34 504.051 1691.18 497.262L1690.82 482.674C1690.54 471.049 1701.12 462.17 1712.52 464.466L1726.83 467.348C1733.48 468.689 1740.33 466.197 1744.57 460.891L1753.68 449.488Z" fill={fill}/>
    </svg>
  )
  if (keyword === '스트레스') return (
    <svg viewBox="1296 418 252 252" width={w} height={h}>
      <path d="M1418.81 430.164C1419.58 428.003 1422.63 428.003 1423.4 430.164L1441.83 481.955C1442.34 483.397 1444.04 484.015 1445.36 483.241L1492.76 455.409C1494.74 454.247 1497.08 456.212 1496.28 458.361L1477.1 509.879C1476.57 511.313 1477.47 512.879 1478.98 513.133L1533.19 522.284C1535.45 522.666 1535.98 525.675 1533.99 526.808L1486.18 553.946C1484.85 554.701 1484.54 556.481 1485.53 557.646L1521.17 599.498C1522.66 601.244 1521.13 603.891 1518.87 603.476L1464.81 593.536C1463.3 593.259 1461.92 594.421 1461.93 595.951L1462.33 650.921C1462.35 653.215 1459.47 654.26 1458.01 652.492L1422.99 610.125C1422.01 608.946 1420.2 608.946 1419.23 610.125L1384.2 652.492C1382.74 654.26 1379.87 653.215 1379.88 650.921L1380.29 595.951C1380.3 594.421 1378.91 593.259 1377.41 593.536L1323.34 603.476C1321.09 603.891 1319.56 601.244 1321.04 599.498L1356.69 557.646C1357.68 556.481 1357.36 554.701 1356.03 553.946L1308.23 526.808C1306.23 525.675 1306.76 522.666 1309.03 522.284L1363.23 513.133C1364.74 512.879 1365.64 511.313 1365.11 509.879L1345.93 458.361C1345.13 456.212 1347.47 454.247 1349.45 455.409L1396.85 483.241C1398.17 484.015 1399.87 483.397 1400.39 481.955L1418.81 430.164Z" fill={fill}/>
    </svg>
  )
  if (keyword === '합리적 소비') return (
    <svg viewBox="868 415 292 292" width={w} height={h}>
      <rect x="1014.07" y="423.707" width="193.075" height="193.075" rx="39.5484" transform="rotate(45.9051 1014.07 423.707)" fill={fill}/>
    </svg>
  )
  if (keyword === '충동적 소비') return (
    <svg viewBox="494 445 348 160" width={w} height={h}>
      <path d="M762.068 459.104C799.187 459.104 829.278 489.119 829.278 526.144C829.278 563.169 799.187 593.184 762.068 593.184C743.853 593.184 727.33 585.956 715.225 574.218C703.12 585.955 686.598 593.184 668.383 593.184C650.167 593.184 633.644 585.955 621.539 574.218C609.434 585.955 592.912 593.184 574.696 593.184C537.577 593.184 507.486 563.169 507.486 526.144C507.486 489.119 537.577 459.104 574.696 459.104C592.912 459.104 609.434 466.333 621.539 478.07C633.644 466.332 650.167 459.104 668.383 459.104C686.598 459.104 703.12 466.333 715.225 478.07C727.33 466.332 743.853 459.104 762.068 459.104Z" fill={fill}/>
    </svg>
  )
  if (keyword === '보상심리') return (
    <svg viewBox="2044 414 238 236" width={w} height={h}>
      <path d="M2193.79 485.247C2195.84 491.929 2201.07 497.16 2207.76 499.212L2245.52 510.814C2265.38 516.915 2265.38 545.028 2245.52 551.129L2207.76 562.73C2201.07 564.783 2195.84 570.013 2193.79 576.695L2182.19 614.459C2176.09 634.318 2147.98 634.318 2141.88 614.459L2130.27 576.695C2128.22 570.013 2122.99 564.782 2116.31 562.73L2078.54 551.128C2058.68 545.028 2058.68 516.914 2078.54 510.813L2116.31 499.212C2122.99 497.16 2128.22 491.929 2130.27 485.247L2141.88 447.482C2147.98 427.622 2176.09 427.622 2182.19 447.482L2193.79 485.247Z" fill={fill}/>
    </svg>
  )
  // 잘 모르겠어요 (오각형 fallback)
  return (
    <svg viewBox="2362 452 210 204" width={w} height={h}>
      <path d="M2455.16 469.02C2461.54 464.387 2470.18 464.387 2476.55 469.02L2547.74 520.741C2554.12 525.374 2556.79 533.587 2554.35 541.084L2527.16 624.771C2524.72 632.267 2517.74 637.343 2509.86 637.343H2421.86C2413.98 637.343 2406.99 632.267 2404.56 624.771L2377.37 541.084C2374.93 533.587 2377.6 525.374 2383.98 520.741L2455.16 469.02Z" fill={fill}/>
    </svg>
  )
}

// ── 바구니 아이템 (shape + face 합성) ───────────────────────────
function BasketItem({ keyword, temp }: { keyword: string; temp: number }) {
  const { w, h } = itemSize(keyword)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" overflow="visible">
      <ShapeInSvg keyword={keyword} w={w} h={h} />
      <FaceInSvg keyword={keyword} temp={temp} />
    </svg>
  )
}

// ── 바구니 SVG ───────────────────────────────────────────────────
// 렌더 순서:
//   ① clipPath defs
//   ② 아이템 (오래된 것 먼저 → 배경, 최신 것 마지막 → 전경)
//   ③ 바구니 앞면 격자 (DOM 마지막 → 아이템 위에 자연스럽게 표시)

type BasketRecord = { keyword: string | null; emotionTemp: number }

function BasketWithItems({ records }: { records: BasketRecord[] }) {
  return (
    <svg viewBox="0 0 300 215" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* ① 클리핑 영역 */}
      <defs>
        <clipPath id="basket-interior">
          <path d="M18 42 L282 42 L262 192 L38 192 Z" />
        </clipPath>
      </defs>

      {/* ② 아이템 — 오래된 것(index 0)부터 렌더 → 최신 것이 위에 표시됨 */}
      <g clipPath="url(#basket-interior)">
        {records.map((r, i) => {
          if (!r.keyword) return null
          const slot = SLOT_POSITIONS[i]
          const { cx, cy } = itemSize(r.keyword)
          return (
            <g key={i} transform={`translate(${slot.x},${slot.y}) rotate(${slot.r},${cx},${cy})`}>
              <BasketItem keyword={r.keyword} temp={r.emotionTemp} />
            </g>
          )
        })}
      </g>

      {/* ③ 바구니 앞면 — DOM 마지막이므로 아이템 위에 자연스럽게 겹침 */}
      <path d="M18 42 L282 42 L262 192 L38 192 Z" stroke="#C8C8C8" strokeWidth="3.5" strokeLinejoin="round" />
      <line x1="62"  y1="42" x2="75"  y2="192" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="106" y1="42" x2="113" y2="192" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="150" y1="42" x2="150" y2="192" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="194" y1="42" x2="187" y2="192" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="238" y1="42" x2="225" y2="192" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="25"  y1="92"  x2="275" y2="92"  stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="30"  y1="135" x2="270" y2="135" stroke="#C8C8C8" strokeWidth="2.5" />
      <line x1="35"  y1="170" x2="265" y2="170" stroke="#C8C8C8" strokeWidth="2.5" />
      <rect x="34" y="190" width="232" height="15" rx="7.5" fill="#C8C8C8" />
    </svg>
  )
}

export default function Home() {
  const today = new Date()
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const [basketRecords, setBasketRecords] = useState<BasketRecord[]>([])

  useEffect(() => {
    authFetch(`/api/home/consumptions/today?date=${todayStr}`)
      .then(res => res.json())
      .then(json => {
        if (!json.success) return
        const records: BasketRecord[] = (json.data.items as Array<{ emotion_tag: string; emotion: number }>)
          .slice(0, 6)
          .reverse()
          .map(item => ({
            keyword: enumToKeyword(item.emotion_tag),
            emotionTemp: item.emotion,
          }))
        setBasketRecords(records)
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

      {/* 바구니 일러스트 */}
      <div className="flex-1 flex items-center justify-center px-8 min-h-0 pb-[88px]">
        <BasketWithItems records={basketRecords} />
      </div>

      {/* + 버튼 (플로팅 FAB) */}
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
