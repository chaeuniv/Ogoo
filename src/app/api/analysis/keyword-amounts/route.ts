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
    select: { keyword: true, amount: true },
  })

  const keyword_amounts: Record<string, number> = {
    STABLE: 0,
    IMPULSE: 0,
    STRESS: 0,
    REWARD: 0,
  }

  for (const c of consumptions) {
    keyword_amounts[c.keyword] = (keyword_amounts[c.keyword] ?? 0) + c.amount
  }

  const total = Object.values(keyword_amounts).reduce((sum, a) => sum + a, 0)

  return successResponse({ keyword_amounts, total })
}
