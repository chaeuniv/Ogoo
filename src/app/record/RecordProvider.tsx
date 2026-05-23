'use client'

// Step 1~6 전체에서 공유하는 소비 기록 상태 (Context)
// 페이지 이동해도 데이터 유지됨 (layout에 Provider가 있어서)

import { createContext, useContext, useState } from 'react'

export type Keyword = '충동적 소비' | '우울 소비' | '필수 소비' | '소확행' | '잘 모르겠어'

interface RecordState {
  photo: string | null   // base64 or objectURL
  category: string | null
  amount: string         // 숫자 문자열 (콤마 없이 저장, 표시할 때만 포맷)
  description: string    // 소비 내용 (step2에서 입력)
  keyword: Keyword | null
  emotionTemp: number    // 0~100, 100=소확행(최고), 0=우울 소비(최저)
  memo: string
  recordDate: string     // "YYYY-MM-DD"
  rating: number | null  // 1~5 별점 (step6, 과거 날짜 기록 시만 사용)
  reviewReason: string | null // 선택한 이유 칩 (step6, 선택사항)
}

function makeDefault(): RecordState {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return {
    photo: null,
    category: null,
    amount: '',
    description: '',
    keyword: null,
    emotionTemp: 50,
    memo: '',
    recordDate: `${y}-${m}-${day}`,
    rating: null,
    reviewReason: null,
  }
}

interface CtxType {
  state: RecordState
  set: (patch: Partial<RecordState>) => void // 일부 필드만 업데이트
  reset: () => void                          // X 버튼 누를 때 전체 초기화
}

const Ctx = createContext<CtxType | null>(null)

export function RecordProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RecordState>(makeDefault)

  return (
    <Ctx.Provider
      value={{
        state,
        set: (patch) => setState((prev) => ({ ...prev, ...patch })),
        reset: () => setState(makeDefault()),
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

// 각 step 페이지에서 이걸로 상태 읽기/쓰기
export function useRecord() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRecord must be inside RecordProvider')
  return ctx
}

// ── 날짜 유틸 ─────────────────────────────────────────────────

// recordDate 기준 오늘까지 경과 일수 계산
export function daysSinceDate(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - target.getTime()) / 86400000)
}

// 4일 이상 경과한 과거 날짜 여부 — step5/6 분기 및 프로그레스바 총 단계 결정에 사용
export function isPastRecord(dateStr: string): boolean {
  return daysSinceDate(dateStr) >= 4
}

// 프로그레스바가 표시되는 총 칸 수
// 최근(4일 미만): step2~5 → 4칸, 과거(4일+): step2~6 → 5칸
export function getTotalSteps(dateStr: string): number {
  return isPastRecord(dateStr) ? 5 : 4
}
