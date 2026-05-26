'use client'

// Step 3: 소비 키워드 선택
// 아이콘: 소비아이콘_수정.svg 기반 인라인 SVG (shape만, 표정 없음)
// 선택된 아이콘 opacity 1.0 + scale up, 나머지 opacity 0.5
// 키워드 레이블은 아이콘 하단에 별도 텍스트로 표시

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRecord, Keyword, getTotalSteps } from '../RecordProvider'
import CancelConfirmModal from '@/components/CancelConfirmModal'
import { KEYWORD_COLORS } from '@/lib/keywords'

export { KEYWORD_COLORS }

// ── 아이콘 SVG 컴포넌트 ───────────────────────────────────────
// path: 소비아이콘_수정.svg 원본 좌표 그대로, viewBox로 해당 영역만 잘라서 사용
// 얼굴: 눈(흰자+동자) + 눈썹 + 입 표정을 SVG 원본 좌표계로 배치

// 소확행: 연보라 불규칙 blob
function SohwaengBlob() {
  return (
    <svg viewBox="1648 432 236 240" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1753.68 449.488C1760.93 440.401 1774.74 440.401 1782 449.488L1791.11 460.891C1795.34 466.197 1802.19 468.689 1808.85 467.348L1823.15 464.466C1834.55 462.17 1845.14 471.049 1844.85 482.674L1844.5 497.262C1844.33 504.051 1847.98 510.362 1853.94 513.614L1866.75 520.601C1876.96 526.169 1879.36 539.773 1871.67 548.497L1862.02 559.445C1857.53 564.539 1856.27 571.716 1858.74 578.039L1864.07 591.627C1868.31 602.454 1861.4 614.417 1849.9 616.158L1835.47 618.342C1828.76 619.359 1823.18 624.043 1821.01 630.479L1816.35 644.309C1812.64 655.329 1799.66 660.053 1789.74 653.997L1777.28 646.396C1771.48 642.859 1764.19 642.859 1758.4 646.396L1745.94 653.997C1736.01 660.053 1723.03 655.329 1719.32 644.309L1714.67 630.479C1712.5 624.043 1706.92 619.359 1700.2 618.342L1685.77 616.158C1674.28 614.417 1667.37 602.454 1671.61 591.627L1676.93 578.039C1679.41 571.716 1678.14 564.539 1673.65 559.445L1664.01 548.497C1656.32 539.773 1658.72 526.169 1668.92 520.601L1681.74 513.614C1687.7 510.362 1691.34 504.051 1691.18 497.262L1690.82 482.674C1690.54 471.049 1701.12 462.17 1712.52 464.466L1726.83 467.348C1733.48 468.689 1740.33 466.197 1744.57 460.891L1753.68 449.488Z" fill="#E9DEEF"/>
    </svg>
  )
}

// 스트레스: 분홍 뾰족 별
function StressStar() {
  return (
    <svg viewBox="1296 418 252 252" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1418.81 430.164C1419.58 428.003 1422.63 428.003 1423.4 430.164L1441.83 481.955C1442.34 483.397 1444.04 484.015 1445.36 483.241L1492.76 455.409C1494.74 454.247 1497.08 456.212 1496.28 458.361L1477.1 509.879C1476.57 511.313 1477.47 512.879 1478.98 513.133L1533.19 522.284C1535.45 522.666 1535.98 525.675 1533.99 526.808L1486.18 553.946C1484.85 554.701 1484.54 556.481 1485.53 557.646L1521.17 599.498C1522.66 601.244 1521.13 603.891 1518.87 603.476L1464.81 593.536C1463.3 593.259 1461.92 594.421 1461.93 595.951L1462.33 650.921C1462.35 653.215 1459.47 654.26 1458.01 652.492L1422.99 610.125C1422.01 608.946 1420.2 608.946 1419.23 610.125L1384.2 652.492C1382.74 654.26 1379.87 653.215 1379.88 650.921L1380.29 595.951C1380.3 594.421 1378.91 593.259 1377.41 593.536L1323.34 603.476C1321.09 603.891 1319.56 601.244 1321.04 599.498L1356.69 557.646C1357.68 556.481 1357.36 554.701 1356.03 553.946L1308.23 526.808C1306.23 525.675 1306.76 522.666 1309.03 522.284L1363.23 513.133C1364.74 512.879 1365.64 511.313 1365.11 509.879L1345.93 458.361C1345.13 456.212 1347.47 454.247 1349.45 455.409L1396.85 483.241C1398.17 484.015 1399.87 483.397 1400.39 481.955L1418.81 430.164Z" fill="#FFA4A4"/>
    </svg>
  )
}

// 합리적 소비: 연두 다이아몬드
function RationalDiamond() {
  return (
    <svg viewBox="868 415 292 292" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1014.07" y="423.707" width="193.075" height="193.075" rx="39.5484" transform="rotate(45.9051 1014.07 423.707)" fill="#CBFFC5"/>
    </svg>
  )
}

// 충동적 소비: 복숭아 세잎 클로버
function ImpulsiveClover() {
  return (
    <svg viewBox="494 445 348 160" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M762.068 459.104C799.187 459.104 829.278 489.119 829.278 526.144C829.278 563.169 799.187 593.184 762.068 593.184C743.853 593.184 727.33 585.956 715.225 574.218C703.12 585.955 686.598 593.184 668.383 593.184C650.167 593.184 633.644 585.955 621.539 574.218C609.434 585.955 592.912 593.184 574.696 593.184C537.577 593.184 507.486 563.169 507.486 526.144C507.486 489.119 537.577 459.104 574.696 459.104C592.912 459.104 609.434 466.333 621.539 478.07C633.644 466.332 650.167 459.104 668.383 459.104C686.598 459.104 703.12 466.333 715.225 478.07C727.33 466.332 743.853 459.104 762.068 459.104Z" fill="#FFD8B6"/>
    </svg>
  )
}

// 보상심리: 하늘색 십자 다이아몬드
function RewardCross() {
  return (
    <svg viewBox="2044 414 238 236" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2193.79 485.247C2195.84 491.929 2201.07 497.16 2207.76 499.212L2245.52 510.814C2265.38 516.915 2265.38 545.028 2245.52 551.129L2207.76 562.73C2201.07 564.783 2195.84 570.013 2193.79 576.695L2182.19 614.459C2176.09 634.318 2147.98 634.318 2141.88 614.459L2130.27 576.695C2128.22 570.013 2122.99 564.782 2116.31 562.73L2078.54 551.128C2058.68 545.028 2058.68 516.914 2078.54 510.813L2116.31 499.212C2122.99 497.16 2128.22 491.929 2130.27 485.247L2141.88 447.482C2147.98 427.622 2176.09 427.622 2182.19 447.482L2193.79 485.247Z" fill="#A8E5F6"/>
    </svg>
  )
}

// 잘 모르겠어요: 회색 오각형
function UnsurePentagon() {
  return (
    <svg viewBox="2362 452 210 204" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2455.16 469.02C2461.54 464.387 2470.18 464.387 2476.55 469.02L2547.74 520.741C2554.12 525.374 2556.79 533.587 2554.35 541.084L2527.16 624.771C2524.72 632.267 2517.74 637.343 2509.86 637.343H2421.86C2413.98 637.343 2406.99 632.267 2404.56 624.771L2377.37 541.084C2374.93 533.587 2377.6 525.374 2383.98 520.741L2455.16 469.02Z" fill="#EEEEEE"/>
    </svg>
  )
}

// ── 배치 정보 ──────────────────────────────────────────────────
// 아이콘 크기(px)와 absolute 위치 지정

interface KW {
  label: Keyword
  w: number; h: number
  top?: string; bottom?: string; left?: string; right?: string
  Shape: React.FC
}

// 겹침 없이 배치 (375px 기준 x/y 영역 계산으로 검증)
// 소확행  x:-11~155  y:0~166
// 스트레스 x:203~375  y:15~187   ← 소확행과 x 비겹침 (gap 48px)
// 합리적  x:30~186   y:170~326   ← 스트레스와 y 비겹침
// 충동적  x:195~405  y:195~285   ← 합리적과 x 비겹침 (gap 9px), right -8%로 조정
// 보상심리 x:205~367  y:~300~461 ← 합리적/충동적 모두 y or x 비겹침
// 잘모르겠 x:-8~150   y:~341~495 ← 보상심리와 x 비겹침
const KEYWORDS: KW[] = [
  { label: '소확행',        w: 166, h: 166, top: '0%',    left: '-3%',   Shape: SohwaengBlob },
  { label: '스트레스',      w: 172, h: 172, top: '3%',    right: '0%',   Shape: StressStar },
  { label: '합리적 소비',   w: 156, h: 156, top: '34%',   left: '8%',    Shape: RationalDiamond },
  { label: '충동적 소비',   w: 210, h: 90,  top: '39%',   right: '-8%',  Shape: ImpulsiveClover },
  { label: '보상심리',      w: 162, h: 161, bottom: '8%', right: '2%',   Shape: RewardCross },
  { label: '잘 모르겠어요', w: 158, h: 154, bottom: '1%', left: '-2%',   Shape: UnsurePentagon },
]

// ── 페이지 ────────────────────────────────────────────────────

export default function Step3Page() {
  const router = useRouter()
  const { state, set, reset } = useRecord()
  // 프로그레스바 2번째 칸 (step3) / 총 칸 수 (최근:4, 과거:5)
  const totalSteps = getTotalSteps(state.recordDate)
  const progressPct = (2 / totalSteps) * 100

  // 키워드별 감정 온도 초기값
  const TEMP_MAP: Record<Keyword, number> = {
    '소확행':        90,
    '합리적 소비':   68,
    '보상심리':      55,
    '잘 모르겠어요': 45,
    '충동적 소비':   28,
    '스트레스':      12,
  }

  const handleNext = () => {
    if (!state.keyword) return
    // 사용자가 직접 온도를 조정한 적 없을 때만 키워드 기본값으로 설정
    // (← 뒤로 왔다가 다시 다음 눌러도 직접 설정한 온도 유지)
    if (!state.emotionTempSet) {
      set({ emotionTemp: TEMP_MAP[state.keyword] })
    }
    router.push('/record/step4')
  }

  const [showCancelModal, setShowCancelModal] = useState(false)
  const handleCancel = () => setShowCancelModal(true)
  const handleConfirmCancel = () => { reset(); router.push('/logs') }

  return (
    <div className="relative flex flex-col max-w-md mx-auto bg-white overflow-hidden" style={{ height: '100dvh' }}>
      {showCancelModal && <CancelConfirmModal onConfirm={handleConfirmCancel} onClose={() => setShowCancelModal(false)} />}
      {/* 상단 네비게이션 */}
      <div
        className="flex items-center justify-between px-5 pb-4 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <button onClick={() => router.back()} className="p-2 -ml-2" aria-label="뒤로가기">
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

      {/* 프로그레스 바: 2/totalSteps */}
      <div className="h-1 bg-gray-200 shrink-0">
        <div className="h-full bg-yellow-400" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="px-5 pt-6 pb-2 shrink-0">
        <h1 className="text-xl font-bold text-gray-900 leading-snug">소비 키워드를 선택해주세요</h1>
      </div>

      {/* 아이콘 영역: 절대좌표로 배치 */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {KEYWORDS.map(({ label, w, h, top, bottom, left, right, Shape }) => {
          const selected = state.keyword === label
          return (
            <button
              key={label}
              onClick={() => {
                // 키워드를 바꾸면 온도 초기화 플래그도 리셋 (새 키워드의 기본 온도부터 시작)
                if (state.keyword !== label) {
                  set({ keyword: label, emotionTempSet: false })
                } else {
                  set({ keyword: label })
                }
              }}
              aria-pressed={selected}
              // 아이콘 크기를 버튼 자체에 지정 → 레이블을 absolute로 중앙 오버레이
              className="absolute"
              style={{
                top, bottom, left, right,
                width: w,
                height: h,
                opacity: selected ? 1 : 0.5,
                transition: 'transform 100ms ease, opacity 100ms ease, filter 100ms ease',
                transform: selected ? 'scale(1.08)' : 'scale(1)',
                filter: selected ? 'drop-shadow(0 4px 14px rgba(0,0,0,0.18))' : 'none',
                zIndex: selected ? 10 : 1,
              }}
            >
              {/* SVG 아이콘: 버튼 전체를 채움 */}
              <Shape />
              {/* 키워드 레이블: 아이콘 중앙에 오버레이 */}
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 whitespace-nowrap pointer-events-none">
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={handleNext}
        className="w-full py-5 bg-black text-white text-base font-semibold shrink-0"
      >
        다음
      </button>
    </div>
  )
}
