import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { successResponse, errorResponse } from "@/lib/response";

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
    emotion_tag: consumption.keyword,
    emotion: consumption.emotion,
    memo: consumption.memo ?? null,
    receipt_url: receiptUrl,
    thumbnail_url: receiptUrl,
    alternatives: [],
    created_at: consumption.createdAt.toISOString(),
    updated_at: consumption.updatedAt.toISOString(),
  });
}
