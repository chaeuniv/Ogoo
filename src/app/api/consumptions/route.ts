import { NextRequest } from "next/server";
import { Category, Keyword } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";
import { getAuthUser } from "@/lib/auth-server";

const VALID_CATEGORIES = Object.values(Category);
const VALID_KEYWORDS = Object.values(Keyword);

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const { title, amount, category, keyword, emotion, consumed_at, memo, upload_id } =
    body as Record<string, unknown>;

  // 필수 필드 검증
  if (!title || amount === undefined || !category || !keyword || emotion === undefined) {
    return errorResponse("Missing required fields", 400);
  }

  if (typeof title !== "string" || title.length === 0 || title.length > 50) {
    return errorResponse("title must be a string of 1–50 characters", 400);
  }

  const amountNum = Number(amount);
  if (!Number.isInteger(amountNum) || amountNum < 1) {
    return errorResponse("amount must be a positive integer", 400);
  }

  if (!VALID_CATEGORIES.includes(category as Category)) {
    return errorResponse(`category must be one of: ${VALID_CATEGORIES.join(", ")}`, 400);
  }

  if (!VALID_KEYWORDS.includes(keyword as Keyword)) {
    return errorResponse(`keyword must be one of: ${VALID_KEYWORDS.join(", ")}`, 400);
  }

  const emotionNum = Number(emotion);
  if (!Number.isInteger(emotionNum)) {
    return errorResponse("emotion must be an integer", 400);
  }

  if (memo !== undefined && (typeof memo !== "string" || memo.length > 200)) {
    return errorResponse("memo must be a string of up to 200 characters", 400);
  }

  const consumedAt = consumed_at ? new Date(consumed_at as string) : new Date();
  if (isNaN(consumedAt.getTime())) {
    return errorResponse("consumed_at must be a valid ISO 8601 date", 400);
  }

  try {
    const consumption = await prisma.consumption.create({
      data: {
        userId: user.id,
        title,
        amount: amountNum,
        category: category as Category,
        keyword: keyword as Keyword,
        emotion: emotionNum,
        consumedAt,
        memo: typeof memo === "string" ? memo : null,
        uploadId: typeof upload_id === "string" ? upload_id : null,
      },
    });

    return successResponse(
      {
        consumption_id: consumption.id,
        title: consumption.title,
        amount: consumption.amount,
        category: consumption.category,
        keyword: consumption.keyword,
        emotion: consumption.emotion,
        created_at: consumption.createdAt.toISOString(),
      },
      201
    );
  } catch (error) {
      console.error("🔴 상세 에러:", error);
    return errorResponse("Internal server error", 500);
  }
}
