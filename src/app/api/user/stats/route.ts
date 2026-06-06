import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/response'
import { enumToCategoryDisplay } from '@/lib/mappings'

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
    select: { category: true, emotion: true },
  })

  const total_records = consumptions.length

  // 최다 카테고리
  const catCount: Record<string, number> = {}
  for (const c of consumptions) catCount[c.category] = (catCount[c.category] ?? 0) + 1
  const topCatEnum = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0]

  // 감정 온도(0~100) → 감정 그룹 변환
  function toEmotionGroup(temp: number): string {
    if (temp >= 75) return '기쁨'
    if (temp >= 55) return '애매'
    if (temp >= 35) return '불안'
    if (temp >= 15) return '분노'
    return '슬픔'
  }

  // 최다 감정
  const emoCount: Record<string, number> = {}
  for (const c of consumptions) {
    const group = toEmotionGroup(c.emotion)
    emoCount[group] = (emoCount[group] ?? 0) + 1
  }
  const topEmotion = Object.entries(emoCount).sort((a, b) => b[1] - a[1])[0]?.[0]

  return successResponse({
    total_records,
    top_category: topCatEnum ? enumToCategoryDisplay(topCatEnum) : null,
    top_emotion: topEmotion ?? null,
  })
}
