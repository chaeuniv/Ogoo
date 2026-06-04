import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { successResponse, errorResponse } from '@/lib/response'

const BUCKET = 'receipts'
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 // 1년

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

// GET: 현재 프로필 사진 signed URL 반환
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return errorResponse('Unauthorized', 401)

  const avatarPath = user.user_metadata?.avatar_path as string | undefined
  if (!avatarPath) return successResponse({ signed_url: null })

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(avatarPath, SIGNED_URL_TTL)

  if (error) return successResponse({ signed_url: null })
  return successResponse({ signed_url: data.signedUrl })
}

// POST: 프로필 사진 업로드 후 user_metadata.avatar_path 업데이트
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return errorResponse('Unauthorized', 401)

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return errorResponse('Invalid multipart/form-data', 400)
  }

  const imageField = formData.get('image')
  if (!imageField || !(imageField instanceof File)) {
    return errorResponse('image is required', 400)
  }

  const ext = imageField.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filePath = `avatars/${user.id}/profile.${ext}`
  const buffer = Buffer.from(await imageField.arrayBuffer())

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: imageField.type, upsert: true })

  if (uploadError) {
    console.error('[user/photo POST] upload error:', uploadError.message)
    return errorResponse('Failed to upload photo', 500)
  }

  // user_metadata에 경로 저장
  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, avatar_path: filePath },
  })

  const { data } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL)

  return successResponse({ signed_url: data?.signedUrl ?? null })
}
