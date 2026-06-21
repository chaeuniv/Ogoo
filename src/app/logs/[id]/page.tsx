'use client'

// 기록 상세 화면
// 진입: DayModal의 [자세히 보기] 버튼 → /logs/[id]
// 구성: 네비게이션 / 사진 + 감정+키워드 아이콘 / 소비 요약 / 메모 / 회고 섹션
// 회고 CASE A: 미완료 + 3일 이하 → 잠금 안내
// 회고 CASE B: 미완료 + 4일+ 경과 → "소비 만족도를 평가해주세요" + [평가하기 >]
// 회고 CASE C: 완료됨 → 이유 타이틀 + 별점

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { authFetch } from '@/lib/api'
import { enumToKeyword, enumToKoreanCategory } from '@/lib/mappings'
import { CombinedIcon, ICON_HANG, ICON_EXTRA_BOTTOM } from './icons'

// ── 날짜 유틸 ─────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - target.getTime()) / 86400000)
}

// ── 별점 컴포넌트 (테두리 없는 채움형) ───────────────────────

function StarRating({
  rating,
  onSelect,
  size = 28,
}: {
  rating: number | null
  onSelect?: (n: number) => void
  size?: number
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onSelect?.(n)}
          disabled={!onSelect}
          className="p-0.5"
          aria-label={`${n}점`}
        >
          <svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={rating !== null && n <= rating ? '#F5F378' : '#E5E7EB'}
              stroke="none"
            />
          </svg>
        </button>
      ))}
    </div>
  )
}

// ── 회고 이유 칩 목록 (별점별) ────────────────────────────────

// 1~3점 → 불만족, 4~5점 → 만족 이유
const SATISFIED_REASONS    = ['기분이 풀렸어', '품질·가성비가 좋아', '갖고 싶었던 거야', '딱 필요했던 거야', '기타']
const DISSATISFIED_REASONS = ['순간 감정에 휩쓸렸어', '품질·가성비가 별로야', '비슷한 게 있었어', '예산을 초과했어', '기타']

const REVIEW_REASONS: Record<number, string[]> = {
  1: DISSATISFIED_REASONS,
  2: DISSATISFIED_REASONS,
  3: DISSATISFIED_REASONS,
  4: SATISFIED_REASONS,
  5: SATISFIED_REASONS,
}

// ── 페이지 ────────────────────────────────────────────────────

interface DetailRecord {
  id: string
  title: string
  category: string | null
  categoryLabel: string | null
  keywordLabel: string | null
  date: string
  photo: string | null
  keyword: string | null
  amount: number
  emotionTemp: number
  memo: string
  rating: number | null
  reviewReason: string | null
  emotionResolved: boolean | null
}

export default function RecordDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()

  const [record, setRecord] = useState<DetailRecord | null>(null)
  const [loading, setLoading] = useState(true)

  // 액션 시트 / 삭제 확인
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!record) return
    setDeleting(true)
    try {
      await authFetch(`/api/consumptions/${record.id}`, { method: 'DELETE' })
    } catch {
      // 삭제 실패해도 화면은 뒤로 이동
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
      router.back()
    }
  }

  // 회고 플로우
  const [isReviewing, setIsReviewing] = useState(false)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [reviewDone, setReviewDone] = useState(false)
  const [savedRating, setSavedRating] = useState<number | null>(null)
  const [savedReason, setSavedReason] = useState<string | null>(null)

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
            date: (d.consumed_at ?? d.created_at).slice(0, 10),
            photo: d.receipt_url ?? null,
            keyword: enumToKeyword(d.emotion_tag, d.keyword_label),
            amount: d.amount,
            emotionTemp: d.emotion,
            memo: d.memo ?? '',
            rating: d.rating ?? null,
            reviewReason: d.review_reason ?? null,
            emotionResolved: d.emotion_resolved ?? null,
          })
          if (d.rating !== null && d.rating !== undefined) {
            setSavedRating(d.rating)
            setSavedReason(d.review_reason ?? null)
            setReviewDone(true)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleSelectRating = (n: number) => {
    setSelectedRating(n)
    setSelectedReason(null)
  }

  const handleReviewConfirm = async () => {
    if (!selectedRating || !record) return
    await authFetch(`/api/consumptions/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        rating: selectedRating,
        review_reason: selectedReason,
      }),
    }).catch(() => {})
    setSavedRating(selectedRating)
    setSavedReason(selectedReason)
    setReviewDone(true)
    setIsReviewing(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center bg-white" style={{ height: '100dvh' }}>
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center bg-white" style={{ height: '100dvh' }}>
        <p className="text-gray-400 text-sm">기록을 찾을 수 없어요</p>
        <button onClick={() => router.back()} className="mt-4 text-sm font-semibold text-gray-700">돌아가기</button>
      </div>
    )
  }

  const days = daysSince(record.date)
  const canReview = days >= 4
  const displayText = record.title.trim() || record.category || '소비 기록'
  const displayDate = record.date.replace(/-/g, '.')

  return (
    <div className="relative flex flex-col max-w-md mx-auto bg-white" style={{ height: '100dvh' }}>

      {/* ── 네비게이션 바 (← 와 ••• 만, 날짜 없음) ─────────────── */}
      <header
        className="flex items-center justify-between px-4 pb-2 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        {/* 뒤로가기 */}
        <button onClick={() => router.back()} className="p-2 -ml-2" aria-label="뒤로가기">
          <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>

        {/* ••• 버튼 (가로 점 3개) */}
        <button onClick={() => setShowActionSheet(true)} className="p-2 -mr-2" aria-label="더보기">
          <svg viewBox="0 0 20 5" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
            <circle cx="2.5"  cy="2.5" r="2" fill="#111"/>
            <circle cx="10"   cy="2.5" r="2" fill="#111"/>
            <circle cx="17.5" cy="2.5" r="2" fill="#111"/>
          </svg>
        </button>
      </header>

      {/* ── 스크롤 본문 ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* 날짜 — 헤더 바로 아래, 중앙 정렬 */}
        <p className="text-sm font-semibold text-gray-700 text-center pt-3 pb-6">
          {displayDate}
        </p>

        {/* 사진 영역 — 정사각형 220px, 중앙 정렬 */}
        {/* 아이콘이 사진 좌하단 바깥으로 오버랩 → 외부 wrapper에 relative */}
        <div className="relative mx-auto" style={{ width: 260 }}>
          {/* 사진 카드 (260×260 정사각형) */}
          <div className="rounded-2xl overflow-hidden bg-gray-100" style={{ width: 260, height: 260 }}>
            {record.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={record.photo} alt={displayText} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="w-14 h-14">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            )}
          </div>

          {/* 감정+키워드 아이콘 — 사진 좌하단에서 아래로 오버랩 */}
          {/* bottom: -ICON_HANG → 아이콘 하단이 사진 하단 아래로 삐져나옴 */}
          {record.keyword && (
            <div
              className="absolute drop-shadow"
              style={{
                bottom: -(ICON_HANG + 16) - (ICON_EXTRA_BOTTOM[record.keyword] ?? 0),
                left: -20,
              }}
            >
              <CombinedIcon keyword={record.keyword} temp={record.emotionTemp} />
            </div>
          )}
        </div>

        {/* 소비 요약 텍스트 — 아이콘 오버랩 공간 + 여백 */}
        <div
          className="px-5 text-center"
          style={{ paddingTop: record.keyword ? ICON_HANG + 32 : 24 }}
        >
          <p className="text-lg font-bold text-gray-900 leading-loose">
            <span style={{ background: '#F5F378', padding: '2px 6px' }}>
              {displayText}
            </span>
            에
            <br />
            <span style={{ background: '#F5F378', padding: '2px 6px' }}>
              {record.amount.toLocaleString('ko-KR')}원
            </span>
            을 소비했어요
          </p>
        </div>

        {/* 메모 — 중앙 정렬 */}
        {record.memo.trim() ? (
          <div className="mx-5 mt-5 rounded-2xl bg-gray-50 px-4 py-3.5 text-center">
            <p className="text-sm text-gray-600 leading-relaxed">{record.memo}</p>
          </div>
        ) : null}

        {/* ── 회고 섹션 ────────────────────────────────────────── */}
        <div className="px-5 pt-8 pb-12 text-center">

          {/* CASE C — 회고 완료 (별점 + 이유 타이틀) */}
          {reviewDone && savedRating !== null ? (
            <div className="flex flex-col items-center gap-3">
              <StarRating rating={savedRating} size={30} />
              {savedReason && (
                <p className="text-base font-bold text-gray-900">{savedReason}</p>
              )}
            </div>

          /* CASE A — 아직 이른 날 (잠금) */
          ) : !canReview ? (
            <p className="text-sm text-gray-400 font-medium">
              기록한 지 4일 후부터 회고할 수 있어요
            </p>

          /* CASE B — 평가 대기 */
          ) : !isReviewing ? (
            <div className="flex items-center justify-center gap-3">
              <p className="text-sm font-medium text-gray-700">소비 만족도를 평가해주세요</p>
              <button
                onClick={() => setIsReviewing(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-xs font-semibold shrink-0"
                style={{ background: '#242424', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              >
                평가하기
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

          /* CASE B — 평가 입력 중 */
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* 별점 선택 */}
              <StarRating rating={selectedRating} onSelect={handleSelectRating} size={36} />

              {/* 이유 칩 — 별점 선택 후 */}
              {selectedRating !== null && (
                <div className="flex flex-wrap justify-center gap-2">
                  {(REVIEW_REASONS[selectedRating] ?? []).map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setSelectedReason((prev) => (prev === reason ? null : reason))}
                      className="rounded-full text-xs font-semibold transition-colors"
                      style={{
                        paddingLeft: 12, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                        background: selectedReason === reason ? '#242424' : 'white',
                        color: selectedReason === reason ? 'white' : '#374151',
                        border: selectedReason === reason ? '1.5px solid #242424' : '1.5px solid #E5E7EB',
                      }}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* 완료 버튼 — 별점 선택 후 하단 고정, 이유 미선택 시 비활성 */}
      {isReviewing && selectedRating !== null && (
        <button
          onClick={handleReviewConfirm}
          disabled={!selectedReason}
          className="w-full py-5 bg-black text-white text-base font-semibold shrink-0 disabled:opacity-30"
        >
          완료
        </button>
      )}

      {/* ── 액션 시트 ─────────────────────────────────────────── */}
      {showActionSheet && (
        <div
          className="absolute inset-0 z-40 flex items-end"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowActionSheet(false)}
        >
          <div className="w-full bg-white rounded-t-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mt-3 mb-4" />

            {[
              {
                label: '수정하기',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                ),
                onClick: () => {
                  setShowActionSheet(false)
                  // 수정 모드: 기존 데이터 전체를 sessionStorage에 저장 후 step2로 진입
                  sessionStorage.setItem('editRecordId', record.id)
                  if (record.photo) sessionStorage.setItem('presetPhoto', record.photo)
                  sessionStorage.setItem('presetEditData', JSON.stringify({
                    category:        record.categoryLabel ?? enumToKoreanCategory(record.category ?? 'OTHER'),
                    amount:          String(record.amount),
                    description:     record.title,
                    keyword:         record.keywordLabel ?? record.keyword,
                    emotionTemp:     record.emotionTemp,
                    memo:            record.memo,
                    recordDate:      record.date,
                    emotionResolved: record.emotionResolved,
                  }))
                  router.push('/record/step2')
                },
                danger: false,
              },
              {
                label: '삭제하기',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                ),
                onClick: () => { setShowActionSheet(false); setShowDeleteModal(true) },
                danger: true,
              },
              {
                label: '공유하기',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                ),
                onClick: () => {
                  setShowActionSheet(false)
                  router.push(`/logs/${record.id}/share`)
                },
                danger: false,
              },
            ].map(({ label, icon, onClick, danger }) => (
              <button
                key={label}
                onClick={onClick}
                className="w-full flex items-center gap-4 px-6 py-4 active:bg-gray-50 transition-colors"
              >
                {icon}
                <span className={`text-base font-medium ${danger ? 'text-red-500' : 'text-gray-900'}`}>
                  {label}
                </span>
              </button>
            ))}

            <div className="h-px bg-gray-100 mx-6 my-1" />

            <button
              onClick={() => setShowActionSheet(false)}
              className="w-full px-6 py-4 text-base font-semibold text-gray-400 active:bg-gray-50"
            >
              취소
            </button>

            <div style={{ height: 'max(env(safe-area-inset-bottom, 0px), 16px)' }} />
          </div>
        </div>
      )}

      {/* ── 삭제 확인 모달 ───────────────────────────────────── */}
      {showDeleteModal && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center px-8"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full bg-white rounded-3xl px-6 py-7 flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-bold text-gray-900">정말 삭제할까요?</p>
            <p className="text-sm text-gray-400 text-center leading-relaxed">
              이 소비 기록은 복구할 수 없어요
            </p>
            <div className="flex gap-2 w-full mt-1">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3.5 rounded-2xl bg-gray-900 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
