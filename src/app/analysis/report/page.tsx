'use client'

// 소비 리포트 스토리 화면 — 분석 페이지 배너 카드 클릭 시 진입
// 5장 영수증 슬라이드: 아래로 스와이프 or 탭으로 이동
// 전환 애니메이션: 영수증 프린트 효과 (clip-path top→bottom)

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
// TODO [API] MOCK_RECORDS import 제거 후, 아래 ReportPageInner 에서 직접 fetch
import { MOCK_RECORDS, type FullRecord } from '@/lib/mockRecords'
import { KEYWORD_COLORS, type Keyword } from '@/lib/keywords'

const TOTAL_SLIDES = 5
type Tab = '1주' | '1개월' | '6개월' | '1년'

// ── 기간 유틸 ─────────────────────────────────────────────────

/** 한국어 마지막 글자 받침 여부로 은/는 반환 */
function getParticle(str: string): '은' | '는' {
  const code = str.charCodeAt(str.length - 1) - 0xAC00
  if (code < 0 || code > 11171) return '는'
  return code % 28 === 0 ? '는' : '은'
}

function getWeekStart(d: Date): Date {
  const date = new Date(d)
  date.setDate(date.getDate() - date.getDay())
  date.setHours(0, 0, 0, 0)
  return date
}

type PeriodInfo = { shortLabel: string; particle: '은' | '는'; start: Date; end: Date }

function getPeriodInfo(tab: Tab, offset: number): PeriodInfo {
  const today = new Date()

  if (tab === '1주') {
    const start = new Date(getWeekStart(today))
    start.setDate(start.getDate() + offset * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    const month = start.getMonth() + 1
    const year = start.getFullYear()
    const weekOfMonth = Math.ceil(
      (start.getDate() + new Date(year, start.getMonth(), 1).getDay()) / 7
    )
    const ORDINALS = ['첫째', '둘째', '셋째', '넷째', '다섯째']
    const shortLabel = `${month}월 ${ORDINALS[weekOfMonth - 1] ?? ''}주`
    return { shortLabel, particle: getParticle(shortLabel), start, end }
  }

  if (tab === '1개월') {
    let year = today.getFullYear()
    let month = today.getMonth() + 1 + offset
    while (month <= 0) { year--; month += 12 }
    while (month > 12) { year++; month -= 12 }
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59, 999)
    const shortLabel = `${month}월`
    return { shortLabel, particle: getParticle(shortLabel), start, end }
  }

  if (tab === '6개월') {
    const todayYear = today.getFullYear()
    const currentHalf = today.getMonth() < 6 ? 0 : 1
    const totalHalves = todayYear * 2 + currentHalf + offset
    const year = Math.floor(totalHalves / 2)
    const half = ((totalHalves % 2) + 2) % 2
    const isUpper = half === 0
    const start = new Date(year, isUpper ? 0 : 6, 1)
    const end = new Date(year, isUpper ? 6 : 12, 0, 23, 59, 59, 999)
    const isCurrent = year === todayYear && half === currentHalf
    const halfLabel = isUpper ? '상반기' : '하반기'
    const shortLabel = isCurrent ? halfLabel : `${year}년 ${halfLabel}`
    return { shortLabel, particle: getParticle(shortLabel), start, end }
  }

  // 1년
  const year = today.getFullYear() + offset
  const start = new Date(year, 0, 1)
  const end = new Date(year + 1, 0, 0, 23, 59, 59, 999)
  const shortLabel = `${year}년`
  return { shortLabel, particle: getParticle(shortLabel), start, end }
}

// TODO [API] filterByPeriod 제거 가능 — API 호출 시 startDate/endDate 파라미터로 서버에서 필터링
function filterByPeriod(records: FullRecord[], start: Date, end: Date): FullRecord[] {
  return records.filter(r => {
    const [y, m, d] = r.date.split('-').map(Number)
    const date = new Date(y, m - 1, d) // 로컬 기준 날짜 비교
    return date >= start && date <= end
  })
}

// TODO [API] getKeywordTotals 제거 가능 — 서버가 집계된 키워드별 합계를 내려줄 경우
function getKeywordTotals(records: FullRecord[]): Array<{ keyword: string; amount: number }> {
  const map: Record<string, number> = {}
  records.forEach(r => {
    if (!r.keyword) return
    map[r.keyword] = (map[r.keyword] ?? 0) + r.amount
  })
  return Object.entries(map)
    .map(([keyword, amount]) => ({ keyword, amount }))
    .sort((a, b) => b.amount - a.amount)
}

// ── 슬라이드 1: 이런 소비를 했어요 ───────────────────────────
// 분석_1 디자인.svg 기준:
//   영수증 clip 영역 = rect(x=67, y=159, w=259, h=555)
//   하단 장식 아이콘 = 같은 좌표계에 배치된 5개 키워드 컬러 도형
//   → viewBox="67 159 259 555" 로 그대로 재현

interface Slide1Props {
  shortLabel: string
  particle: '은' | '는'
  keywordTotals: Array<{ keyword: string; amount: number }>
}

function Slide1({ shortLabel, particle, keywordTotals }: Slide1Props) {
  return (
    <div style={{ height: '100%', position: 'relative' }}>

      {/* ── 하단 장식 아이콘 (배경 레이어) ─────────────────── */}
      {/* viewBox를 영수증 원본 좌표계(67,159 기준)로 설정해 SVG 그대로 재현 */}
      <svg
        viewBox="67 159 259 555"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 충동적 소비 — 주황 구름 */}
        <g opacity="0.51">
          <path d="M164.324 565.017C182.305 561.142 200.014 572.54 203.88 590.475C207.745 608.411 196.302 626.092 178.322 629.967C169.497 631.869 160.739 630.09 153.649 625.667C149.011 632.618 141.763 637.846 132.939 639.748C124.114 641.65 115.356 639.871 108.266 635.448C103.628 642.399 96.3797 647.627 87.555 649.529C69.5741 653.404 51.8643 642.006 47.9989 624.07C44.1336 606.135 55.5764 588.454 73.5572 584.579C82.3818 582.677 91.1402 584.455 98.2297 588.878C102.868 581.928 110.116 576.699 118.941 574.798C127.765 572.896 136.523 574.675 143.613 579.098C148.251 572.147 155.499 566.919 164.324 565.017Z" fill="#FFD8B6"/>
        </g>
        {/* 보상심리 — 파란 별 */}
        <path opacity="0.51" d="M275.604 653.65C272.336 653.055 268.986 654.118 266.659 656.489L253.509 669.885C246.593 676.931 234.732 670.785 236.5 661.072L239.861 642.604C240.456 639.336 239.393 635.986 237.022 633.659L223.624 620.508C216.579 613.593 222.725 601.732 232.437 603.499L250.907 606.86C254.175 607.455 257.525 606.392 259.852 604.021L273.002 590.624C279.918 583.579 291.779 589.725 290.011 599.437L286.65 617.907C286.055 621.175 287.119 624.525 289.489 626.852L302.886 640.002C309.931 646.917 303.786 658.778 294.073 657.011L275.604 653.65Z" fill="#A8E5F6"/>
        {/* 스트레스 — 빨간 별 */}
        <path opacity="0.51" d="M159.287 611.815C159.86 610.204 162.14 610.204 162.713 611.815L176.454 650.443C176.837 651.518 178.104 651.979 179.088 651.401L214.443 630.644C215.919 629.778 217.665 631.243 217.068 632.846L202.765 671.269C202.367 672.339 203.041 673.506 204.166 673.696L244.593 680.521C246.28 680.806 246.676 683.05 245.188 683.895L209.533 704.135C208.541 704.698 208.307 706.026 209.047 706.895L235.629 738.109C236.738 739.411 235.598 741.385 233.915 741.076L193.593 733.662C192.47 733.456 191.437 734.322 191.446 735.464L191.745 776.461C191.757 778.172 189.615 778.952 188.525 777.633L162.401 746.035C161.674 745.155 160.326 745.155 159.599 746.035L133.475 777.633C132.385 778.952 130.243 778.172 130.255 776.461L130.554 735.464C130.563 734.322 129.53 733.456 128.407 733.662L88.0845 741.076C86.402 741.385 85.2624 739.411 86.3715 738.109L112.953 706.895C113.693 706.026 113.459 704.698 112.467 704.135L76.8121 683.895C75.3244 683.05 75.7202 680.806 77.4071 680.521L117.834 673.696C118.959 673.506 119.633 672.338 119.235 671.269L104.932 632.846C104.335 631.243 106.081 629.778 107.557 630.644L142.912 651.401C143.896 651.979 145.163 651.518 145.546 650.443L159.287 611.815Z" fill="#FFA4A4"/>
        {/* 소확행 — 보라 별 */}
        <path opacity="0.51" d="M241.01 528.997C243.054 526.437 246.946 526.437 248.99 528.997L251.556 532.21C252.75 533.705 254.68 534.407 256.555 534.029L260.586 533.217C263.798 532.57 266.779 535.072 266.7 538.348L266.6 542.458C266.553 544.371 267.58 546.149 269.26 547.065L272.869 549.034C275.746 550.603 276.421 554.436 274.255 556.894L271.537 559.978C270.272 561.414 269.915 563.436 270.613 565.217L272.112 569.046C273.307 572.096 271.361 575.467 268.122 575.957L264.057 576.573C262.165 576.859 260.592 578.179 259.981 579.992L258.669 583.889C257.624 586.994 253.966 588.325 251.17 586.619L247.66 584.477C246.027 583.48 243.973 583.48 242.34 584.477L238.83 586.619C236.034 588.325 232.376 586.994 231.331 583.889L230.019 579.992C229.408 578.179 227.835 576.859 225.943 576.573L221.878 575.957C218.639 575.467 216.693 572.096 217.888 569.046L219.387 565.217C220.085 563.436 219.728 561.414 218.463 559.978L215.745 556.894C213.579 554.436 214.254 550.603 217.131 549.034L220.74 547.065C222.42 546.149 223.447 544.371 223.4 542.458L223.3 538.348C223.221 535.072 226.202 532.57 229.414 533.217L233.445 534.029C235.32 534.407 237.25 533.705 238.444 532.21L241.01 528.997Z" fill="#E9DEEF"/>
        {/* 합리적 소비 — 초록 사각형 */}
        <rect opacity="0.51" x="300.774" y="650" width="35.8871" height="35.8871" rx="7.35092" transform="rotate(45.9051 300.774 650)" fill="#CBFFC5"/>
      </svg>

      {/* ── 텍스트 내용 (전경 레이어) ──────────────────────── */}
      <div className="px-5 pt-6 pb-4" style={{ position: 'relative', zIndex: 1 }}>

        {/* 타이틀 */}
        <p className="text-xl font-black text-gray-900 leading-snug">{shortLabel}{particle}</p>
        <p className="text-xl font-black text-gray-900 leading-snug mb-12">이런 소비를 했어요</p>

        {/* 키워드별 금액 리스트 */}
        {keywordTotals.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">이 기간의 기록이 없어요</p>
        ) : (
          <div className="flex flex-col gap-3.5">
            {keywordTotals.map(({ keyword, amount }) => (
              <div key={keyword} className="flex items-center gap-2">
                {/* 검은 박스 키워드 레이블 (모서리 각지게) */}
                <div
                  className="shrink-0 flex items-center justify-center"
                  style={{ background: '#111', padding: '5px 10px', borderRadius: 0 }}
                >
                  <span
                    style={{
                      color: KEYWORD_COLORS[keyword as Keyword] ?? '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {keyword}
                  </span>
                </div>
                {/* 점선 구분선 */}
                <div
                  className="flex-1"
                  style={{ borderBottom: '1.5px dotted #C4C4C4', marginBottom: 1 }}
                />
                {/* 금액 */}
                <span
                  className="shrink-0"
                  style={{ fontSize: 12, fontWeight: 700, color: '#111' }}
                >
                  {amount.toLocaleString('ko-KR')}원
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// ── 슬라이드 2: 만족 소비 Top 3 ─────────────────────────────
// 순위 숫자색: 1=#F5F378, 2/#3=#D9D9D9
// 순위 높을수록 크게, Top1만 사진+날짜 노출

const RANK_NUM_COLORS = ['#F5F378', '#D9D9D9', '#D9D9D9']

// 순위별 크기 (box=순위박스 한 변, name=소비명 폰트, amt=금액 폰트)
const RANK_SIZES = [
  { box: 36, name: 17, amt: 14 },
  { box: 28, name: 14, amt: 12 },
  { box: 22, name: 12, amt: 11 },
]

interface Slide2Props {
  shortLabel: string
  top3: FullRecord[]
}

function Slide2({ shortLabel, top3 }: Slide2Props) {
  return (
    <div className="px-5 pt-6 pb-5">
      {/* 타이틀 — 왼쪽 정렬 */}
      <p className="text-xl font-black text-gray-900 leading-snug">{shortLabel}</p>
      <p className="text-xl font-black text-gray-900 leading-snug mb-12">만족 소비 Top 3</p>

      {/* 내용 — 중앙 정렬 */}
      {top3.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: '#AFAFAF' }}>
          이 기간에 만족한 소비가 없어요
        </p>
      ) : (
        <div className="flex flex-col items-center gap-5">
          {top3.map((r, i) => {
            const name  = r.title?.trim() || r.category || '소비 기록'
            const sz    = RANK_SIZES[i]
            const isTop1 = i === 0

            return (
              <div key={r.id} className="flex flex-col items-center gap-1.5 w-full">

                {/* 순위 박스 */}
                <div
                  className="flex items-center justify-center"
                  style={{ width: sz.box, height: sz.box, background: '#111', borderRadius: 0 }}
                >
                  <span style={{ color: RANK_NUM_COLORS[i], fontSize: sz.box * 0.5, fontWeight: 900, lineHeight: 1 }}>
                    {i + 1}
                  </span>
                </div>

                {/* 소비명 — #F5F378 하이라이트 박스 + "에" */}
                <div className="flex items-baseline justify-center gap-0.5">
                  <span
                    style={{
                      background: '#F5F378',
                      padding: '1px 5px',
                      borderRadius: 0,
                      fontSize: sz.name,
                      fontWeight: 800,
                      color: '#111',
                    }}
                  >
                    {name}
                  </span>
                  <span style={{ fontSize: sz.name, fontWeight: 800, color: '#111' }}>에</span>
                </div>

                {/* [금액]원을 소비했어요 — 금액 부분 #F5F378 박스 */}
                <div className="flex items-baseline justify-center flex-wrap gap-x-0.5">
                  <span
                    style={{
                      background: '#F5F378',
                      padding: '1px 4px',
                      borderRadius: 0,
                      fontSize: sz.amt,
                      fontWeight: 900,
                      color: '#111',
                    }}
                  >
                    {r.amount.toLocaleString('ko-KR')}
                  </span>
                  <span style={{ fontSize: sz.amt, fontWeight: 600, color: '#111' }}>
                    원을 소비했어요
                  </span>
                </div>

                {/* Top 1만: 사진 or 플레이스홀더 + 날짜 */}
                {isTop1 && (
                  r.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.photo}
                      alt={name}
                      className="mt-1 object-cover"
                      style={{ width: 72, height: 72, borderRadius: 4 }}
                    />
                  ) : (
                    /* 사진 없을 때 자리 확인용 플레이스홀더 */
                    <div
                      className="mt-1 flex items-center justify-center"
                      style={{
                        width: 72, height: 72, borderRadius: 4,
                        background: '#E8E8E8',
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="#AFAFAF" strokeWidth="1.5" className="w-6 h-6">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )
                )}
                {isTop1 && (
                  <p style={{ fontSize: 11, color: '#AFAFAF' }}>
                    {r.date.replace(/-/g, '.')}
                  </p>
                )}

                {/* 아이템 사이 구분선 (마지막 제외) */}
                {i < top3.length - 1 && (
                  <div style={{ width: '30%', borderBottom: '1px dashed #E0E0E0', marginTop: 8 }} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
// ── 슬라이드 3: 후회없는 소비 VS 후회가 남는 소비 ───────────────
// 기준: reviewDone=true, rating>=4 → 후회없는 / rating<=2 → 후회가 남는
//
// 얼굴 출처: 분析3_얼굴표정.svg
//   - 행복: 왼쪽 얼굴 (cx≈59/81), 눈동자 오른쪽 치우침 → 오른쪽(내측) 바라봄
//   - 슬픔: 오른쪽 얼굴 (cx≈226/248), 눈동자 왼쪽 치우침 → 왼쪽(내측) 바라봄
// viewBox: 스트로크(4.8px) 클리핑 방지를 위해 콘텐츠 bbox + ~3px 여유

function HappyFace() {
  // 행복한 표정: 올라간 눈썹, 위로 굽은 웃음 (y: 86→93 아래로)
  // 눈동자가 오른쪽으로 치우쳐(cx=61.6 vs 눈 중심 59.5) → 오른쪽 바라봄
  // fill="none" 필수 — 원본 SVG 루트 속성, 없으면 path가 검정 fill로 채워짐
  return (
    <svg viewBox="47 60 48 38" width="46" height="34" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 흰 눈 */}
      <circle cx="59.5242" cy="76.3396" r="7.52421" fill="white"/>
      <circle cx="81.4866" cy="76.3396" r="7.52421" fill="white"/>
      {/* 눈동자 — 오른쪽 바라봄 */}
      <circle cx="61.5577" cy="76.3399" r="3.05035" fill="#242424"/>
      <circle cx="83.9273" cy="76.3399" r="3.05035" fill="#242424"/>
      {/* 웃음 (아래로 휨) */}
      <path d="M52 86.8735C52 86.8735 56.5145 93.489 71.223 93.489C84.8055 93.489 88.7181 86.8735 88.7181 86.8735" stroke="#242424" strokeWidth="4.81549" strokeLinecap="round"/>
      {/* 눈썹 — 올라감 */}
      <path d="M52.2611 67.4164C52.2611 67.4164 55.2116 65.443 57.3772 65.0305C59.4965 64.6268 62.8935 65.3315 62.8935 65.3315" stroke="#242424" strokeWidth="4.81549" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M89.7194 67.4164C89.7194 67.4164 86.7689 65.443 84.6033 65.0305C82.484 64.6268 79.087 65.3315 79.087 65.3315" stroke="#242424" strokeWidth="4.81549" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function SadFace() {
  // 슬픈 표정: 찌푸린 눈썹, 아래로 굽은 입꼬리 (y: 94→89 위로)
  // 눈동자가 왼쪽으로 치우쳐(cx=223.4 vs 눈 중심 226.5) → 왼쪽 바라봄
  // fill="none" 필수 — 없으면 path가 검정 fill로 채워짐
  return (
    <svg viewBox="214 64 48 36" width="46" height="34" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 흰 눈 */}
      <circle cx="226.544" cy="79.2957" r="7.52421" fill="white"/>
      <circle cx="248.507" cy="79.2957" r="7.52421" fill="white"/>
      {/* 눈동자 — 왼쪽 바라봄 */}
      <circle cx="223.38" cy="79.0591" r="3.05035" fill="#242424"/>
      <circle cx="245.652" cy="79.0591" r="3.05035" fill="#242424"/>
      {/* 찌푸린 눈썹 */}
      <path d="M220.228 73.832L224.874 71.3817L229.819 68.7929" stroke="#242424" strokeWidth="4.81549" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M255.454 74.5239L250.792 72.1041L245.83 69.5478" stroke="#242424" strokeWidth="4.81549" strokeLinecap="round" strokeLinejoin="round"/>
      {/* 찡그린 입 (위로 휨 = 슬픈 표정) */}
      <path d="M225.038 94.6689C225.038 94.6689 228.294 89.8535 238.904 89.8535C248.701 89.8535 251.523 94.6689 251.523 94.6689" stroke="#242424" strokeWidth="4.81549" strokeLinecap="round"/>
    </svg>
  )
}

interface Slide3Props {
  shortLabel: string
  noRegretCount: number
  regretCount: number
}

function Slide3({ shortLabel, noRegretCount, regretCount }: Slide3Props) {
  const both0 = noRegretCount === 0 && regretCount === 0
  // 비율 기준: 큰 쪽 = MAX_H, 작은 쪽 = 비례 높이, 0건 = MIN_H
  const MAX_H  = 320
  const MIN_H  = 90
  const maxCount = Math.max(noRegretCount, regretCount)
  const noRegretH = noRegretCount === 0
    ? MIN_H
    : Math.max(MIN_H, Math.round((noRegretCount / maxCount) * MAX_H))
  const regretH = regretCount === 0
    ? MIN_H
    : Math.max(MIN_H, Math.round((regretCount / maxCount) * MAX_H))

  return (
    <div className="px-5" style={{ paddingTop: 24, paddingBottom: 32, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 소제목 */}
      <p style={{ fontSize: 12, color: '#111', marginBottom: 6 }}>{shortLabel} 동안</p>
      {/* 타이틀 — 왼쪽 정렬 */}
      <p className="text-xl font-black text-gray-900 leading-snug">후회없는 소비</p>
      <p className="text-xl font-black text-gray-900 leading-snug">VS 후회가 남는 소비</p>

      {/* 스페이서 — 최대 80px까지만 늘어나도록 제한 */}
      <div style={{ flex: 1, maxHeight: 260 }} />

      {both0 ? (
        <p className="text-sm text-center py-8" style={{ color: '#AFAFAF' }}>
          이 기간에 회고를 완료한 소비가 없어요
        </p>
      ) : (
        <div className="flex justify-center items-end gap-5">

          {/* ── 후회없는 소비 — 노란 막대 ── */}
          <div className="flex flex-col items-center gap-2">
            <div
              style={{
                width: 88,
                height: noRegretH,
                borderRadius: 40,
                background: '#F5F378',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                paddingBottom: 13,
                overflow: 'hidden',
              }}
            >
              {/* 얼굴: 바 하단 오른쪽(내측) — 오른쪽 바라봄 */}
              {noRegretCount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 5, marginBottom: 7 }}>
                  <HappyFace />
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#242424', lineHeight: 1.3 }}>후회없는</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#242424', lineHeight: 1.3 }}>소비</p>
              </div>
            </div>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{noRegretCount}건</p>
          </div>

          {/* ── 후회가 남는 소비 — 회색 막대 ── */}
          <div className="flex flex-col items-center gap-2">
            <div
              style={{
                width: 88,
                height: regretH,
                borderRadius: 40,
                background: '#E4E4DB',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                paddingBottom: 13,
                overflow: 'hidden',
              }}
            >
              {/* 얼굴: 바 하단 왼쪽(내측) — 왼쪽 바라봄 */}
              {regretCount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 5, marginBottom: 7 }}>
                  <SadFace />
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#242424', lineHeight: 1.3 }}>후회가 남는</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#242424', lineHeight: 1.3 }}>소비</p>
              </div>
            </div>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{regretCount}건</p>
          </div>

        </div>
      )}
    </div>
  )
}

// ── 슬라이드 4: 감정별 소비 분포 ──────────────────────────────
// emotionTemp(0~100) → 5단계 아이콘 매핑
// 분析4_아이콘.svg: 5개 아이콘이 x축으로 나란히 배치
// viewBox로 각 아이콘만 잘라서 사용 (스트로크 6.03 → ~3px 여유 포함)

function getEmotionIconIndex(emotionTemp: number): 0 | 1 | 2 | 3 | 4 {
  if (emotionTemp >= 80) return 0  // 매우 행복 (big smile)
  if (emotionTemp >= 60) return 1  // 보통/편안 (straight mouth)
  if (emotionTemp >= 40) return 2  // 애매함 (wavy mouth)
  if (emotionTemp >= 20) return 3  // 스트레스 (frown + furrowed brows)
  return 4                          // 매우 부정 (frown + raised inner brows)
}

// 하나의 SVG에 5개 아이콘 전체 포함 — viewBox 스위칭으로 각각 표시
// (분析4_아이콘.svg 원본 좌표계 그대로 사용, 배경 rect 제외)
type EmoIdx = 0 | 1 | 2 | 3 | 4
const EMOTION_VIEWBOXES: Record<EmoIdx, string> = {
  0: '26 101 84 84',   // cx=68.2,  cy=143.5
  1: '162 102 84 84',  // cx=204.5, cy=144.8
  2: '298 100 84 84',  // cx=340.8, cy=142.2
  3: '434 102 84 84',  // cx=477.1, cy=144.8
  4: '570 100 84 84',  // cx=613.4, cy=142.2
}

function EmotionIcon({ index, size = 48 }: { index: EmoIdx; size?: number }) {
  return (
    <svg
      viewBox={EMOTION_VIEWBOXES[index]}
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Icon 0: 매우 행복 (smile + raised brows) ── */}
      <circle cx="68.2143" cy="143.5" r="39.2143" fill="#F5F378"/>
      <circle cx="53.853" cy="141.599" r="9.42424" fill="white"/>
      <circle cx="81.3617" cy="141.599" r="9.42424" fill="white"/>
      <circle cx="56.3997" cy="141.599" r="3.82064" fill="#242424"/>
      <circle cx="84.4183" cy="141.599" r="3.82064" fill="#242424"/>
      <path d="M44.4287 154.793C44.4287 154.793 50.0833 163.079 68.506 163.079C85.5184 163.079 90.419 154.793 90.419 154.793" stroke="#242424" strokeWidth="6.03151" strokeLinecap="round"/>
      <path d="M44.7557 130.422C44.7557 130.422 48.4513 127.95 51.1637 127.434C53.8183 126.928 58.073 127.811 58.073 127.811" stroke="#242424" strokeWidth="6.03151" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M91.673 130.422C91.673 130.422 87.9774 127.95 85.265 127.434C82.6105 126.928 78.3557 127.811 78.3557 127.811" stroke="#242424" strokeWidth="6.03151" strokeLinecap="round" strokeLinejoin="round"/>
      {/* ── Icon 1: 편안 (straight mouth + level brows) ── */}
      <circle cx="204.5" cy="144.786" r="39.2143" fill="#F5F378"/>
      <circle cx="190.138" cy="142.885" r="9.42424" fill="white"/>
      <circle cx="217.647" cy="142.885" r="9.42424" fill="white"/>
      <circle cx="190.566" cy="142.566" r="3.82064" fill="#242424"/>
      <circle cx="218.584" cy="142.566" r="3.82064" fill="#242424"/>
      <path d="M181.041 131.708L187.5 130.452L194.358 129.097" stroke="#242424" strokeWidth="6.03151" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M226.567 129.125L219.998 129.495L213.017 129.867" stroke="#242424" strokeWidth="6.03151" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M191.269 159.102H218.787" stroke="#242424" strokeWidth="6.03151" strokeLinecap="round" strokeLinejoin="round"/>
      {/* ── Icon 2: 애매함 (wavy mouth) ── */}
      <circle cx="340.786" cy="142.214" r="39.2143" fill="#F5F378"/>
      <circle cx="326.424" cy="140.313" r="9.42424" fill="white"/>
      <circle cx="353.933" cy="140.313" r="9.42424" fill="white"/>
      <circle cx="329.114" cy="140.001" r="3.82064" fill="#242424"/>
      <circle cx="357.132" cy="140.001" r="3.82064" fill="#242424"/>
      <path d="M317.327 129.136L323.786 127.88L330.644 126.525" stroke="#242424" strokeWidth="6.03151" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M362.16 129.938L356.261 127.025L350.001 123.911" stroke="#242424" strokeWidth="6.03151" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M321.397 159.61L326.511 155.086L333.045 159.61L340.716 155.086L346.398 159.61L355.773 155.086L360.602 159.61" stroke="#242424" strokeWidth="6.03151" strokeLinecap="round" strokeLinejoin="round"/>
      {/* ── Icon 3: 스트레스 (frown + furrowed brows) ── */}
      <circle cx="477.072" cy="144.786" r="39.2143" fill="#F5F378"/>
      <circle cx="462.71" cy="142.885" r="9.42424" fill="white"/>
      <circle cx="490.219" cy="142.885" r="9.42424" fill="white"/>
      <circle cx="463.138" cy="142.566" r="3.82064" fill="#242424"/>
      <circle cx="491.157" cy="142.566" r="3.82064" fill="#242424"/>
      <path d="M454.269 127.247L460.088 130.316L466.282 133.558" stroke="#242424" strokeWidth="6.03151" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M498.39 126.38L492.55 129.411L486.335 132.613" stroke="#242424" strokeWidth="6.03151" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M465.35 158.362C465.35 158.362 469.428 152.331 482.717 152.331C494.988 152.331 498.523 158.362 498.523 158.362" stroke="#242424" strokeWidth="6.03151" strokeLinecap="round"/>
      {/* ── Icon 4: 매우 부정 (frown + raised inner brows) ── */}
      <circle cx="613.357" cy="142.214" r="39.2143" fill="#F5F378"/>
      <circle cx="598.996" cy="140.313" r="9.42424" fill="white"/>
      <circle cx="626.504" cy="140.313" r="9.42424" fill="white"/>
      <circle cx="602.439" cy="140.016" r="3.82064" fill="#242424"/>
      <circle cx="630.335" cy="140.016" r="3.82064" fill="#242424"/>
      <path d="M591.084 133.469L596.904 130.4L603.098 127.157" stroke="#242424" strokeWidth="6.03151" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M635.206 134.336L629.366 131.305L623.151 128.103" stroke="#242424" strokeWidth="6.03151" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M597.11 159.567C597.11 159.567 601.189 153.536 614.478 153.536C626.749 153.536 630.284 159.567 630.284 159.567" stroke="#242424" strokeWidth="6.03151" strokeLinecap="round"/>
    </svg>
  )
}

interface Slide4Props {
  shortLabel: string
  emotionGroups: Array<{ iconIdx: EmoIdx; total: number }>
}

function Slide4({ shortLabel, emotionGroups }: Slide4Props) {
  return (
    <div className="px-5 pt-6 pb-5">
      {/* 타이틀 — 왼쪽 정렬 */}
      <p className="text-xl font-black text-gray-900 leading-snug">{shortLabel}</p>
      <p className="text-xl font-black text-gray-900 leading-snug mb-12">감정별 소비 분포</p>

      {emotionGroups.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: '#AFAFAF' }}>
          이 기간의 기록이 없어요
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          rowGap: 20,
          columnGap: 20,
          alignItems: 'center',
          width: '100%',
        }}>
          {emotionGroups.flatMap(({ iconIdx, total }) => [
            // 아이콘 — 왼쪽 열, 왼쪽 정렬
            <div key={`icon-${iconIdx}`} style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <EmotionIcon index={iconIdx} size={64} />
            </div>,
            // >>> — 화면 중앙 (auto 컬럼)
            <div key={`arr-${iconIdx}`} style={{ display: 'flex', gap: 3 }}>
              <span style={{ fontSize: 11, color: '#242424' }}>▶</span>
              <span style={{ fontSize: 11, color: '#242424' }}>▶</span>
              <span style={{ fontSize: 11, color: '#242424' }}>▶</span>
            </div>,
            // 금액 — 오른쪽 정렬, "원" 위치 통일
            <div key={`amt-${iconIdx}`} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111', whiteSpace: 'nowrap' }}>
                {total.toLocaleString('ko-KR')}원
              </span>
            </div>,
          ])}
        </div>
      )}
    </div>
  )
}
// ── 슬라이드 5: 감정에 처방한 소비 ──────────────────────────────
// 부정적 감정(불안·분노·슬픔) 소비 건수 + 감정 해소 비율
// 알약.svg: 노란(#F5F378) + 주황(#FC5101) 반반 알약, 150° 회전

const NEGATIVE_EMOTIONS = ['불안', '분노', '슬픔']

// 말풍선 SVG (말풍선.svg 원본 기반)
// 꼬리: 오른쪽 아래 방향 → 오른쪽 정렬된 텍스트를 가리킴
function SpeechBubble({ count }: { count: number }) {
  // 자릿수에 따라 폰트 크기 축소 — 버블 넘침 방지
  const digits = String(count).length
  const numSize  = digits <= 2 ? 20 : digits === 3 ? 17 : digits === 4 ? 14 : 11
  const unitSize = digits <= 2 ? 15 : digits === 3 ? 13 : digits === 4 ? 11 : 9

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* viewBox: 원본 bubble + tail 영역만 크롭 */}
      <svg viewBox="28 42 90 68" width={112} height={85}
        fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="36" y="48" width="76" height="49.6198" rx="24.8099" fill="#111"/>
        <path d="M95.2935 104.12L96.8183 91.7026L85.3019 96.5908L95.2935 104.12Z" fill="#111"/>
      </svg>
      {/* 텍스트: bubble body (top≈7.5px, height≈62px) 중앙 정렬 */}
      <div style={{
        position: 'absolute',
        top: 7, left: 0, right: 0,
        height: 62,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}>
        <span style={{ color: '#FC5101', fontWeight: 900, fontSize: numSize, lineHeight: 1 }}>
          {count}
        </span>
        <span style={{ color: 'white', fontWeight: 900, fontSize: unitSize, lineHeight: 1 }}>
          건
        </span>
      </div>
    </div>
  )
}

function PillIcon({ size = 28 }: { size?: number }) {
  // 알약 실제 바운딩박스: x≈101~245, y≈25~145 → 여유 포함 viewBox
  return (
    <svg
      viewBox="88 12 165 140"
      width={size}
      height={Math.round(size * 140 / 165)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#pill-clip)">
        <rect x="245.473" y="79.2988" width="130.623" height="62.6992" rx="31.3496"
          transform="rotate(150 245.473 79.2988)" fill="#F5F378"/>
        <rect x="245.473" y="79.2988" width="65.3116" height="65.3116"
          transform="rotate(150 245.473 79.2988)" fill="#FC5101"/>
      </g>
      <defs>
        <clipPath id="pill-clip">
          <rect x="245.473" y="79.2988" width="130.623" height="62.6992" rx="31.3496"
            transform="rotate(150 245.473 79.2988)"/>
        </clipPath>
      </defs>
    </svg>
  )
}

interface Slide5Props {
  shortLabel: string
  negativeCount: number
  resolvedPercent: number  // 0~100 (건수가 0이면 0)
}

function Slide5({ shortLabel, negativeCount, resolvedPercent }: Slide5Props) {
  // 20개 동그라미 (각 5%) — 하단에서 위로 채움, gap 없음
  const yellowCount = Math.round(resolvedPercent / 5)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px 20px 0' }}>
      {/* 소제목 — 검정 */}
      <p style={{ fontSize: 12, color: '#111', marginBottom: 6 }}>{shortLabel} 동안</p>

      {/* 타이틀 */}
      <p className="text-xl font-black text-gray-900 leading-snug">감정에 :(</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <span className="text-xl font-black text-gray-900">처방한</span>
        <PillIcon size={28} />
        <span className="text-xl font-black text-gray-900">소비</span>
      </div>

      {negativeCount === 0 ? (
        <p style={{ fontSize: 14, color: '#AFAFAF' }}>이 기간에 부정적 감정으로 한 소비가 없어요</p>
      ) : (
        <>
          {/* 말풍선 (SVG) — 왼쪽, 꼬리가 오른쪽 아래를 향함 */}
          <div style={{ marginBottom: 6 }}>
            <SpeechBubble count={negativeCount} />
          </div>

          {/* 텍스트 — 오른쪽 정렬에서 살짝 왼쪽으로 */}
          <div style={{ textAlign: 'right', marginBottom: 20, paddingRight: 24 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#111', lineHeight: 1.6 }}>
              그 중{' '}
              <span style={{ color: '#FC5101', fontWeight: 900 }}>{resolvedPercent}%</span>
              의 소비가
            </p>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#111', lineHeight: 1.6 }}>
              감정을 해소해줬어요
            </p>
          </div>

          {/* 동그라미: flex:1 공간 안에서 하단 고정, gap 없음, 영수증 가로 꽉 채움 */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', marginLeft: -20, marginRight: -20 }}>
            <div style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 0,
            }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '50%',
                    background: i < yellowCount ? '#F5F378' : '#E4E4DB',
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── 메인 (searchParams 사용 — Suspense 필요) ─────────────────

function ReportPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab    = (searchParams.get('tab')    ?? '1주') as Tab
  const offset = Number(searchParams.get('offset') ?? '0')

  const { shortLabel, particle, start, end } = getPeriodInfo(tab, offset)

  // TODO [API] 아래 블록 전체를 API 호출로 교체
  //   예시: const data = await fetch(`/api/report?tab=${tab}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`)
  //   서버가 keywordTotals, top3Satisfied, noRegretCount, regretCount,
  //   negativeCount, resolvedPercent, emotionGroups 를 직접 내려주면 클라이언트 계산 불필요
  const periodRecords  = filterByPeriod(MOCK_RECORDS, start, end)
  const keywordTotals  = getKeywordTotals(periodRecords)

  // Slide2: 만족 소비 (rating 4~5), 금액 내림차순 Top 3
  const top3Satisfied = periodRecords
    .filter(r => r.reviewDone && (r.rating ?? 0) >= 4)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)

  // Slide3: 후회없는(rating≥4) vs 후회가 남는(rating≤2) 건수
  const noRegretCount = periodRecords.filter(r => r.reviewDone && (r.rating ?? 0) >= 4).length
  const regretCount   = periodRecords.filter(r => r.reviewDone && r.rating !== null && r.rating <= 2).length

  // Slide5: 부정 감정(불안·분노·슬픔) 건수 + 해소 비율
  const negativeRecords = periodRecords.filter(
    r => r.emotion && NEGATIVE_EMOTIONS.includes(r.emotion)
  )
  const negativeCount   = negativeRecords.length
  const resolvedCount   = negativeRecords.filter(r => r.emotionResolved === true).length
  const resolvedPercent = negativeCount > 0
    ? Math.round(resolvedCount / negativeCount * 100)
    : 0

  // Slide4: 감정별(emotionTemp → 5단계) 소비 합계, 금액 내림차순
  const emotionGroups = ([0, 1, 2, 3, 4] as EmoIdx[])
    .map(iconIdx => ({
      iconIdx,
      total: periodRecords
        .filter(r => getEmotionIconIndex(r.emotionTemp) === iconIdx)
        .reduce((sum, r) => sum + r.amount, 0),
    }))
    .filter(g => g.total > 0)
    .sort((a, b) => b.total - a.total)

  const [slide, setSlide] = useState(0)
  const receiptRef  = useRef<HTMLDivElement>(null)
  const animating   = useRef(false)
  const touchStartY = useRef<number | null>(null)
  const didSwipe    = useRef(false)

  // 최초 진입 애니메이션
  useEffect(() => {
    const el = receiptRef.current
    if (!el) return
    el.style.animation = 'receiptPrint 0.9s cubic-bezier(0.22,1,0.36,1) forwards'
  }, [])

  const goTo = useCallback((next: number) => {
    if (animating.current) return
    if (next < 0 || next >= TOTAL_SLIDES || next === slide) return
    animating.current = true

    const el = receiptRef.current
    if (!el) { animating.current = false; return }

    el.style.transition = 'opacity 0.15s ease-out, transform 0.15s ease-out'
    el.style.opacity    = '0'
    el.style.transform  = 'translateY(28px)'

    setTimeout(() => {
      setSlide(next)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el2 = receiptRef.current
          if (!el2) return
          el2.style.transition = 'none'
          el2.style.opacity    = '1'
          el2.style.transform  = 'translateY(0)'
          void el2.offsetWidth
          el2.style.animation  = 'none'
          void el2.offsetWidth
          el2.style.animation  = 'receiptPrint 0.9s cubic-bezier(0.22,1,0.36,1) forwards'
          setTimeout(() => { animating.current = false }, 950)
        })
      })
    }, 180)
  }, [slide])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (didSwipe.current) { didSwipe.current = false; return }
    goTo(e.clientX > window.innerWidth / 2 ? slide + 1 : slide - 1)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    didSwipe.current    = false
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return
    const dy = e.changedTouches[0].clientY - touchStartY.current
    touchStartY.current = null
    if (Math.abs(dy) > 45) {
      didSwipe.current = true
      goTo(dy > 0 ? slide + 1 : slide - 1)
    }
  }

  return (
    <>
      <style>{`
        @keyframes receiptPrint {
          from { clip-path: inset(0 0 100% 0); }
          to   { clip-path: inset(0 0 0% 0);   }
        }
      `}</style>

      <div
        className="relative max-w-md mx-auto overflow-hidden select-none"
        style={{ background: '#242424', height: '100dvh' }}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── X 버튼 ─────────────────────────────────────── */}
        <button
          onClick={e => { e.stopPropagation(); router.back() }}
          className="absolute z-30 p-2"
          style={{ top: 'max(env(safe-area-inset-top, 12px), 12px)', right: 12 }}
          aria-label="닫기"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* ── 프린터 + 영수증 ─────────────────────────────── */}
        <div
          className="absolute"
          style={{
            top: 'max(calc(env(safe-area-inset-top, 0px) + 56px), 96px)',
            left: '6.6%',
            right: '6.6%',
          }}
        >
          {/* 프린터 몸체 (z:1) */}
          <div
            className="relative"
            style={{ height: 49, background: '#D9D9D9', borderRadius: 13, zIndex: 1 }}
          >
            {/* 출력 슬롯 */}
            <div
              className="absolute"
              style={{
                bottom: 24, left: '7%', right: '7%',
                height: 4, background: '#565656', borderRadius: 2,
              }}
            />
          </div>

          {/* 영수증 종이 (z:2, 슬롯 하단에서 나옴) */}
          <div
            ref={receiptRef}
            style={{
              background: '#FBFBFB',
              marginLeft: '7%',
              marginRight: '7%',
              marginTop: -24,
              height: 'calc(100dvh - 190px)',
              overflowY: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {slide === 0 && (
              <Slide1
                shortLabel={shortLabel}
                particle={particle}
                keywordTotals={keywordTotals}
              />
            )}
            {slide === 1 && <Slide2 shortLabel={shortLabel} top3={top3Satisfied} />}
            {slide === 2 && <Slide3 shortLabel={shortLabel} noRegretCount={noRegretCount} regretCount={regretCount} />}
            {slide === 3 && <Slide4 shortLabel={shortLabel} emotionGroups={emotionGroups} />}
            {slide === 4 && (
              <Slide5
                shortLabel={shortLabel}
                negativeCount={negativeCount}
                resolvedPercent={resolvedPercent}
              />
            )}
          </div>
        </div>

        {/* ── 프로그레스 바 ──────────────────────────────── */}
        <div
          className="absolute flex gap-1.5"
          style={{
            bottom: 'max(env(safe-area-inset-bottom, 16px), 24px)',
            left: '7.4%',
            right: '7.4%',
          }}
        >
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 5, borderRadius: 2.5,
                background: i === slide ? '#F5F378' : '#D9D9D9',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}

// ── Default export (Suspense wrapper — useSearchParams 요구사항) ──

export default function ReportPage() {
  return (
    <Suspense fallback={<div style={{ background: '#242424', height: '100dvh' }} />}>
      <ReportPageInner />
    </Suspense>
  )
}
