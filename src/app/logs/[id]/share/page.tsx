'use client'

// 기록 공유 화면
// 진입: /logs/[id] 의 ••• → 공유하기
// 구성: 검정 배경 + 영수증 카드(흰색, 사진/설명/금액/감정) + 장식 + 키워드·감정 결합 아이콘
// ••• 메뉴: 이미지 저장(다운로드) / 공유하기(Web Share API), html2canvas로 캡처

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { authFetch } from '@/lib/api'
import { enumToKeyword, enumToCategoryDisplay } from '@/lib/mappings'
import { CombinedIcon } from '../icons'

interface ShareRecord {
  id: string
  title: string
  category: string | null
  categoryLabel: string | null
  keywordLabel: string | null
  consumedAt: string
  photo: string | null
  keyword: string | null
  amount: number
  emotionTemp: number
}

// 영수증 카드 — 하단 지그재그(영수증 절단선) 모양 (Union.svg 기반)
// preserveAspectRatio="none" 으로 컨테이너 크기에 맞춰 늘려서 사용
function ReceiptShape() {
  return (
    <svg
      viewBox="0 0 288 730"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M284.394 0.272135C284.603 -0.0905507 285.127 -0.090309 285.337 0.272135L287.88 4.67546H288V4.96061C288.008 5.015 288.008 5.0691 288 5.12174V729.925H0V4.67546H1.7793L3.59082 0.732096C3.78523 0.308909 4.38666 0.308888 4.58105 0.732096L6.29102 4.45768L8.46973 0.686198C8.67947 0.323369 9.20331 0.323409 9.41309 0.686198L11.7158 4.67546H12.7041L15.0078 0.686198C15.2176 0.323404 15.7414 0.323373 15.9512 0.686198L17.9307 4.11491L19.9111 0.686198C20.1209 0.323369 20.6447 0.323409 20.8545 0.686198L23.1064 4.58756L25.3594 0.686198C25.5691 0.323369 26.093 0.323409 26.3027 0.686198L28.6055 4.67546H29.0488L31.3525 0.686198C31.5623 0.323369 32.0861 0.323408 32.2959 0.686198L34.5479 4.58756L36.8008 0.686198C37.0105 0.323369 37.5344 0.323408 37.7441 0.686198L39.7236 4.11491L41.7041 0.686198C41.9138 0.323332 42.4376 0.323446 42.6475 0.686198L44.9512 4.67546H45.3926L47.6973 0.686198C47.907 0.323367 48.4308 0.32341 48.6406 0.686198L50.9434 4.67546H51.3867L53.6904 0.686198C53.9002 0.323367 54.424 0.32341 54.6338 0.686198L56.6133 4.11491L58.5938 0.686198C58.8035 0.323332 59.3273 0.323446 59.5371 0.686198L61.5166 4.11491L63.4971 0.686198C63.7068 0.323297 64.2306 0.323481 64.4404 0.686198L66.4199 4.11491L68.4004 0.686198C68.61 0.323261 69.1339 0.323516 69.3438 0.686198L71.6465 4.67546H72.0898L74.3936 0.686198C74.6032 0.323261 75.127 0.323516 75.3369 0.686198L77.6396 4.67546H78.083L80.3867 0.686198C80.5964 0.323297 81.1202 0.323481 81.3301 0.686198L83.6328 4.67546H84.0762L86.3799 0.686198C86.5896 0.323297 87.1134 0.323481 87.3232 0.686198L89.627 4.67546H90.0684L92.373 0.686198C92.5828 0.323332 93.1066 0.323446 93.3164 0.686198L95.2959 4.11491L97.2764 0.686198C97.4861 0.323297 98.0099 0.323481 98.2197 0.686198L100.472 4.58756L102.725 0.686198C102.934 0.323297 103.458 0.323481 103.668 0.686198L105.873 4.50553L107.893 0.75944C108.098 0.377664 108.646 0.377785 108.852 0.75944L110.962 4.67546H111.863L114.166 0.686198C114.376 0.323297 114.9 0.323481 115.109 0.686198L117.089 4.11491L119.069 0.686198C119.279 0.323261 119.803 0.323516 120.013 0.686198L122.316 4.67546H123.305L125.607 0.686198C125.817 0.323297 126.341 0.323481 126.551 0.686198L128.803 4.58756L131.056 0.686198C131.265 0.323297 131.789 0.323481 131.999 0.686198L133.163 2.70182L134.566 0.272135C134.776 -0.0904163 135.3 -0.0904435 135.51 0.272135L138.052 4.67546H138.602L140.566 1.27214C140.776 0.90959 141.3 0.90955 141.51 1.27214L143.469 4.66667L146.008 0.272135C146.218 -0.0904097 146.741 -0.0904501 146.951 0.272135L148.931 3.70085L150.911 0.272135C151.121 -0.090445 151.645 -0.0904148 151.854 0.272135L154.106 4.1735L156.359 0.272135C156.569 -0.090445 157.093 -0.0904148 157.303 0.272135L159.827 4.64518L162.353 0.272135C162.562 -0.090445 163.086 -0.0904148 163.296 0.272135L165.548 4.1735L167.801 0.272135C168.011 -0.090445 168.534 -0.0904148 168.744 0.272135L170.724 3.70085L172.704 0.272135C172.914 -0.0904803 173.438 -0.0903796 173.647 0.272135L176.172 4.64421L178.697 0.272135C178.907 -0.090445 179.431 -0.0904148 179.641 0.272135L182.165 4.64518L184.69 0.272135C184.9 -0.090445 185.424 -0.0904148 185.634 0.272135L187.613 3.70085L189.594 0.272135C189.804 -0.0904803 190.327 -0.0903796 190.537 0.272135L192.517 3.70085L194.497 0.272135C194.707 -0.0905155 195.231 -0.0903443 195.44 0.272135L197.42 3.70085L199.4 0.272135C199.61 -0.0905507 200.134 -0.090309 200.344 0.272135L202.868 4.64518L205.394 0.272135C205.603 -0.0905507 206.127 -0.090309 206.337 0.272135L208.861 4.64518L211.387 0.272135C211.596 -0.0905155 212.12 -0.0903443 212.33 0.272135L214.854 4.64518L217.38 0.272135C217.59 -0.0905155 218.113 -0.0903443 218.323 0.272135L220.848 4.64421L223.373 0.272135C223.583 -0.0904803 224.107 -0.0903796 224.316 0.272135L226.296 3.70085L228.276 0.272135C228.486 -0.0905155 229.01 -0.0903443 229.22 0.272135L231.472 4.1735L233.725 0.272135C233.934 -0.0905155 234.458 -0.0903443 234.668 0.272135L236.873 4.09147L238.893 0.345377C239.098 -0.0363381 239.646 -0.0360982 239.852 0.345377L242.186 4.67546H242.624L245.166 0.272135C245.376 -0.0905155 245.9 -0.0903443 246.109 0.272135L248.089 3.70085L250.069 0.272135C250.279 -0.0905507 250.803 -0.090309 251.013 0.272135L253.556 4.67546H254.065L256.607 0.272135C256.817 -0.0905155 257.341 -0.0903443 257.551 0.272135L259.803 4.1735L262.056 0.272135C262.265 -0.0905155 262.789 -0.0903443 262.999 0.272135L265.523 4.64518L268.049 0.272135C268.259 -0.0905155 268.782 -0.0903443 268.992 0.272135L270.699 3.22917L272.407 0.272135C272.617 -0.0907271 273.142 -0.0906969 273.352 0.272135L275.876 4.64518L278.4 0.272135C278.61 -0.0905507 279.134 -0.090309 279.344 0.272135L281.868 4.64518L284.394 0.272135Z" fill="white"/>
    </svg>
  )
}

// 노란 장식 블롭 (공유하기_장식3.svg 일부)
function YellowBlob({ size = 96 }: { size?: number }) {
  return (
    <svg viewBox="220 60 125 65" width={size} height={size * (65 / 125)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M311.925 64.4264C324.89 63.0862 336.485 72.4841 337.822 85.4169C339.158 98.3496 329.731 109.92 316.766 111.26C310.402 111.918 304.371 109.988 299.719 106.324C295.914 110.862 290.405 113.985 284.042 114.642C277.678 115.3 271.647 113.37 266.995 109.707C263.19 114.245 257.681 117.367 251.317 118.025C238.352 119.365 226.758 109.968 225.421 97.0354C224.084 84.1026 233.511 72.5317 246.476 71.1915C252.84 70.5338 258.871 72.4636 263.524 76.127C267.328 71.5895 272.837 68.4667 279.201 67.8089C285.564 67.1512 291.595 69.0811 296.248 72.7444C300.052 68.2069 305.562 65.0841 311.925 64.4264Z" fill="#FFEC9D"/>
    </svg>
  )
}

export default function SharePage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()

  const [record, setRecord] = useState<ShareRecord | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    authFetch(`/api/consumptions/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          const d = json.data
          setRecord({
            id: d.consumption_id,
            title: d.title,
            category: d.category,
            categoryLabel: d.category_label ?? null,
            keywordLabel: d.keyword_label ?? null,
            consumedAt: d.consumed_at ?? d.created_at,
            photo: d.receipt_url ?? null,
            keyword: enumToKeyword(d.emotion_tag, d.keyword_label),
            amount: d.amount,
            emotionTemp: d.emotion,
          })
        }
      })
      .catch(() => {})
  }, [id])

  // 카드+배경 영역 캡처 (X / ··· 버튼 제외) → PNG Blob
  const captureImage = async (): Promise<Blob | null> => {
    if (!captureRef.current) return null
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(captureRef.current, {
      useCORS: true,
      backgroundColor: '#242424',
      scale: 2,
    })
    return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'))
  }

  const handleSaveImage = async () => {
    setShowMenu(false)
    setCapturing(true)
    try {
      const blob = await captureImage()
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ogoo_${record?.id ?? 'receipt'}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[share] 이미지 저장 실패:', err)
      alert('이미지 저장에 실패했어요. 다시 시도해주세요.')
    } finally {
      setCapturing(false)
    }
  }

  const handleShare = async () => {
    setShowMenu(false)
    setCapturing(true)
    try {
      const blob = await captureImage()
      if (!blob) return
      const file = new File([blob], 'ogoo_receipt.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'OGOO' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'ogoo_receipt.png'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return // 사용자가 공유 취소
      console.error('[share] 공유 실패:', err)
      alert('공유에 실패했어요. 다시 시도해주세요.')
    } finally {
      setCapturing(false)
    }
  }

  if (!record) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100dvh', background: '#000' }}>
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  const description = record.title.trim()
    || record.categoryLabel
    || (record.category ? enumToCategoryDisplay(record.category) : '소비')

  const dateObj = new Date(record.consumedAt)
  const dateStr = `${dateObj.getFullYear()}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`
  const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const weekdayStr = WEEKDAYS[dateObj.getDay()]

  return (
    <div className="relative max-w-md mx-auto" style={{ minHeight: '100dvh', background: '#242424' }}>

      {/* X / ··· 버튼 — 캡처 영역 밖 */}
      <div
        className="relative z-30 flex items-center justify-between px-4"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}
      >
        <button onClick={() => router.back()} className="p-2" aria-label="닫기">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <button onClick={() => setShowMenu(v => !v)} className="p-2" aria-label="더보기">
          <svg viewBox="0 0 20 5" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
            <circle cx="2.5" cy="2.5" r="2" fill="white"/>
            <circle cx="10" cy="2.5" r="2" fill="white"/>
            <circle cx="17.5" cy="2.5" r="2" fill="white"/>
          </svg>
        </button>
      </div>

      {/* ── 캡처 영역: 배경 + 카드 + 장식 + 아이콘 ───────────────── */}
      <div ref={captureRef} className="relative" style={{ background: '#242424', paddingTop: 40, paddingBottom: 64, paddingLeft: 28, paddingRight: 28 }}>

        {/* 영수증 카드 */}
        <div className="relative mx-auto" style={{ width: '100%', maxWidth: 320, zIndex: 2 }}>
          <ReceiptShape />

          {/* 핑크 원 — 사진 좌측, 영수증 좌측 끝단 위 */}
          <div
            className="absolute"
            style={{ width: 50, height: 50, borderRadius: '50%', background: '#FFC8B6', left: -22, top: 110, zIndex: 1 }}
          />

          {/* 노란 블롭 — 영수증 우측 끝단에 걸친 느낌 */}
          <div className="absolute" style={{ top: 60, right: -50, zIndex: 3 }}>
            <YellowBlob size={120} />
          </div>

          <div className="relative" style={{ padding: '28px 22px 64px', zIndex: 1 }}>
            {/* OGOO 로고 */}
            <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: 2, color: '#111' }}>OGOO</p>

            {/* 점선 구분선 */}
            <div style={{ borderBottom: '1.5px dashed #C4C4C4', marginTop: 14, marginBottom: 10 }} />

            {/* 날짜 / 요일 */}
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>{dateStr}</span>
              <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>{weekdayStr}</span>
            </div>

            {/* 소비 사진 */}
            <div className="mt-4 mx-auto rounded-lg overflow-hidden bg-gray-100" style={{ width: '100%', aspectRatio: '1', maxWidth: 220 }}>
              {record.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={record.photo} alt={description} className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="w-12 h-12">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              )}
            </div>

            {/* DESCRIPTION / PRC */}
            <div className="flex items-center justify-between mt-5" style={{ fontSize: 10, color: '#999', fontWeight: 700, letterSpacing: 1 }}>
              <span>DESCRIPTION</span>
              <span>PRC</span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{description}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{record.amount.toLocaleString('ko-KR')}</span>
            </div>

            {/* 점선 구분선 */}
            <div style={{ borderBottom: '1.5px dashed #C4C4C4', marginTop: 24, marginBottom: 14 }} />

            {/* TOTAL EMOTION — 감정+키워드 아이콘이 스티커처럼 위치 */}
            <div className="relative" style={{ height: 90 }}>
              <span style={{ fontSize: 10, color: '#999', fontWeight: 700, letterSpacing: 1 }}>TOTAL EMOTION</span>
              {record.keyword && (
                <div
                  className="absolute drop-shadow"
                  style={{ top: -22, right: -8, transform: 'rotate(-8deg)', zIndex: 3 }}
                >
                  <CombinedIcon keyword={record.keyword} temp={record.emotionTemp} showLabel={false} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── ··· 드롭다운 메뉴 ─────────────────────────────────── */}
      {showMenu && (
        <div className="absolute inset-0 z-40" onClick={() => setShowMenu(false)}>
          <div
            className="absolute bg-white rounded-2xl overflow-hidden"
            style={{ top: 'max(calc(env(safe-area-inset-top, 12px) + 48px), 60px)', right: 16, minWidth: 160, boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={handleSaveImage} className="w-full text-left px-5 py-3.5 text-sm font-medium text-gray-900 active:bg-gray-50">
              이미지 저장
            </button>
            <div className="h-px bg-gray-100" />
            <button onClick={handleShare} className="w-full text-left px-5 py-3.5 text-sm font-medium text-gray-900 active:bg-gray-50">
              공유하기
            </button>
          </div>
        </div>
      )}

      {/* 캡처 중 오버레이 */}
      {capturing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <p className="text-sm font-medium text-white">처리 중...</p>
        </div>
      )}
    </div>
  )
}
