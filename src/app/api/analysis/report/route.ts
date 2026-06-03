import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/response'

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
    select: { id: true, title: true, category: true, amount: true, keyword: true, emotion: true, consumedAt: true },
    orderBy: { amount: 'desc' },
  })

  // Slide 1 — 키워드별 금액 합계
  const keyword_amounts: Record<string, number> = { STABLE: 0, IMPULSE: 0, STRESS: 0, REWARD: 0 }
  for (const c of consumptions) {
    keyword_amounts[c.keyword] = (keyword_amounts[c.keyword] ?? 0) + c.amount
  }

  // Slide 2 — 금액 Top 3
  const top3_by_amount = consumptions.slice(0, 3).map(c => ({
    id: c.id,
    title: c.title,
    category: c.category as string,
    amount: c.amount,
    keyword: c.keyword as string,
    emotion: c.emotion,
    consumed_at: c.consumedAt.toISOString(),
  }))

  // Slide 3 — 합리적(STABLE) vs 충동·스트레스(IMPULSE+STRESS) 건수
  const stable_count = consumptions.filter(c => c.keyword === 'STABLE').length
  const negative_count = consumptions.filter(c => c.keyword === 'IMPULSE' || c.keyword === 'STRESS').length

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

  // Slide 5 — 스트레스·충동 소비 건수 (부정 감정 소비 대체)
  const stress_count = consumptions.filter(c => c.keyword === 'STRESS' || c.keyword === 'IMPULSE').length
  const total = Object.values(keyword_amounts).reduce((sum, a) => sum + a, 0)

  return successResponse({ keyword_amounts, top3_by_amount, stable_count, negative_count, emotion_groups, stress_count, total })
}
