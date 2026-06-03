import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { successResponse, errorResponse } from "@/lib/response";

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;
const MAX_SIZE = 50;

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const pageParam = searchParams.get("page");
  const sizeParam = searchParams.get("size");

  let targetDate: Date;
  if (dateParam) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return errorResponse("date must be in YYYY-MM-DD format", 400);
    }
    targetDate = new Date(`${dateParam}T00:00:00Z`);
    if (isNaN(targetDate.getTime())) {
      return errorResponse("date is not a valid date", 400);
    }
  } else {
    targetDate = new Date();
    targetDate.setUTCHours(0, 0, 0, 0);
  }

  const page = pageParam !== null ? parseInt(pageParam) : DEFAULT_PAGE;
  const size = sizeParam !== null ? parseInt(sizeParam) : DEFAULT_SIZE;

  if (!Number.isInteger(page) || isNaN(page) || page < 1) {
    return errorResponse("page must be a positive integer", 400);
  }
  if (!Number.isInteger(size) || isNaN(size) || size < 1 || size > MAX_SIZE) {
    return errorResponse(`size must be an integer between 1 and ${MAX_SIZE}`, 400);
  }

  const dayStart = new Date(targetDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const where = { userId: user.id, consumedAt: { gte: dayStart, lte: dayEnd } };

  const [aggregated, pagedItems] = await Promise.all([
    prisma.consumption.aggregate({
      where,
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.consumption.findMany({
      where,
      orderBy: { consumedAt: "desc" },
      skip: (page - 1) * size,
      take: size,
      select: {
        id: true,
        title: true,
        amount: true,
        category: true,
        keyword: true,
        emotion: true,
        createdAt: true,
        uploadId: true,
      },
    }),
  ]);

  // Resolve thumbnail URLs: list user's storage folder once and match by uploadId prefix
  const pageUploadIds = pagedItems
    .map((c) => c.uploadId)
    .filter((id): id is string => id !== null);

  const thumbnailMap = new Map<string, string>();
  if (pageUploadIds.length > 0) {
    const { data: storageFiles } = await supabaseAdmin.storage
      .from("receipts")
      .list(user.id);

    for (const file of storageFiles ?? []) {
      const fileId = file.name.includes(".")
        ? file.name.slice(0, file.name.lastIndexOf("."))
        : file.name;
      if (pageUploadIds.includes(fileId)) {
        const { data } = supabaseAdmin.storage
          .from("receipts")
          .getPublicUrl(`${user.id}/${file.name}`);
        thumbnailMap.set(fileId, data.publicUrl);
      }
    }
  }

  const items = pagedItems.map((c) => ({
    consumption_id: c.id,
    title: c.title,
    amount: c.amount,
    category: c.category,
    emotion_tag: c.keyword,
    emotion: c.emotion,
    created_at: c.createdAt.toISOString(),
    thumbnail_url: c.uploadId ? (thumbnailMap.get(c.uploadId) ?? null) : null,
  }));

  return successResponse({
    total_count: aggregated._count._all,
    total_amount: aggregated._sum.amount ?? 0,
    page,
    size,
    items,
  });
}
