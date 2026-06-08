import { NextRequest } from "next/server";
import { Category, Keyword } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { successResponse, errorResponse } from "@/lib/response";

const VALID_CATEGORIES = Object.values(Category);
const VALID_KEYWORDS = Object.values(Keyword);

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}


const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1년

async function resolveReceiptUrl(
  userId: string,
  storedValue: string
): Promise<string | null> {
  // 신형: storedValue가 "{userId}/upload_xxx.jpg" 형태의 전체 경로
  // 구형: storedValue가 "upload_xxx" 형태의 단순 ID → list()로 파일 탐색
  const filePath = storedValue.includes("/")
    ? storedValue
    : await findPathByUploadId(userId, storedValue);

  if (!filePath) return null;

  const { data, error } = await supabaseAdmin.storage
    .from("receipts")
    .createSignedUrl(filePath, SIGNED_URL_TTL);

  if (error) {
    console.error("[resolveReceiptUrl] createSignedUrl error:", error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

async function findPathByUploadId(
  userId: string,
  uploadId: string
): Promise<string | null> {
  const { data: files, error } = await supabaseAdmin.storage
    .from("receipts")
    .list(userId, { search: uploadId });

  if (error) {
    console.error("[findPathByUploadId] list error:", error.message);
    return null;
  }
  const matched = files?.find((f) => f.name.startsWith(uploadId));
  return matched ? `${userId}/${matched.name}` : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ consumption_id: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const { consumption_id } = await params;

  const consumption = await prisma.consumption.findUnique({
    where: { id: consumption_id },
  });

  // Return 404 regardless of whether it exists but belongs to another user
  if (!consumption || consumption.userId !== user.id) {
    return errorResponse("Consumption not found", 404);
  }

  // Resolve receipt URL from storage if uploadId exists
  let receiptUrl: string | null = null;
  if (consumption.uploadId) {
    receiptUrl = await resolveReceiptUrl(user.id, consumption.uploadId);
  }

  return successResponse({
    consumption_id: consumption.id,
    title: consumption.title,
    amount: consumption.amount,
    category: consumption.category,
    category_label: consumption.categoryLabel ?? null,
    emotion_tag: consumption.keyword,
    emotion: consumption.emotion,
    memo: consumption.memo ?? null,
    receipt_url: receiptUrl,
    thumbnail_url: receiptUrl,
    alternatives: [],
    rating: consumption.rating ?? null,
    review_reason: consumption.reviewReason ?? null,
    emotion_resolved: consumption.emotionResolved ?? null,
    consumed_at: consumption.consumedAt.toISOString(),
    created_at: consumption.createdAt.toISOString(),
    updated_at: consumption.updatedAt.toISOString(),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ consumption_id: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const { consumption_id } = await params;

  const existing = await prisma.consumption.findUnique({ where: { id: consumption_id } });
  if (!existing || existing.userId !== user.id) {
    return errorResponse("Consumption not found", 404);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const {
    title, amount, category, category_label, keyword, emotion,
    consumed_at, memo, upload_id, rating, review_reason, emotion_resolved,
  } = body as Record<string, unknown>;

  // 각 필드 검증 (undefined면 그대로 유지)
  if (title !== undefined && (typeof title !== "string" || title.length === 0 || title.length > 50)) {
    return errorResponse("title must be a string of 1–50 characters", 400);
  }
  if (amount !== undefined && (!Number.isInteger(Number(amount)) || Number(amount) < 1)) {
    return errorResponse("amount must be a positive integer", 400);
  }
  if (category !== undefined && !VALID_CATEGORIES.includes(category as Category)) {
    return errorResponse(`category must be one of: ${VALID_CATEGORIES.join(", ")}`, 400);
  }
  if (keyword !== undefined && !VALID_KEYWORDS.includes(keyword as Keyword)) {
    return errorResponse(`keyword must be one of: ${VALID_KEYWORDS.join(", ")}`, 400);
  }
  if (rating !== undefined && rating !== null) {
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return errorResponse("rating must be an integer between 1 and 5", 400);
    }
  }

  const data: Record<string, unknown> = {};
  if (title !== undefined)          data.title         = title;
  if (amount !== undefined)         data.amount        = Number(amount);
  if (category !== undefined)       data.category      = category;
  if (category_label !== undefined)   data.categoryLabel   = category_label ?? null;
  if (keyword !== undefined)          data.keyword         = keyword;
  if (emotion_resolved !== undefined) data.emotionResolved = typeof emotion_resolved === "boolean" ? emotion_resolved : null;
  if (emotion !== undefined)        data.emotion       = Number(emotion);
  if (memo !== undefined)           data.memo          = typeof memo === "string" ? memo : null;
  if (upload_id !== undefined)      data.uploadId      = typeof upload_id === "string" ? upload_id : null;
  if (rating !== undefined)         data.rating        = rating !== null ? Number(rating) : null;
  if (review_reason !== undefined)  data.reviewReason  = typeof review_reason === "string" ? review_reason : null;
  if (consumed_at !== undefined) {
    const d = new Date(consumed_at as string);
    if (isNaN(d.getTime())) return errorResponse("consumed_at must be a valid ISO 8601 date", 400);
    data.consumedAt = d;
  }

  const updated = await prisma.consumption.update({
    where: { id: consumption_id },
    data: data as Parameters<typeof prisma.consumption.update>[0]["data"],
  });

  return successResponse({
    consumption_id: updated.id,
    title: updated.title,
    amount: updated.amount,
    category: updated.category,
    category_label: updated.categoryLabel ?? null,
    emotion_tag: updated.keyword,
    emotion: updated.emotion,
    rating: updated.rating ?? null,
    review_reason: updated.reviewReason ?? null,
    updated_at: updated.updatedAt.toISOString(),
  });
}
