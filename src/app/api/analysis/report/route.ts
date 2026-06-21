import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { successResponse, errorResponse } from '@/lib/response'

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 // 1년

// uploadId(= filePath 전체 or 구형 ID)로 signed URL 생성 — /api/home/consumptions/today 와 동일한 로직
async function resolveThumbnailUrl(userId: string, storedValue: string | null): Promise<string | null> {
  if (!storedValue) return null

  let filePath = storedValue.includes('/') ? storedValue : null
  if (!filePath) {
    const { data: files } = await supabaseAdmin.storage
      .from('receipts')
      .list(userId, { search: storedValue })
    const matched = files?.find((f) => f.name.startsWith(storedValue))
    filePath = matched ? `${userId}/${matched.name}` : null
  }
  if (!filePath) return null

  const { data } = await supabaseAdmin.storage
    .from('receipts')
    .createSignedUrl(filePath, SIGNED_URL_TTL)

  return data?.signedUrl ?? null
}

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

function emotionToIconIdx(emotion: number): 0 | 1 | 2 | 3 | 4 {
  if (emotion >= 80) return 0
  if (emotion >= 60) return 1
  if (emotion >= 40) return 2
  if (emotion >= 20) return 3
  return 4
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!startDate || !endDate) {
    return errorResponse('startDate and endDate are required', 400)
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return errorResponse('Dates must be in YYYY-MM-DD format', 400)
  }

  const start = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T23:59:59.999Z`)

  const consumptions = await prisma.consumption.findMany({
    where: { userId: user.id, consumedAt: { gte: start, lte: end } },
    select: { id: true, title: true, category: true, amount: true, keyword: true, keywordLabel: true, emotion: true, consumedAt: true, rating: true, emotionResolved: true, uploadId: true },
    orderBy: { amount: 'desc' },
  })

  // Slide 1 — 키워드별 금액 합계
  // STABLE은 keywordLabel(소확행 / 합리적 소비 / 잘 모르겠어요)에 따라 세부 버킷으로 분리
  const keyword_amounts: Record<string, number> = { STABLE: 0, IMPULSE: 0, STRESS: 0, REWARD: 0, SOHWAENG: 0, UNSURE: 0 }
  for (const c of consumptions) {
    let bucket: string = c.keyword
    if (c.keyword === 'STABLE') {
      if (c.keywordLabel === '소확행') bucket = 'SOHWAENG'
      else if (c.keywordLabel === '잘 모르겠어요') bucket = 'UNSURE'
      else bucket = 'STABLE'
    }
    keyword_amounts[bucket] = (keyword_amounts[bucket] ?? 0) + c.amount
  }

  // Slide 2 — 만족 소비 Top 3 (rating>=4, 별점 동점 시 금액 내림차순)
  const top3Raw = consumptions
    .filter(c => c.rating !== null && c.rating >= 4)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.amount - a.amount)
    .slice(0, 3)

  const top3_by_amount = await Promise.all(
    top3Raw.map(async c => ({
      id: c.id,
      title: c.title,
      category: c.category as string,
      amount: c.amount,
      keyword: c.keyword as string,
      emotion: c.emotion,
      consumed_at: c.consumedAt.toISOString(),
      thumbnail_url: await resolveThumbnailUrl(user.id, c.uploadId),
    }))
  )

  // Slide 3 — 후회없는(rating>=4) vs 후회가 남는(rating<=2) 건수
  const stable_count = consumptions.filter(c => c.rating !== null && c.rating >= 4).length
  const negative_count = consumptions.filter(c => c.rating !== null && c.rating <= 2).length

  // Slide 4 — 감정 온도(0~100) → 5단계 아이콘별 금액 합계
  const emoTotals: Partial<Record<0 | 1 | 2 | 3 | 4, number>> = {}
  for (const c of consumptions) {
    const idx = emotionToIconIdx(c.emotion)
    emoTotals[idx] = (emoTotals[idx] ?? 0) + c.amount
  }
  const emotion_groups = ([0, 1, 2, 3, 4] as const)
    .filter(idx => (emoTotals[idx] ?? 0) > 0)
    .map(idx => ({ icon_idx: idx, total: emoTotals[idx]! }))
    .sort((a, b) => b.total - a.total)

  // Slide 5 — 부정 감정(emotion<55) 소비 건수 + 감정 해소 비율
  const negativeEmotionList = consumptions.filter(c => c.emotion < 55)
  const stress_count = negativeEmotionList.length
  const resolved_percent = stress_count > 0
    ? Math.round(negativeEmotionList.filter(c => c.emotionResolved === true).length / stress_count * 100)
    : 0

  const total = Object.values(keyword_amounts).reduce((sum, a) => sum + a, 0)

  return successResponse({ keyword_amounts, top3_by_amount, stable_count, negative_count, emotion_groups, stress_count, resolved_percent, total })
}
