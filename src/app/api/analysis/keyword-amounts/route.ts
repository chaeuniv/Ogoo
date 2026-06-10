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

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return errorResponse('Invalid date values', 400)
  }

  const consumptions = await prisma.consumption.findMany({
    where: {
      userId: user.id,
      consumedAt: { gte: start, lte: end },
    },
    select: { keyword: true, keywordLabel: true, amount: true },
  })

  const keyword_amounts: Record<string, number> = {
    STABLE: 0,    // 합리적 소비
    IMPULSE: 0,
    STRESS: 0,
    REWARD: 0,
    SOHWAENG: 0,  // 소확행 (DB에는 STABLE로 저장되지만 keywordLabel로 구분)
    UNSURE: 0,    // 잘 모르겠어요 (DB에는 STABLE로 저장되지만 keywordLabel로 구분)
  }

  for (const c of consumptions) {
    // STABLE은 keywordLabel(소확행 / 합리적 소비 / 잘 모르겠어요)에 따라 세부 버킷으로 분리
    let bucket: string = c.keyword
    if (c.keyword === 'STABLE') {
      if (c.keywordLabel === '소확행') bucket = 'SOHWAENG'
      else if (c.keywordLabel === '잘 모르겠어요') bucket = 'UNSURE'
      else bucket = 'STABLE' // 합리적 소비 (또는 라벨 없음)
    }
    keyword_amounts[bucket] = (keyword_amounts[bucket] ?? 0) + c.amount
  }

  const total = Object.values(keyword_amounts).reduce((sum, a) => sum + a, 0)

  return successResponse({ keyword_amounts, total })
}
