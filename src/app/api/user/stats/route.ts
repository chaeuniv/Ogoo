import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/response'
import { enumToKeyword, enumToCategoryDisplay } from '@/lib/mappings'

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

  const consumptions = await prisma.consumption.findMany({
    where: { userId: user.id },
    select: { category: true, keyword: true },
  })

  const total_records = consumptions.length

  // 최다 카테고리
  const catCount: Record<string, number> = {}
  for (const c of consumptions) catCount[c.category] = (catCount[c.category] ?? 0) + 1
  const topCatEnum = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0]

  // 최다 감정 키워드
  const kwCount: Record<string, number> = {}
  for (const c of consumptions) kwCount[c.keyword] = (kwCount[c.keyword] ?? 0) + 1
  const topKwEnum = Object.entries(kwCount).sort((a, b) => b[1] - a[1])[0]?.[0]

  return successResponse({
    total_records,
    top_category: topCatEnum ? enumToCategoryDisplay(topCatEnum) : null,
    top_emotion: topKwEnum ? enumToKeyword(topKwEnum) : null,
  })
}
