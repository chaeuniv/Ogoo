'use client'

import { KEYWORD_COLORS } from '@/lib/keywords'

// ── 감정 얼굴 (step4와 동일한 viewBox / path) ─────────────────

export function EmotionFace({ temp }: { temp: number }) {
  if (temp >= 75) {
    return (
      <svg viewBox="850 295 88 68" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
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
      <svg viewBox="850 413 88 62" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
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
      <svg viewBox="850 530 88 68" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
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
      <svg viewBox="850 648 88 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
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
    <svg viewBox="850 771 88 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
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

// ── 키워드 쉐이프 ─────────────────────────────────────────────

export function KeywordShape({ keyword }: { keyword: string }) {
  const fill = KEYWORD_COLORS[keyword as keyof typeof KEYWORD_COLORS] ?? '#EEEEEE'

  if (keyword === '소확행') {
    return (
      <svg viewBox="1648 432 236 240" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1753.68 449.488C1760.93 440.401 1774.74 440.401 1782 449.488L1791.11 460.891C1795.34 466.197 1802.19 468.689 1808.85 467.348L1823.15 464.466C1834.55 462.17 1845.14 471.049 1844.85 482.674L1844.5 497.262C1844.33 504.051 1847.98 510.362 1853.94 513.614L1866.75 520.601C1876.96 526.169 1879.36 539.773 1871.67 548.497L1862.02 559.445C1857.53 564.539 1856.27 571.716 1858.74 578.039L1864.07 591.627C1868.31 602.454 1861.4 614.417 1849.9 616.158L1835.47 618.342C1828.76 619.359 1823.18 624.043 1821.01 630.479L1816.35 644.309C1812.64 655.329 1799.66 660.053 1789.74 653.997L1777.28 646.396C1771.48 642.859 1764.19 642.859 1758.4 646.396L1745.94 653.997C1736.01 660.053 1723.03 655.329 1719.32 644.309L1714.67 630.479C1712.5 624.043 1706.92 619.359 1700.2 618.342L1685.77 616.158C1674.28 614.417 1667.37 602.454 1671.61 591.627L1676.93 578.039C1679.41 571.716 1678.14 564.539 1673.65 559.445L1664.01 548.497C1656.32 539.773 1658.72 526.169 1668.92 520.601L1681.74 513.614C1687.7 510.362 1691.34 504.051 1691.18 497.262L1690.82 482.674C1690.54 471.049 1701.12 462.17 1712.52 464.466L1726.83 467.348C1733.48 468.689 1740.33 466.197 1744.57 460.891L1753.68 449.488Z" fill={fill}/>
      </svg>
    )
  }
  if (keyword === '스트레스') {
    return (
      <svg viewBox="1296 418 252 252" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1418.81 430.164C1419.58 428.003 1422.63 428.003 1423.4 430.164L1441.83 481.955C1442.34 483.397 1444.04 484.015 1445.36 483.241L1492.76 455.409C1494.74 454.247 1497.08 456.212 1496.28 458.361L1477.1 509.879C1476.57 511.313 1477.47 512.879 1478.98 513.133L1533.19 522.284C1535.45 522.666 1535.98 525.675 1533.99 526.808L1486.18 553.946C1484.85 554.701 1484.54 556.481 1485.53 557.646L1521.17 599.498C1522.66 601.244 1521.13 603.891 1518.87 603.476L1464.81 593.536C1463.3 593.259 1461.92 594.421 1461.93 595.951L1462.33 650.921C1462.35 653.215 1459.47 654.26 1458.01 652.492L1422.99 610.125C1422.01 608.946 1420.2 608.946 1419.23 610.125L1384.2 652.492C1382.74 654.26 1379.87 653.215 1379.88 650.921L1380.29 595.951C1380.3 594.421 1378.91 593.259 1377.41 593.536L1323.34 603.476C1321.09 603.891 1319.56 601.244 1321.04 599.498L1356.69 557.646C1357.68 556.481 1357.36 554.701 1356.03 553.946L1308.23 526.808C1306.23 525.675 1306.76 522.666 1309.03 522.284L1363.23 513.133C1364.74 512.879 1365.64 511.313 1365.11 509.879L1345.93 458.361C1345.13 456.212 1347.47 454.247 1349.45 455.409L1396.85 483.241C1398.17 484.015 1399.87 483.397 1400.39 481.955L1418.81 430.164Z" fill={fill}/>
      </svg>
    )
  }
  if (keyword === '합리적 소비') {
    return (
      <svg viewBox="868 415 292 292" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1014.07" y="423.707" width="193.075" height="193.075" rx="39.5484" transform="rotate(45.9051 1014.07 423.707)" fill={fill}/>
      </svg>
    )
  }
  if (keyword === '충동적 소비') {
    return (
      <svg viewBox="494 445 348 160" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M762.068 459.104C799.187 459.104 829.278 489.119 829.278 526.144C829.278 563.169 799.187 593.184 762.068 593.184C743.853 593.184 727.33 585.956 715.225 574.218C703.12 585.955 686.598 593.184 668.383 593.184C650.167 593.184 633.644 585.955 621.539 574.218C609.434 585.955 592.912 593.184 574.696 593.184C537.577 593.184 507.486 563.169 507.486 526.144C507.486 489.119 537.577 459.104 574.696 459.104C592.912 459.104 609.434 466.333 621.539 478.07C633.644 466.332 650.167 459.104 668.383 459.104C686.598 459.104 703.12 466.333 715.225 478.07C727.33 466.332 743.853 459.104 762.068 459.104Z" fill={fill}/>
      </svg>
    )
  }
  if (keyword === '보상심리') {
    return (
      <svg viewBox="2044 414 238 236" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2193.79 485.247C2195.84 491.929 2201.07 497.16 2207.76 499.212L2245.52 510.814C2265.38 516.915 2265.38 545.028 2245.52 551.129L2207.76 562.73C2201.07 564.783 2195.84 570.013 2193.79 576.695L2182.19 614.459C2176.09 634.318 2147.98 634.318 2141.88 614.459L2130.27 576.695C2128.22 570.013 2122.99 564.782 2116.31 562.73L2078.54 551.128C2058.68 545.028 2058.68 516.914 2078.54 510.813L2116.31 499.212C2122.99 497.16 2128.22 491.929 2130.27 485.247L2141.88 447.482C2147.98 427.622 2176.09 427.622 2182.19 447.482L2193.79 485.247Z" fill={fill}/>
      </svg>
    )
  }
  // 잘 모르겠어요 (pentagon fallback)
  return (
    <svg viewBox="2362 452 210 204" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2455.16 469.02C2461.54 464.387 2470.18 464.387 2476.55 469.02L2547.74 520.741C2554.12 525.374 2556.79 533.587 2554.35 541.084L2527.16 624.771C2524.72 632.267 2517.74 637.343 2509.86 637.343H2421.86C2413.98 637.343 2406.99 632.267 2404.56 624.771L2377.37 541.084C2374.93 533.587 2377.6 525.374 2383.98 520.741L2455.16 469.02Z" fill={fill}/>
    </svg>
  )
}

// ── 감정 + 키워드 결합 아이콘 ─────────────────────────────────
// SVG(감정+소비키워드_기록상세화면.svg) 기준:
//   - shape 위에 face 오버레이
//   - 라벨 rect가 shape 우하단 ~58% 지점에서 시작해 오른쪽으로 삐져나옴
//   - 라벨 배경색 = SVG clip-group rect fill (아이콘 색에서 회색끼 추가한 버전)
//   - 라벨 모서리 각짐 (borderRadius: 0)
//   - 라벨 텍스트 = ~소비 형식

const SHAPE      = 92                          // shape 크기 (px)
const LABEL_LEFT = Math.round(SHAPE * 0.76)   // 라벨 x (shape 내부 우하단 ~76%)
const LABEL_TOP  = Math.round(SHAPE * 0.68)   // 라벨 y
export const ICON_HANG  = 24                          // 아이콘 하단이 사진 밑으로 삐져나오는 px

// SVG label rect fill 색상
const LABEL_COLORS: Record<string, string> = {
  '충동적 소비':   '#E6B890',
  '합리적 소비':   '#9ED798',
  '스트레스':      '#EDCACA',
  '소확행':        '#F5EDF9',
  '보상심리':      '#CDEEF8',
  '잘 모르겠어요': '#E0E0E0',
}

// 키워드별 얼굴 크기 오버라이드 (쉐이프 비율에 맞게)
// 충동적 소비: viewBox 348×160 → 92×92 안 실제 높이 ~42px → 얼굴 작게
// 스트레스·보상심리: 252×252, 238×236 → 정사각형이나 얼굴이 상대적으로 큼 → 살짝 작게
const FACE_SIZES: Record<string, { w: number; h: number }> = {
  '충동적 소비': { w: 30, h: 26 },
  '스트레스':    { w: 46, h: 42 },
  '보상심리':    { w: 46, h: 42 },
  '합리적 소비': { w: 46, h: 42 },
  '소확행':      { w: 46, h: 42 },
}
const DEFAULT_FACE = { w: 58, h: 52 }

// 키워드별 라벨 위치 오버라이드
// 충동적 소비: 가로로 긴 shape → 라벨을 shape 우측 끝 근처에 배치해 텍스트가 가려지지 않게
// 보상심리: 라벨이 아이콘과 살짝 겹치도록 left를 더 왼쪽으로
const LABEL_OVERRIDES: Record<string, { top: number; left: number }> = {
  '충동적 소비': { top: 54, left: SHAPE - 12 },  // 텍스트가 shape 우측 끝 밖에서 시작
  '보상심리':    { top: 65, left: 48 },           // 아이콘과 살짝 겹치게
  '합리적 소비': { top: LABEL_TOP, left: 62 },   // 살짝 왼쪽으로
}

// 키워드별 얼굴 절대 위치 오버라이드 (shape 내 특정 위치에 고정)
// 충동적 소비: 3개 원 중 오른쪽 원 중심 (viewBox 348×160 → 92×92 렌더링 기준)
//   오른쪽 원 중심 원본 (x=268, y=81) → scale=92/348=0.264, yOff=24.85
//   rendered: x=71, y=46 → face(30×26) top=33, left=56
const FACE_POS: Record<string, { top: number; left: number }> = {
  '충동적 소비': { top: 33, left: 56 },
}

// 키워드별 아이콘 전체 추가 하단 오프셋 (photo wrapper 기준, 양수 = 더 아래로)
export const ICON_EXTRA_BOTTOM: Record<string, number> = {
  '충동적 소비': 16,
}

// ~소비 형식 라벨 텍스트
const LABEL_TEXT: Record<string, string> = {
  '소확행':        '소확행 소비',
  '스트레스':      '스트레스 소비',
  '합리적 소비':   '합리적 소비',
  '충동적 소비':   '충동적 소비',
  '보상심리':      '보상심리 소비',
  '잘 모르겠어요': '잘 모르겠어요',
}

export function CombinedIcon({ keyword, temp }: { keyword: string; temp: number }) {
  const labelBg   = LABEL_COLORS[keyword] ?? '#E0E0E0'
  const labelText = LABEL_TEXT[keyword] ?? keyword
  const face     = FACE_SIZES[keyword] ?? DEFAULT_FACE
  const labelPos = LABEL_OVERRIDES[keyword] ?? { top: LABEL_TOP, left: LABEL_LEFT }
  const facePos  = FACE_POS[keyword] ?? null

  return (
    // overflow: visible — 라벨이 오른쪽으로 삐져나와도 보임
    <div style={{ position: 'relative', width: SHAPE, height: SHAPE + 16, flexShrink: 0 }}>
      {/* 키워드 쉐이프 — z-index 1 */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: SHAPE, height: SHAPE, zIndex: 1 }}>
        <KeywordShape keyword={keyword} />
      </div>
      {/* 감정 얼굴 — 절대 위치 오버라이드 있으면 직접 배치, 없으면 중앙 정렬 */}
      {facePos ? (
        <div style={{
          position: 'absolute',
          top: facePos.top,
          left: facePos.left,
          width: face.w,
          height: face.h,
          zIndex: 2,
        }}>
          <EmotionFace temp={temp} />
        </div>
      ) : (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: SHAPE, height: SHAPE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2,
        }}>
          <div style={{ width: face.w, height: face.h }}>
            <EmotionFace temp={temp} />
          </div>
        </div>
      )}
      {/* 라벨 배경 — 아이콘 뒤 (z-index 0) */}
      <div style={{
        position: 'absolute',
        top: labelPos.top,
        left: labelPos.left,
        zIndex: 0,
        background: labelBg,
        borderRadius: 0,
        paddingLeft: 8, paddingRight: 8, paddingTop: 3, paddingBottom: 3,
        whiteSpace: 'nowrap',
        color: 'transparent',
        fontSize: 11, fontWeight: 700, lineHeight: 1,
        userSelect: 'none',
      }}>
        {labelText}
      </div>
      {/* 라벨 텍스트 — 아이콘 앞 (z-index 3), 배경 없음 */}
      <div style={{
        position: 'absolute',
        top: labelPos.top,
        left: labelPos.left,
        zIndex: 3,
        paddingLeft: 8, paddingRight: 8, paddingTop: 3, paddingBottom: 3,
        whiteSpace: 'nowrap',
        fontSize: 11, fontWeight: 700, color: '#3D3D3D', lineHeight: 1,
        pointerEvents: 'none',
      }}>
        {labelText}
      </div>
    </div>
  )
}

