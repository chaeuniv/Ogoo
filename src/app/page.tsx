'use client'

// 홈 화면
// ── 섹션 1 (바구니): 뷰포트를 꽉 채우는 바구니 + 오늘 날짜
// ── 섹션 2 (카드):  오늘 기록한 소비 사진 카드 (가로 스크롤, 3:4 비율)
//
// 스크롤 복원: 상세 화면에서 돌아올 때 카드 위치 유지
//   - 카드 탭 시 scrollTop → sessionStorage 저장
//   - 마운트 시 sessionStorage 읽어 복원
//
// 바구니 렌더 순서: ① clipPath defs → ② 아이템 → ③ 바구니 앞면 선
// 아이콘 배치: 최신 기록 → 위 레이어, 6개 고정 슬롯 포지션

import { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { KEYWORD_COLORS } from '@/lib/keywords'
import { authFetch } from '@/lib/api'
import { enumToKeyword, enumToCategoryDisplay } from '@/lib/mappings'

const SCROLL_RESTORE_KEY = 'home-scroll-y'

// ── 슬롯 포지션 ──────────────────────────────────────────────────
// 바구니 "바닥 → 위쪽" 순서로 한 줄씩 채워서, 기록이 늘어날수록
// 실제로 물건이 차곡차곡 쌓여 올라가는 듯한 느낌이 나도록 함.
// (아래쪽 줄 좌→중→우, 그다음 위쪽 줄 좌→중→우)
const SLOT_POSITIONS = [
  { x: 32,  y: 190, r:  -8 },  // 1번째 → 아래줄 왼쪽 (바구니 안쪽으로 살짝 띄움)
  { x: 150, y: 190, r:   2 },  // 2번째 → 아래줄 가운데 (좌우 간격 더 벌림)
  { x: 256, y: 190, r:   8 },  // 3번째 → 아래줄 오른쪽
  { x: 38,  y: 128, r: -10 },  // 4번째 → 윗줄 왼쪽
  { x: 152, y: 128, r:   4 },  // 5번째 → 윗줄 가운데
  { x: 256, y: 128, r:  -6 },  // 6번째 → 윗줄 오른쪽
]

// ── 아이콘 크기 ────────────────────────────────────────────────
function itemSize(keyword: string) {
  return keyword === '충동적 소비' ? { w: 96, h: 44, cx: 48, cy: 22 } : { w: 80, h: 80, cx: 40, cy: 40 }
}

// ── 얼굴 표정 레이어 ─────────────────────────────────────────────
function FaceInSvg({ keyword, temp }: { keyword: string; temp: number }) {
  const isWide = keyword === '충동적 소비'
  const fx = isWide ? 58 : 20
  const fy = isWide ? 9  : 21
  const fw = isWide ? 31 : 40
  const fh = isWide ? 27 : 37

  if (temp >= 75) return (
    <svg viewBox="850 295 88 68" x={fx} y={fy} width={fw} height={fh} fill="none">
      <path d="M864.434 309.676C864.434 309.676 869.335 306.397 872.933 305.712C876.454 305.041 882.097 306.212 882.097 306.212" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M926.663 309.676C926.663 309.676 921.762 306.397 918.164 305.712C914.643 305.041 909 306.212 909 306.212" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="876.5" cy="324.5" r="12.5" fill="white"/><circle cx="912.986" cy="324.5" r="12.5" fill="white"/>
      <circle cx="879.878" cy="324.5" r="5.06757" fill="#242424"/><circle cx="917.04" cy="324.5" r="5.06757" fill="#242424"/>
      <path d="M864 342C864 342 871.5 352.99 895.935 352.99C918.5 352.99 925 342 925 342" stroke="#242424" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  )
  if (temp >= 55) return (
    <svg viewBox="850 413 88 62" x={fx} y={fy} width={fw} height={fh} fill="none">
      <path d="M864.434 428.666L873 427L882.097 425.202" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M924.819 425.239L916.106 425.73L906.846 426.224" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="876.5" cy="443.49" r="12.5" fill="white"/><circle cx="912.986" cy="443.49" r="12.5" fill="white"/>
      <circle cx="877.068" cy="443.068" r="5.06757" fill="#242424"/><circle cx="914.23" cy="443.068" r="5.06757" fill="#242424"/>
      <path d="M878 465H914.5" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (temp >= 35) return (
    <svg viewBox="850 530 88 68" x={fx} y={fy} width={fw} height={fh} fill="none">
      <path d="M864.434 547.656L873 545.99L882.097 544.193" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M923.899 548.72L916.074 544.856L907.772 540.725" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="876.5" cy="562.481" r="12.5" fill="white"/><circle cx="912.986" cy="562.481" r="12.5" fill="white"/>
      <circle cx="880.068" cy="562.068" r="5.06757" fill="#242424"/><circle cx="917.23" cy="562.068" r="5.06757" fill="#242424"/>
      <path d="M870 588L876.783 582L885.449 588L895.623 582L903.159 588L915.594 582L922 588" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (temp >= 15) return (
    <svg viewBox="850 648 88 65" x={fx} y={fy} width={fw} height={fh} fill="none">
      <path d="M865.302 660.73L873.022 664.8L881.237 669.101" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M923.824 659.58L916.078 663.6L907.835 667.846" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="876.5" cy="681.471" r="12.5" fill="white"/><circle cx="912.986" cy="681.471" r="12.5" fill="white"/>
      <circle cx="877.068" cy="681.048" r="5.06757" fill="#242424"/><circle cx="914.23" cy="681.048" r="5.06757" fill="#242424"/>
      <path d="M880 702C880 702 885.41 694 903.035 694C919.311 694 924 702 924 702" stroke="#242424" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  )
  return (
    <svg viewBox="850 771 88 65" x={fx} y={fy} width={fw} height={fh} fill="none">
      <path d="M866.006 791.384L873.726 787.313L881.941 783.012" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M924.528 792.534L916.782 788.514L908.539 784.267" stroke="#242424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="876.5" cy="800.461" r="12.5" fill="white"/><circle cx="912.986" cy="800.461" r="12.5" fill="white"/>
      <circle cx="881.068" cy="800.068" r="5.06757" fill="#242424"/><circle cx="918.068" cy="800.068" r="5.06757" fill="#242424"/>
      <path d="M874 826C874 826 879.41 818 897.035 818C913.311 818 918 826 918 826" stroke="#242424" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  )
}

// ── 키워드 쉐이프 (바구니 아이템용) ─────────────────────────────
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
  return (
    <svg viewBox="2362 452 210 204" width={w} height={h}>
      <path d="M2455.16 469.02C2461.54 464.387 2470.18 464.387 2476.55 469.02L2547.74 520.741C2554.12 525.374 2556.79 533.587 2554.35 541.084L2527.16 624.771C2524.72 632.267 2517.74 637.343 2509.86 637.343H2421.86C2413.98 637.343 2406.99 632.267 2404.56 624.771L2377.37 541.084C2374.93 533.587 2377.6 525.374 2383.98 520.741L2455.16 469.02Z" fill={fill}/>
    </svg>
  )
}

// ── 바구니 아이템 ─────────────────────────────────────────────────
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
type BasketRecord = { keyword: string | null; emotionTemp: number }

function BasketWithItems({ records }: { records: BasketRecord[] }) {
  return (
    <svg viewBox="0 0 381 279" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        {/* 바구니 본체 외곽선의 네 모서리를 그대로 사용한 내부 클립 영역 */}
        <clipPath id="basket-interior">
          <path d="M9.20215 115.503 L42.5 273.317 L341 273.317 L372.681 113.202 Z" />
        </clipPath>
      </defs>
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
      {/* 상단 테두리 — 두 겹의 둥근 바 */}
      <rect y="103" width="381" height="5" rx="2.5" fill="#959595" fillOpacity="0.5" />
      <rect y="109" width="381" height="5" rx="2.5" fill="#C5C5C5" fillOpacity="0.5" />
      {/* 선반(가로) — 아래로 갈수록 폭이 좁아지는 둥근 바 */}
      <rect x="13.8027" y="148.09"  width="354.277" height="5.5212" rx="2.7606" fill="#C5C5C5" fillOpacity="0.5" />
      <rect x="23.0049" y="192.259" width="336.793" height="5.5212" rx="2.7606" fill="#C5C5C5" fillOpacity="0.5" />
      <rect x="35"      y="238"     width="314"     height="6"      rx="3"      fill="#C5C5C5" fillOpacity="0.5" />
      {/* 살대(세로) — 위로 모이고 아래로 퍼지는 둥근 바 */}
      <rect x="64.9492" y="112" width="166" height="5" rx="2.5" transform="rotate(81.8472 64.9492 112)" fill="#C5C5C5" fillOpacity="0.5" />
      <rect width="166" height="5" rx="2.5" transform="matrix(-0.141814 0.989893 0.989893 0.141814 315.541 112)" fill="#C5C5C5" fillOpacity="0.5" />
      <rect x="124.959" y="110" width="166" height="5" rx="2.5" transform="rotate(82.6993 124.959 110)" fill="#C5C5C5" fillOpacity="0.5" />
      <rect width="166" height="5" rx="2.5" transform="matrix(-0.127077 0.991893 0.991893 0.127077 256.095 110)" fill="#C5C5C5" fillOpacity="0.5" />
      <rect x="193" y="109" width="166" height="5" rx="2.5" transform="rotate(90 193 109)" fill="#C5C5C5" fillOpacity="0.5" />
      {/* 바구니 외곽 — 둥근 굵은 선 (윗변은 위 테두리 바가 대신함) */}
      <path d="M9.20215 115.503L42.5 273.317H341L372.681 113.202" stroke="#C5C5C5" strokeOpacity="0.5" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      {/* 손잡이 */}
      <circle cx="190.5" cy="7.5" r="7.5" fill="#C5C5C5" fillOpacity="0.5" />
      <path d="M187.853 7.84113C188.942 6.78832 190.673 6.70596 191.861 7.69952L302.698 100.403C303.969 101.466 304.137 103.358 303.074 104.629C302.011 105.9 300.119 106.068 298.848 105.005L189.924 13.9007L81.9245 104.232C80.6537 105.295 78.7619 105.127 77.6989 103.856C76.636 102.585 76.8044 100.693 78.0749 99.6302L187.559 8.05792C187.654 7.97875 187.752 7.90668 187.853 7.84113Z" fill="#C5C5C5" fillOpacity="0.5" />
      <path d="M72 100.5C72 96.9101 74.9101 94 78.5 94V94C82.0899 94 85 96.9101 85 100.5V114H72V100.5Z" fill="#959595" fillOpacity="0.5" />
      <path d="M296 100.5C296 96.9101 298.91 94 302.5 94V94C306.09 94 309 96.9101 309 100.5V114H296V100.5Z" fill="#959595" fillOpacity="0.5" />
    </svg>
  )
}

// ── 키워드 미니 아이콘 (카드 우상단용, ShapeInSvg 재사용) ─────────
function KeywordMiniIcon({ keyword }: { keyword: string }) {
  const isWide = keyword === '충동적 소비'
  const w = isWide ? 36 : 28
  const h = isWide ? 18 : 28
  return (
    <div style={{
      filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <ShapeInSvg keyword={keyword} w={w} h={h} />
    </div>
  )
}

// ── 스크롤 유도 화살표 ─────────────────────────────────────────────
function ScrollArrow() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <svg viewBox="0 0 18 10" width={18} height={10} fill="none">
        <path d="M1 1.5L9 8.5L17 1.5" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <svg viewBox="0 0 18 10" width={18} height={10} fill="none" style={{ opacity: 0.4 }}>
        <path d="M1 1.5L9 8.5L17 1.5" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

// ── 오늘 소비 카드 ─────────────────────────────────────────────────
interface TodayRecord {
  id: string
  title: string
  category: string | null
  photo: string | null
  keyword: string | null
  amount: number
}

function TodayCard({ record, onPress }: { record: TodayRecord; onPress: () => void }) {
  const displayText = record.title.trim() || record.category || '소비 기록'

  return (
    <button
      onClick={onPress}
      className="active:scale-95 transition-transform"
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        aspectRatio: '3 / 4',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#EFEFEF',
        textAlign: 'left',
      }}
    >
      {record.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={record.photo}
          alt={displayText}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#CACACA" strokeWidth="1.5" style={{ width: 36, height: 36 }}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
      )}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
        background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.52))',
        pointerEvents: 'none',
      }} />
      {record.keyword && (
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <KeywordMiniIcon keyword={record.keyword} />
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 10, right: 10, textAlign: 'right' }}>
        <p style={{ color: 'white', fontWeight: 800, fontSize: 17, lineHeight: 1.2, textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
          {record.amount.toLocaleString('ko-KR')}원
        </p>
        <p style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 500, fontSize: 12, lineHeight: 1.3, marginTop: 2, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          {displayText}
        </p>
      </div>
    </button>
  )
}

// ── 홈 페이지 ─────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [section1H, setSection1H] = useState<number | null>(null)
  const [showArrow, setShowArrow] = useState(true)
  const [basketRecords, setBasketRecords] = useState<BasketRecord[]>([])
  const [todayRecords, setTodayRecords] = useState<TodayRecord[]>([])

  const today   = new Date()
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // 바구니 + 카드 데이터를 단일 API 호출로 처리
  useEffect(() => {
    type ApiItem = {
      consumption_id: string; title: string; category: string
      emotion_tag: string; keyword_label: string | null; emotion: number
      thumbnail_url: string | null; amount: number
    }
    authFetch(`/api/home/consumptions/today?date=${todayStr}`)
      .then(res => res.json())
      .then(json => {
        if (!json.success) return
        const items = json.data.items as ApiItem[]
        setBasketRecords(
          items.slice(0, 6).reverse().map(item => ({
            keyword: enumToKeyword(item.emotion_tag, item.keyword_label),
            emotionTemp: item.emotion,
          }))
        )
        setTodayRecords(
          items.map(item => ({
            id: item.consumption_id,
            title: item.title,
            category: enumToCategoryDisplay(item.category),
            photo: item.thumbnail_url,
            keyword: enumToKeyword(item.emotion_tag, item.keyword_label),
            amount: item.amount,
          }))
        )
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 스크롤 컨테이너 높이 측정 → 섹션1이 정확히 뷰포트를 채우도록
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => setSection1H(el.clientHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 뒤로가기 시 스크롤 위치 복원
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_RESTORE_KEY)
    if (saved && scrollRef.current) {
      scrollRef.current.scrollTop = Number(saved)
      sessionStorage.removeItem(SCROLL_RESTORE_KEY)
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (scrollRef.current && scrollRef.current.scrollTop > 20) {
      setShowArrow(false)
    }
  }, [])

  const handleCardClick = (id: string) => {
    sessionStorage.setItem(SCROLL_RESTORE_KEY, String(scrollRef.current?.scrollTop ?? 0))
    router.push(`/logs/${id}`)
  }

  return (
    <div className="relative flex flex-col max-w-md mx-auto bg-white" style={{ height: '100dvh' }}>
      <style>{`
        @keyframes arrowBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(5px); }
        }
      `}</style>

      {/* 헤더 */}
      <header
        className="flex items-center justify-between px-5 pb-4 border-b border-gray-100 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <span className="text-xl font-bold tracking-tight text-zinc-950">OGOO</span>
        <button aria-label="알림" className="p-1" onClick={() => router.push('/notifications')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </header>

      {/* 스크롤 영역 */}
      <div
        className="flex-1 overflow-y-auto min-h-0"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {/* ── 섹션 1: 바구니 ─────────────────────────────────────── */}
        {/* section1H가 측정되기 전엔 CSS 추정값 사용 (flash 최소화) */}
        <div style={{
          height: section1H != null ? section1H : 'calc(100dvh - 134px)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>
          {/* 날짜 + 서브타이틀 */}
          <div className="text-center pt-7 pb-4 shrink-0">
            <p className="text-base font-medium text-gray-800">{dateStr}</p>
            <p className="text-sm text-gray-400 mt-1">오늘의 소비를 등록해보세요</p>
          </div>

          {/* 바구니 일러스트 — pb-[88px]로 원래 위치 유지 */}
          <div className="flex-1 flex items-center justify-center px-8 min-h-0 pb-[88px]">
            <BasketWithItems records={basketRecords} />
          </div>

          {/* 스크롤 유도 화살표 — absolute로 배치해 바구니 위치에 영향 없음 */}
          {todayRecords.length > 0 && (
            <div
              className="absolute flex justify-center"
              style={{
                bottom: 24, left: 0, right: 0,
                opacity: showArrow ? 1 : 0,
                transition: 'opacity 0.4s',
                animation: showArrow ? 'arrowBounce 1.6s ease-in-out infinite' : 'none',
                pointerEvents: 'none',
              }}
            >
              <ScrollArrow />
            </div>
          )}
        </div>

        {/* ── 섹션 2: 오늘 소비 카드 (가로 스크롤) ─────────────────── */}
        {todayRecords.length > 0 && (
          <div className="pt-2 pb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3" style={{ paddingLeft: 20 }}>오늘의 소비</p>
            {/* overflow-x-auto + snap으로 카드 단위 스냅 스크롤 */}
            <div
              className="flex gap-3 overflow-x-auto no-scrollbar"
              style={{
                scrollSnapType: 'x mandatory',
                scrollPaddingLeft: 20,
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {todayRecords.map((r, i) => (
                <div
                  key={r.id}
                  style={{
                    flexShrink: 0,
                    width: 'calc((100vw - 32px) * 0.62)',
                    maxWidth: 220,
                    scrollSnapAlign: 'start',
                    // 첫 카드: 왼쪽 여백 / 마지막 카드: 오른쪽 여백
                    marginLeft: i === 0 ? 20 : 0,
                    marginRight: i === todayRecords.length - 1 ? 20 : 0,
                  }}
                >
                  <TodayCard
                    record={r}
                    onPress={() => handleCardClick(r.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
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
