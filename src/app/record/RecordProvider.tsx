'use client'

// Step 1~5 전체에서 공유하는 소비 기록 상태 (Context)
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
}

const DEFAULT: RecordState = {
  photo: null,
  category: null,
  amount: '',
  description: '',
  keyword: null,
  emotionTemp: 50,
  memo: '',
}

interface CtxType {
  state: RecordState
  set: (patch: Partial<RecordState>) => void // 일부 필드만 업데이트
  reset: () => void                          // X 버튼 누를 때 전체 초기화
}

const Ctx = createContext<CtxType | null>(null)

export function RecordProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RecordState>(DEFAULT)

  return (
    <Ctx.Provider
      value={{
        state,
        set: (patch) => setState((prev) => ({ ...prev, ...patch })),
        reset: () => setState(DEFAULT),
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
