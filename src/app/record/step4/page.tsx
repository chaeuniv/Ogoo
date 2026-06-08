'use client'

// Step 4: 감정 온도계
// - 온도계(좌) + 감정 얼굴(우) 레이아웃
// - 얼굴: 배경 박스 없이 눈썹·눈·입만
// - 온도계: 흰 튜브, 노란 채움, 광택, 내부 눈금, 우측 화살표 핸들

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRecord, Keyword, getTotalSteps } from '../RecordProvider'
import { KEYWORD_COLORS } from '../step3/page'
import CancelConfirmModal from '@/components/CancelConfirmModal'

// ── 감정 얼굴 — 감정표현.svg 원본 좌표 그대로, viewBox로 정규화 ─
// 모든 얼굴: viewBox 가로 70 · 세로 65 (동일 비율), strokeWidth="8" 그대로

function EmotionFace({ temp }: { temp: number }) {
  // viewBox: 각 얼굴 좌표 기준으로 strokeWidth=8 → 양쪽 4px 번짐 고려해 여백 10 추가
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

// ── 온도계 — 시안 기반: 흰 튜브, 내부 눈금, 우측 화살표 핸들 ─

// 눈금 위치 (튜브 위에서 아래로 비율, 시안 SVG 기준)
const TICK_FROMS_TOP = [0.115, 0.299, 0.483, 0.666, 0.850]

const TUBE_W = 60
const TUBE_H = 322
const ARROW_W = 70  // 화살표+온도 영역 너비

// ── 감정 그룹 & 태그 ─────────────────────────────────────────

type EmotionGroup = '기쁨' | '애매' | '불안' | '분노' | '슬픔'

const EMOTION_TAGS: Record<EmotionGroup, string[]> = {
  '기쁨': ['기쁨', '설렘', '흥분', '행복'],
  '애매': ['애매', '무료함', '공허함', '모르겠음'],
  '불안': ['불안', '압박감', '걱정'],
  '분노': ['분노', '짜증', '답답함'],
  '슬픔': ['슬픔', '우울', '지침', '외로움'],
}

const NEGATIVE_GROUPS = new Set<EmotionGroup>(['불안', '분노', '슬픔'])

function getEmotionGroup(temp: number): EmotionGroup {
  if (temp >= 75) return '기쁨'
  if (temp >= 55) return '애매'
  if (temp >= 35) return '불안'
  if (temp >= 15) return '분노'
  return '슬픔'
}

interface ThermometerProps {
  temp: number
  tubeRef: React.RefObject<HTMLDivElement | null>
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: () => void
}

function Thermometer({ temp, tubeRef, onPointerDown, onPointerMove, onPointerUp }: ThermometerProps) {
  const arrowTop = (1 - temp / 100) * TUBE_H   // 온도 높을수록 위에 위치
  const ARROW_H = 32

  return (
    <div className="relative shrink-0" style={{ width: TUBE_W + ARROW_W, height: TUBE_H }}>
      {/* 흰 튜브 (overflow:hidden 으로 노란 채움 클리핑) */}
      <div
        ref={tubeRef}
        className="absolute left-0 top-0 overflow-hidden"
        style={{
          width: TUBE_W,
          height: TUBE_H,
          borderRadius: TUBE_W / 2,
          background: 'white',
          border: '2px solid rgba(0,0,0,0.08)',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* 노란 채움 — 아래에서 위로 */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: `${temp}%`,
            background: '#F5F378',
            transition: 'height 80ms linear',
          }}
        />

        {/* 광택 하이라이트 (시안 동일 위치 비례) */}
        <div className="absolute" style={{ right: 7, top: '10%', width: 7, height: '28%', background: 'rgba(255,255,255,0.65)', borderRadius: 4 }} />
        <div className="absolute" style={{ right: 7, top: '45%', width: 7, height: '10%', background: 'rgba(255,255,255,0.65)', borderRadius: 4 }} />

        {/* 내부 눈금선 — 시안처럼 우측 내부에 표시 */}
        {TICK_FROMS_TOP.map((pos, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              right: 0,
              top: pos * TUBE_H,
              width: '55%',
              height: 3,
              background: 'rgba(97,97,97,0.45)',
              transform: 'translateY(-50%)',
            }}
          />
        ))}
      </div>

      {/* 화살표 핸들 — 시안처럼 우측에 왼쪽을 가리키는 화살표 */}
      <div
        className="absolute flex items-center touch-none"
        style={{
          left: TUBE_W,
          top: arrowTop - ARROW_H / 2,
          height: ARROW_H,
          transition: 'top 80ms linear',
          cursor: 'grab',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* 왼쪽 삼각형 팁 */}
        <div style={{
          width: 0, height: 0,
          borderTop: `${ARROW_H / 2}px solid transparent`,
          borderBottom: `${ARROW_H / 2}px solid transparent`,
          borderRight: '14px solid #242424',
          flexShrink: 0,
        }} />
        {/* 라벨 박스 */}
        <div
          className="flex items-center justify-center text-white font-bold select-none"
          style={{ background: '#242424', height: ARROW_H, paddingLeft: 8, paddingRight: 10, fontSize: 14, whiteSpace: 'nowrap' }}
        >
          {temp}°
        </div>
      </div>
    </div>
  )
}

// ── 페이지 ────────────────────────────────────────────────────

const DEFAULT_BG = '#F3F4F6'

export default function Step4Page() {
  const router = useRouter()
  const { state, set, reset } = useRecord()
  const tubeRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const temp = state.emotionTemp
  const bg = state.keyword ? (KEYWORD_COLORS[state.keyword as Keyword] ?? DEFAULT_BG) : DEFAULT_BG
  // 프로그레스바 3번째 칸 (step4) / 총 칸 수 (최근:4, 과거:5)
  const totalSteps = getTotalSteps(state.recordDate)
  const progressPct = (3 / totalSteps) * 100

  const updateTempFromY = (clientY: number) => {
    if (!tubeRef.current) return
    const rect = tubeRef.current.getBoundingClientRect()
    const pct = 1 - (clientY - rect.top) / rect.height
    set({ emotionTemp: Math.round(Math.max(0, Math.min(1, pct)) * 100) })
  }

  // 이전 방문에서 드래그한 적 있으면 true로 초기화 → 말풍선·버튼 상태 복원
  const [hasDragged, setHasDragged] = useState(() => state.emotionTempSet)

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = true
    updateTempFromY(e.clientY)
  }
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    updateTempFromY(e.clientY)
  }
  const handlePointerUp = () => {
    isDragging.current = false
    setHasDragged(true)
    set({ emotionTempSet: true }) // RecordProvider에 영구 저장 → 뒤로 갔다 와도 유지
  }

  // ── 감정 그룹 / 태그 / 말풍선 ────────────────────────────────
  const emotionGroup = getEmotionGroup(temp)
  const tags = EMOTION_TAGS[emotionGroup]
  const isNegative = NEGATIVE_GROUPS.has(emotionGroup)

  // 감정 그룹이 바뀌면 해소 여부 초기화
  const prevGroupRef = useRef<EmotionGroup | null>(null)
  useEffect(() => {
    if (prevGroupRef.current !== null && prevGroupRef.current !== emotionGroup) {
      set({ emotionResolved: null })
    }
    prevGroupRef.current = emotionGroup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotionGroup])

  const [showCancelModal, setShowCancelModal] = useState(false)
  const handleCancel = () => setShowCancelModal(true)
  const handleConfirmCancel = () => { reset(); router.push('/logs') }

  return (
    <div
      className="relative flex flex-col max-w-md mx-auto overflow-hidden transition-colors duration-300"
      style={{ height: '100dvh', background: bg }}
    >
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

      {/* 프로그레스 바: 4 / totalSteps */}
      <div className="h-1 bg-gray-200 shrink-0">
        <div className="h-full bg-yellow-400" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="px-5 pb-4 pt-6 shrink-0">
        <h1 className="text-xl font-bold text-gray-900 leading-snug">
          소비했을 때 느낀<br />감정을 기록해주세요
        </h1>
      </div>

      {/* 온도계(좌, y축 중앙) + 우측 컬럼(얼굴 상단·말풍선·태그 하단) */}
      <div className="flex-1 flex items-center pl-8 pr-5 pb-4 gap-3 min-h-0">
        {/* 온도계 — y축 중앙 정렬 (items-center 상속) */}
        <Thermometer
          temp={temp}
          tubeRef={tubeRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />

        {/* 우측 컬럼 — 높이 전체 사용, 얼굴 위·태그 아래 */}
        <div className="flex-1 self-stretch flex flex-col pt-2">
          {/* 감정 얼굴 — 상단 */}
          <div className="flex justify-center">
            <div style={{ width: 100, height: 94, transform: 'translateX(10px)' }}>
              <EmotionFace temp={temp} />
            </div>
          </div>

          {/* 부정 감정 말풍선 — 드래그 완료 후 표시 (불안·분노·슬픔) */}
          {isNegative && hasDragged && (
            <div className="relative bg-white rounded-2xl px-4 py-3 shadow-sm mt-3">
              {/* 위쪽 꼬리 */}
              <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2"
                style={{
                  width: 0, height: 0,
                  borderLeft: '9px solid transparent',
                  borderRight: '9px solid transparent',
                  borderBottom: '11px solid white',
                }}
              />
              <p className="text-sm font-bold text-gray-900 text-center leading-snug">
                소비를 통해<br />감정이 해소됐나요?
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => set({ emotionResolved: true })}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={
                    state.emotionResolved === true
                      ? { background: '#F5F378', color: '#242424' }
                      : { background: '#F3F4F6', color: '#9CA3AF' }
                  }
                >
                  네
                </button>
                <button
                  onClick={() => set({ emotionResolved: false })}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={
                    state.emotionResolved === false
                      ? { background: '#242424', color: '#F5F378' }
                      : { background: '#F3F4F6', color: '#9CA3AF' }
                  }
                >
                  아니요
                </button>
              </div>
            </div>
          )}

          {/* 감정 태그 — 우측 하단, 글자 크기만큼 가로폭 */}
          <div className="mt-auto flex flex-col items-end gap-1.5 pb-2 mr-5">
            {tags.map((tag) => (
              <div
                key={tag}
                className="rounded-full text-sm font-normal text-gray-900 shadow-sm"
                style={{ paddingLeft: 14, paddingRight: 14, paddingTop: 8, paddingBottom: 8, background: 'rgba(255,255,255,0.66)' }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={() => router.push('/record/step5')}
        className="w-full py-5 bg-black text-white text-base font-semibold shrink-0"
      >
        다음
      </button>
    </div>
  )
}
