import { Router, Request, Response } from "express";
import { Category, Keyword } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../lib/response";

const router = Router();

const CATEGORIES = Object.values(Category);
const KEYWORDS = Object.values(Keyword);

router.post("/", authenticate, async (req: Request, res: Response) => {
  const { title, amount, category, keyword, emotion, consumed_at, memo, upload_id } = req.body;
  const userId = req.user!.userId;

  // 필수 필드 검증
  const missing = (["title", "amount", "category", "keyword", "emotion"] as const)
    .filter((f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === "");
  if (missing.length > 0) {
    errorResponse(res, 400, "INVALID_REQUEST", `필수 파라미터가 없습니다: ${missing.join(", ")}`);
    return;
  }

  if (typeof title !== "string" || title.length > 50) {
    errorResponse(res, 400, "INVALID_REQUEST", "title은 50자 이하의 문자열이어야 합니다.");
    return;
  }

  const amountNum = Number(amount);
  if (!Number.isInteger(amountNum) || amountNum < 1) {
    errorResponse(res, 400, "INVALID_REQUEST", "amount는 1 이상의 정수여야 합니다.");
    return;
  }

  if (!CATEGORIES.includes(category)) {
    errorResponse(res, 400, "INVALID_REQUEST", `category는 ${CATEGORIES.join(", ")} 중 하나여야 합니다.`);
    return;
  }

  if (!KEYWORDS.includes(keyword)) {
    errorResponse(res, 400, "INVALID_REQUEST", `keyword는 ${KEYWORDS.join(", ")} 중 하나여야 합니다.`);
    return;
  }

  const emotionNum = Number(emotion);
  if (!Number.isInteger(emotionNum)) {
    errorResponse(res, 400, "INVALID_REQUEST", "emotion은 정수여야 합니다.");
    return;
  }

  if (memo !== undefined && (typeof memo !== "string" || memo.length > 200)) {
    errorResponse(res, 400, "INVALID_REQUEST", "memo는 200자 이하의 문자열이어야 합니다.");
    return;
  }

  let consumedAt: Date | undefined;
  if (consumed_at !== undefined) {
    consumedAt = new Date(consumed_at);
    if (isNaN(consumedAt.getTime())) {
      errorResponse(res, 400, "INVALID_REQUEST", "consumed_at은 유효한 ISO 8601 형식이어야 합니다.");
      return;
    }
  }

  const consumption = await prisma.consumption.create({
    data: {
      userId,
      title,
      amount: amountNum,
      category: category as Category,
      keyword: keyword as Keyword,
      emotion: emotionNum,
      consumedAt: consumedAt ?? new Date(),
      memo: memo ?? null,
      uploadId: upload_id ?? null,
    },
  });

  successResponse(
    res,
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
});

export default router;
