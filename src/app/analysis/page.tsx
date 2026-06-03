'use client'

// 분석 페이지
// 기간 탭(1주/1개월/6개월/1년) + 기간 네비게이터 + 키워드별 막대그래프
// + 코멘트 말풍선 + 소비 리포트 배너 카드

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
// TODO [API] MOCK_USER → 로그인 세션/토큰에서 유저 정보 가져오도록 교체
import { MOCK_USER } from '@/lib/mockUser'

// ── 타입 / 상수 ──────────────────────────────────────────────

type Tab = '1주' | '1개월' | '6개월' | '1년'
const TABS: Tab[] = ['1주', '1개월', '6개월', '1년']

const KEYWORDS = [
  { id: '소확행',   label: '소확행',   tagLabel: '소확행 소비',   color: '#E9DEEF' },
  { id: '충동',     label: '충동',     tagLabel: '충동적 소비',   color: '#FFD8B6' },
  { id: '합리',     label: '합리',     tagLabel: '합리적 소비',   color: '#CBFFC5' },
  { id: '보상심리', label: '보상심리', tagLabel: '보상심리 소비', color: '#A8E5F6' },
  { id: '스트레스', label: '스트레스', tagLabel: '스트레스 소비', color: '#FFA4A4' },
  { id: '모름',     label: '모름',     tagLabel: '모름 소비',     color: '#EEEEEE' },
]

const COMMENT_POOL: Record<string, string[]> = {
  소확행:   ['일상의 틈새, 소소한 행복에 투자했던', '작지만 나를 다정하게 보살펴 준 지출이 많았던', '작은 행복 조각들을 차곡차곡 모았던'],
  충동:     ['반짝 충동에 지갑이 자주 열렸던', '조급한 마음이 결제 버튼보다 조금 빨랐던', '나도 모르게 손이 바빴던, 충동이 앞섰던'],
  합리:     ['꼼꼼하게 따져보고 쓴, 지혜로운', '감정에 흔들리지 않고 예산을 잘 지켜낸', '차분하게 균형을 유지한, 이성적인 소비의'],
  보상심리: ['열심히 살았으니까, 나에게 주는 선물이 많았던', "'이 정도면 써도 돼'가 자주 등장했던", '고생한 나를 달래주려 지갑을 자주 열었던'],
  스트레스: ['스트레스를 풀려고 지갑이 먼저 열렸던', '쌓인 긴장을 소비로 털어내려 했던 흔적이 남은', '지치고 빡빡했던 만큼, 나를 위해 쓴 돈이 많았던'],
  모름:     ['내 소비의 색깔이 아직 흐릿한, 알쏭달쏭한', '이름 붙이지 못한 감정들이 남아있는', '오구와 함께 천천히 답을 찾아가고 싶은'],
}

const PERIOD_SUFFIX: Record<Tab, string> = {
  '1주':   '한 주였어요',
  '1개월': '한 달이었어요',
  '6개월': '반기였어요',
  '1년':   '한 해였어요',
}

// ── 유틸 ────────────────────────────────────────────────────

// 문자열 → 양의 정수 해시 (같은 periodKey는 항상 같은 코멘트·금액을 반환하기 위해)
function hashStr(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// 해당 Date가 속한 주의 일요일 00:00:00 반환
function getWeekStart(d: Date): Date {
  const date = new Date(d)
  date.setDate(date.getDate() - date.getDay())
  date.setHours(0, 0, 0, 0)
  return date
}

// Date → "M.DD" 형식 문자열 (기간 네비게이터 레이블용)
function fmt(d: Date) {
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`
}

// ── 기간 계산 ─────────────────────────────────────────────────

type PeriodInfo = {
  navLabel: string
  periodKey: string
  isCurrent: boolean
  sectionTitle: string
  bannerTop: string
}

function getPeriodInfo(tab: Tab, offset: number): PeriodInfo {
  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth() + 1

  if (tab === '1주') {
    const start = new Date(getWeekStart(today))
    start.setDate(start.getDate() + offset * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const month = start.getMonth() + 1
    const year = start.getFullYear()
    const weekOfMonth = Math.ceil((start.getDate() + new Date(year, start.getMonth(), 1).getDay()) / 7)
    const isCurrent = offset === 0
    const navLabel = `${month}월 ${weekOfMonth}주 (${fmt(start)}~${fmt(end)})`
    const periodKey = `week-${year}-${start.getMonth()}-${weekOfMonth}`
    const sectionTitle = isCurrent ? '이번 주 소비 리포트' : `${month}월 ${weekOfMonth}째 주 소비 리포트`
    const bannerTop = isCurrent ? '소비 리포트와 함께\n이번 주를 돌아보세요' : `소비 리포트와 함께\n${month}월 ${weekOfMonth}째 주를 돌아보세요`
    return { navLabel, periodKey, isCurrent, sectionTitle, bannerTop }
  }

  if (tab === '1개월') {
    let year = todayYear
    let month = todayMonth + offset
    while (month <= 0) { year--; month += 12 }
    while (month > 12) { year++; month -= 12 }
    const isCurrent = year === todayYear && month === todayMonth
    const navLabel = `${year}년 ${month}월`
    const periodKey = `month-${year}-${month}`
    const sectionTitle = isCurrent ? '이번 달 소비 리포트' : `${month}월 소비 리포트`
    const bannerTop = isCurrent ? '소비 리포트와 함께\n이번 달을 돌아보세요' : `소비 리포트와 함께\n${month}월을 돌아보세요`
    return { navLabel, periodKey, isCurrent, sectionTitle, bannerTop }
  }

  if (tab === '6개월') {
    const currentHalf = todayMonth <= 6 ? 0 : 1
    const totalHalves = todayYear * 2 + currentHalf + offset
    const year = Math.floor(totalHalves / 2)
    const half = ((totalHalves % 2) + 2) % 2
    const isUpper = half === 0
    const halfLabel = isUpper ? '상반기' : '하반기'
    const monthRange = isUpper ? '1~6월' : '7~12월'
    const isCurrent = year === todayYear && half === currentHalf
    const navLabel = `${year}년 ${halfLabel} (${monthRange})`
    const periodKey = `half-${year}-${half}`
    const sectionTitle = isCurrent ? `${halfLabel} 소비 리포트` : `${year}년 ${halfLabel} 소비 리포트`
    const bannerTop = isCurrent ? `소비 리포트와 함께\n${halfLabel}를 돌아보세요` : `소비 리포트와 함께\n${year}년 ${halfLabel}를 돌아보세요`
    return { navLabel, periodKey, isCurrent, sectionTitle, bannerTop }
  }

  const year = todayYear + offset
  const isCurrent = year === todayYear
  const navLabel = `${year}년`
  const periodKey = `year-${year}`
  const sectionTitle = isCurrent ? '올해 소비 리포트' : `${year}년 소비 리포트`
  const bannerTop = isCurrent ? '소비 리포트와 함께\n올해를 돌아보세요' : `소비 리포트와 함께\n${year}년을 돌아보세요`
  return { navLabel, periodKey, isCurrent, sectionTitle, bannerTop }
}

// TODO [API] getMockAmounts 함수 전체 제거
//   대체: GET /analysis/keyword-amounts?tab=&startDate=&endDate=
//   응답: { [keyword: string]: number } 형태로 키워드별 합계 금액 수신
//   BarChart, CommentBubble, BannerCard 에 넘기는 amounts/sortedKws 도 그 응답으로 교체

function getMockAmounts(periodKey: string): Record<string, number> {
  const result: Record<string, number> = {}
  KEYWORDS.forEach(({ id }) => {
    const h = hashStr(periodKey + id)
    // 30% 확률로 0원, 나머지는 20,000~190,000원 사이
    result[id] = h % 10 < 3 ? 0 : Math.round(((h % 170) + 20) * 1000)
  })
  return result
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────

// 캐릭터 아이콘 (말풍선 아이콘.svg 원본 좌표 그대로)
function Character() {
  return (
    <svg
      viewBox="190 52 210 205"
      className="w-16 h-16 shrink-0"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="293.5" cy="151.5" r="90.5" fill="#F5F378"/>
      <circle cx="261.133" cy="155.239" r="21.9461" fill="white"/>
      <circle cx="260.607" cy="154.609" r="8.89708" fill="#242424"/>
      <path d="M260.178 189.149C260.178 189.149 271.59 199.229 290.903 200.107C310.215 200.985 324.261 189.149 324.261 189.149" stroke="#242424" strokeWidth="14.0455" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M313.16 152.234C313.16 152.234 324.416 142.585 343.464 141.745" stroke="#242424" strokeWidth="14.0455" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M235.939 115.732L266.898 122.079" stroke="#242424" strokeWidth="14.0455" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M315.07 118.075L346.362 113.655" stroke="#242424" strokeWidth="14.0455" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M362.043 102.953L367.078 125.3L385.96 130.008L367.385 135.809L363.662 158.411L358.627 136.065L339.745 131.357L358.32 125.555L362.043 102.953Z" fill="white"/>
    </svg>
  )
}

// ① 막대 그래프 — 바 너비 32px, 탭하면 금액 표시
const CHART_H = 180
const BAR_W = 32
const BAR_GAP = 20

function BarChart({ amounts }: { amounts: Record<string, number> }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const values = KEYWORDS.map(kw => amounts[kw.id] ?? 0)
  const max = Math.max(...values, 1)
  const hasData = values.some(v => v > 0)

  return (
    <div className="flex flex-col items-center px-5">
      {/* 바 영역 */}
      <div className="relative flex items-end" style={{ height: CHART_H, gap: BAR_GAP }}>
        {KEYWORDS.map(kw => {
          const val = amounts[kw.id] ?? 0
          const barH = hasData ? Math.max((val / max) * CHART_H, val > 0 ? 6 : 0) : 0
          const isSelected = selectedId === kw.id

          return (
            <div
              key={kw.id}
              className="relative flex flex-col items-center justify-end"
              style={{ width: BAR_W, height: CHART_H }}
            >
              {/* 금액 라벨 — 선택된 바 위에 표시 */}
              {isSelected && val > 0 && (
                <span
                  className="absolute text-[10px] font-bold text-gray-900 whitespace-nowrap"
                  style={{
                    bottom: barH + 6,
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                >
                  {val.toLocaleString('ko-KR')}원
                </span>
              )}
              {/* 바 */}
              <div
                onClick={() => val > 0 && setSelectedId(isSelected ? null : kw.id)}
                style={{
                  width: BAR_W,
                  height: Math.max(barH, val > 0 ? 6 : 2),
                  background: val > 0 ? kw.color : '#F3F4F6',
                  borderRadius: '4px 4px 0 0',
                  cursor: val > 0 ? 'pointer' : 'default',
                  transition: 'opacity 0.15s',
                  opacity: selectedId && selectedId !== kw.id ? 0.45 : 1,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* X축 레이블 */}
      <div className="flex mt-2" style={{ gap: BAR_GAP }}>
        {KEYWORDS.map(kw => (
          <div key={kw.id} className="flex justify-center" style={{ width: BAR_W }}>
            <span className="text-[10px] font-medium text-black text-center whitespace-nowrap">
              {kw.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ④⑤ 코멘트 말풍선 — 캐릭터가 말하는 형태 (꼬리가 오른쪽을 향함)
function CommentBubble({ topKwId, periodKey, tab }: {
  topKwId: string | null
  periodKey: string
  tab: Tab
}) {
  const comment = useMemo(() => {
    if (!topKwId) return null
    const pool = COMMENT_POOL[topKwId] ?? COMMENT_POOL['모름']
    const idx = hashStr(periodKey) % pool.length
    return `${pool[idx]} ${PERIOD_SUFFIX[tab]}`
  }, [topKwId, periodKey, tab])

  return (
    <div className="flex items-end gap-3 px-5">
      {/* 말풍선 본체 */}
      <div className="flex-1 relative bg-white rounded-2xl rounded-br-sm p-4 shadow-sm border border-gray-100">
        <p className="text-sm text-gray-800 leading-relaxed">
          {!topKwId ? (
            <span className="text-gray-400">아직 기록이 없어요</span>
          ) : (
            <>
              <span className="font-semibold text-gray-900">{MOCK_USER.nickname}님,</span>{' '}{comment}
            </>
          )}
        </p>

        {/* 꼬리 — 오른쪽(캐릭터 방향)을 향함 */}
        {/* 외곽선 레이어 */}
        <div
          className="absolute"
          style={{
            right: -15,
            bottom: 14,
            width: 0,
            height: 0,
            borderTop: '9px solid transparent',
            borderBottom: '9px solid transparent',
            borderLeft: '16px solid #e5e7eb',
          }}
        />
        {/* 흰색 채움 레이어 */}
        <div
          className="absolute"
          style={{
            right: -13,
            bottom: 15,
            width: 0,
            height: 0,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderLeft: '14px solid white',
          }}
        />
      </div>

      {/* 캐릭터 */}
      <Character />
    </div>
  )
}

// 리포트 배너 카드
function BannerCard({ bannerTop, topKeywords, onPress }: {
  bannerTop: string
  topKeywords: typeof KEYWORDS
  onPress: () => void
}) {
  const isEmpty = topKeywords.length === 0
  const rotations = [-6, -2, -9]

  return (
    <button
      className="w-full rounded-2xl p-5 text-left active:scale-95 transition-transform"
      style={{ background: '#F5F378' }}
      disabled={isEmpty}
      onClick={isEmpty ? undefined : onPress}
    >
      <p className="text-sm font-bold text-gray-900 leading-snug whitespace-pre-line">
        {isEmpty ? '아직 기록이 없어요' : bannerTop}
      </p>
      {!isEmpty && (
        <div className="mt-4 flex flex-wrap gap-2 min-h-8">
          {topKeywords.map((kw, i) => (
            <span
              key={kw.id}
              className="px-3 py-1 rounded-full text-xs font-bold text-gray-800"
              style={{
                background: kw.color,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `rotate(${rotations[i] ?? 0}deg)`,
              }}
            >
              {kw.tagLabel}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}

// ── 페이지 ────────────────────────────────────────────────────

function AnalysisPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 파라미터에서 초기값 읽기 (리포트 페이지에서 뒤로 올 때 복원)
  const initTab = (searchParams.get('tab') as Tab | null)
  const initOffset = parseInt(searchParams.get('offset') ?? '0', 10)

  const [tab, setTab] = useState<Tab>(initTab && TABS.includes(initTab) ? initTab : '1주')
  const [offset, setOffset] = useState(isNaN(initOffset) ? 0 : initOffset)

  // 상태 변경 시 URL에 반영 (뒤로 가기 후 복원용)
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('tab', tab)
    params.set('offset', String(offset))
    router.replace(`/analysis?${params.toString()}`)
  }, [tab, offset]) // eslint-disable-line react-hooks/exhaustive-deps

  const period = useMemo(() => getPeriodInfo(tab, offset), [tab, offset])

  // 탭 변경 시 오프셋 초기화 (현재 기간으로 리셋)
  const handleTabChange = (t: Tab) => { setTab(t); setOffset(0) }
  const handlePrev = () => setOffset(o => o - 1)
  // 현재 기간이면 미래로 이동 불가
  const handleNext = () => { if (!period.isCurrent) setOffset(o => o + 1) }

  // TODO [API] getMockAmounts 호출을 API fetch로 교체 (tab, offset → startDate/endDate 변환 후 요청)
  const amounts = useMemo(() => getMockAmounts(period.periodKey), [period.periodKey])

  // 금액 내림차순 정렬 후 0원 제외 → 상위 키워드 도출
  const sortedKws = useMemo(
    () => [...KEYWORDS].sort((a, b) => (amounts[b.id] ?? 0) - (amounts[a.id] ?? 0)).filter(kw => (amounts[kw.id] ?? 0) > 0),
    [amounts]
  )
  const topKwId = sortedKws[0]?.id ?? null // 최다 지출 키워드 (코멘트 결정에 사용)
  const top3Kws = sortedKws.slice(0, 3)    // 배너 카드 태그 최대 3개
  const hasData = sortedKws.length > 0

  return (
    <div className="flex flex-col max-w-md mx-auto bg-white" style={{ height: '100dvh' }}>
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
        {/* 기간 탭 */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="flex rounded-full bg-gray-100 p-0.5">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  tab === t ? 'bg-white text-black shadow-sm font-semibold' : 'text-gray-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 기간 네비게이터 */}
        <div className="flex items-center justify-center gap-4 py-3">
          <button onClick={handlePrev} className="p-2" aria-label="이전 기간">
            <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-900">{period.navLabel}</span>
          <button onClick={handleNext} disabled={period.isCurrent} className="p-2 disabled:opacity-30" aria-label="다음 기간">
            <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* 타이틀 */}
        <p className="text-center text-base font-bold text-gray-900 pb-4">키워드별 소비 금액 합산</p>

        {/* ① 막대 그래프 */}
        <BarChart amounts={amounts} />

        {/* ④⑤ 코멘트 말풍선 */}
        <div className="py-6">
          <CommentBubble topKwId={hasData ? topKwId : null} periodKey={period.periodKey} tab={tab} />
        </div>

        {/* 섹션 타이틀 — 배너 카드 바깥, 좌측 정렬 */}
        <p className="px-8 text-left text-base font-bold text-gray-900 pb-3">{period.sectionTitle}</p>

        {/* 배너 카드 — 좌우 패딩으로 너비 축소 */}
        <div className="px-8">
          <BannerCard bannerTop={period.bannerTop} topKeywords={top3Kws} onPress={() => router.push(`/analysis/report?tab=${encodeURIComponent(tab)}&offset=${offset}`)} />
        </div>

        <div className="h-6" />
      </div>

      <BottomNav />
    </div>
  )
}

export default function AnalysisPage() {
  return (
    <Suspense>
      <AnalysisPageInner />
    </Suspense>
  )
}
