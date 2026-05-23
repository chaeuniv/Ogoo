'use client'

// Step 3: 소비 키워드 선택
// 디자인 시안의 실제 SVG 경로를 viewBox로 직접 참조
// 미선택 버블: opacity 50%, 선택 시: opacity 100% + scale up

import { useRouter } from 'next/navigation'
import { useRecord, Keyword, getTotalSteps } from '../RecordProvider'

export const KEYWORD_COLORS: Record<Keyword, string> = {
  '충동적 소비': '#FFC8B6',
  '우울 소비':   '#A8E5F6',
  '소확행':      '#FFEC9D',
  '필수 소비':   '#C8F5E5',
  '잘 모르겠어': '#EEEEEE',
}

// ── SVG 모양 — 디자인 원본 좌표 그대로, viewBox로 정규화 ──────

function HappyCircle() {
  return (
    <svg viewBox="0 0 164 164" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <circle cx="82" cy="82" r="82" fill="#FFEC9D" />
    </svg>
  )
}

function EssentialTriangle() {
  return (
    <svg viewBox="904 250 141 156" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1032.18 253.592C1038.25 250.845 1045.04 255.61 1044.53 262.254L1034.24 395.13C1033.72 401.898 1026.03 405.527 1020.47 401.629L909.333 323.689C903.775 319.791 904.567 311.327 910.753 308.528L1032.18 253.592Z"
        fill="#C8F5E5"
      />
    </svg>
  )
}

function ImpulsiveBlob() {
  return (
    <svg viewBox="179 252 240 101" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M368.873 252.8C396.557 252.8 419 275.186 419 302.8C419 330.414 396.557 352.8 368.873 352.8C355.286 352.8 342.965 347.405 333.937 338.65C324.908 347.405 312.587 352.8 299 352.8C285.413 352.8 273.091 347.406 264.062 338.65C255.034 347.405 242.713 352.8 229.127 352.8C201.443 352.8 179 330.414 179 302.8C179 275.186 201.443 252.8 229.127 252.8C242.713 252.8 255.034 258.194 264.062 266.949C273.091 258.194 285.413 252.8 299 252.8C312.586 252.8 324.908 258.194 333.937 266.949C342.965 258.194 355.287 252.8 368.873 252.8Z"
        fill="#FFC8B6"
      />
    </svg>
  )
}

function SadStar() {
  return (
    <svg viewBox="683 243 169 167" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M765.887 243.215C766.46 241.604 768.74 241.604 769.313 243.215L783.054 281.843C783.437 282.918 784.704 283.379 785.688 282.802L821.043 262.044C822.519 261.178 824.265 262.643 823.668 264.246L809.365 302.669C808.967 303.739 809.641 304.906 810.766 305.096L851.193 311.921C852.88 312.206 853.276 314.45 851.788 315.295L816.133 335.535C815.141 336.098 814.907 337.426 815.647 338.295L842.229 369.509C843.338 370.811 842.198 372.785 840.516 372.476L800.193 365.062C799.07 364.856 798.037 365.723 798.046 366.864L798.345 407.861C798.357 409.572 796.215 410.352 795.125 409.033L769.001 377.435C768.274 376.555 766.926 376.555 766.199 377.435L740.075 409.033C738.985 410.352 736.843 409.572 736.856 407.861L737.154 366.864C737.163 365.723 736.13 364.856 735.008 365.062L694.685 372.476C693.002 372.785 691.862 370.811 692.972 369.509L719.553 338.295C720.293 337.426 720.059 336.098 719.067 335.535L683.412 315.295C681.925 314.45 682.32 312.206 684.007 311.921L724.434 305.096C725.559 304.906 726.233 303.739 725.835 302.669L711.532 264.246C710.935 262.643 712.682 261.178 714.157 262.044L749.512 282.802C750.497 283.379 751.763 282.918 752.146 281.843L765.887 243.215Z"
        fill="#A8E5F6"
      />
    </svg>
  )
}

function UnsurePentagon() {
  return (
    <svg viewBox="1149 244 159 153" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1217.8 248.433C1223.4 244.358 1231 244.358 1236.6 248.433L1299.21 293.915C1304.81 297.99 1307.16 305.211 1305.02 311.804L1281.11 385.396C1278.96 391.988 1272.82 396.452 1265.89 396.452H1188.51C1181.58 396.452 1175.44 391.988 1173.29 385.396L1149.38 311.804C1147.24 305.211 1149.59 297.99 1155.19 293.915L1217.8 248.433Z"
        fill="#EEEEEE"
      />
    </svg>
  )
}

// ── 배치 정보 ──────────────────────────────────────────────────

interface KW {
  label: Keyword
  w: number; h: number
  top?: string; bottom?: string; left?: string; right?: string
  Shape: React.FC
}

const KEYWORDS: KW[] = [
  { label: '소확행',      w: 158, h: 158, top: '0%',  left: '2%',   Shape: HappyCircle },
  { label: '필수 소비',   w: 142, h: 157, top: '2%',  right: '-2%', Shape: EssentialTriangle },
  { label: '충동적 소비', w: 198, h: 83,  top: '37%', left: '12%',  Shape: ImpulsiveBlob },
  { label: '우울 소비',   w: 158, h: 156, top: '57%', left: '-5%',  Shape: SadStar },
  { label: '잘 모르겠어', w: 150, h: 144, top: '55%', right: '2%',  Shape: UnsurePentagon },
]

// ── 페이지 ────────────────────────────────────────────────────

export default function Step3Page() {
  const router = useRouter()
  const { state, set, reset } = useRecord()
  // 프로그레스바 2번째 칸 (step3) / 총 칸 수 (최근:4, 과거:5)
  const totalSteps = getTotalSteps(state.recordDate)
  const progressPct = (2 / totalSteps) * 100

  const handleNext = () => {
    if (!state.keyword) return
    const tempMap: Record<Keyword, number> = {
      '소확행': 90, '필수 소비': 60, '잘 모르겠어': 45, '충동적 소비': 22, '우울 소비': 8,
    }
    set({ emotionTemp: tempMap[state.keyword] })
    router.push('/record/step4')
  }

  const handleCancel = () => { reset(); router.push('/') }

  return (
    <div className="flex flex-col max-w-md mx-auto bg-white overflow-hidden" style={{ height: '100dvh' }}>
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

      {/* 프로그레스 바: 3 / totalSteps */}
      <div className="h-1 bg-gray-200 shrink-0">
        <div className="h-full bg-yellow-400" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="px-5 pt-6 pb-2 shrink-0">
        <h1 className="text-xl font-bold text-gray-900 leading-snug">소비 키워드를 선택해주세요</h1>
      </div>

      {/* 버블 영역 */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {KEYWORDS.map(({ label, w, h, top, bottom, left, right, Shape }) => {
          const selected = state.keyword === label
          return (
            <button
              key={label}
              onClick={() => set({ keyword: label })}
              aria-pressed={selected}
              className="absolute flex items-center justify-center text-center"
              style={{
                width: w, height: h, top, bottom, left, right,
                opacity: selected ? 1 : 0.5,
                transition: 'transform 100ms ease, opacity 100ms ease, filter 100ms ease',
                transform: selected ? 'scale(1.08)' : 'scale(1)',
                filter: selected ? 'drop-shadow(0 4px 14px rgba(0,0,0,0.18))' : 'none',
                zIndex: selected ? 10 : 1,
              }}
            >
              <Shape />
              <span className="absolute text-sm font-bold leading-tight px-2 text-gray-700 pointer-events-none">
                {label}
              </span>
            </button>
          )
        })}
      </div>

      <button
        onClick={handleNext}
        className="w-full py-5 bg-black text-white text-base font-semibold shrink-0"
      >
        다음
      </button>
    </div>
  )
}
