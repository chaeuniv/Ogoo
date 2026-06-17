import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/response";

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
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  if (!yearParam || !monthParam) {
    return errorResponse("year and month are required", 400);
  }

  const year = parseInt(yearParam);
  const month = parseInt(monthParam);

  if (!Number.isInteger(year) || isNaN(year) || year < 1) {
    return errorResponse("year must be a valid integer", 400);
  }

  if (!Number.isInteger(month) || isNaN(month) || month < 1 || month > 12) {
    return errorResponse("month must be an integer between 1 and 12", 400);
  }

  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startOfNextMonth = new Date(Date.UTC(year, month, 1));

  const consumptions = await prisma.consumption.findMany({
    where: {
      userId: user.id,
      consumedAt: { gte: startOfMonth, lt: startOfNextMonth },
    },
    select: { amount: true, keyword: true, keywordLabel: true, consumedAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by YYYY-MM-DD
  const dateMap = new Map<string, { totalAmount: number; keywords: string[] }>();

  for (const c of consumptions) {
    const dateStr = c.consumedAt.toISOString().slice(0, 10);
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { totalAmount: 0, keywords: [] });
    }
    const entry = dateMap.get(dateStr)!;
    entry.totalAmount += c.amount;
    // STABLE은 keywordLabel(소확행 / 합리적 소비 / 잘 모르겠어요)에 따라
    // 캘린더 도트 색상도 구분되도록 세부 버킷으로 분리
    let displayKeyword: string = c.keyword;
    if (c.keyword === 'STABLE') {
      if (c.keywordLabel === '소확행') displayKeyword = 'SOHWAENG';
      else if (c.keywordLabel === '잘 모르겠어요') displayKeyword = 'UNSURE';
      else displayKeyword = 'STABLE';
    }
    entry.keywords.push(displayKeyword);
  }

  let monthlyTotal = 0;
  for (const entry of dateMap.values()) {
    monthlyTotal += entry.totalAmount;
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const days = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const entry = dateMap.get(dateStr);

    if (entry && entry.keywords.length > 0) {
      const keywordCounts = new Map<string, number>();
      for (const kw of entry.keywords) {
        keywordCounts.set(kw, (keywordCounts.get(kw) ?? 0) + 1);
      }

      let dominantKeyword: string | null = null;
      let maxCount = 0;
      for (const [kw, count] of keywordCounts) {
        if (count > maxCount) {
          maxCount = count;
          dominantKeyword = kw;
        }
      }

      days.push({
        date: dateStr,
        total_amount: entry.totalAmount,
        consumption_count: entry.keywords.length,
        dominant_emotion: dominantKeyword,
        has_record: true,
      });
    } else {
      days.push({
        date: dateStr,
        total_amount: 0,
        consumption_count: 0,
        dominant_emotion: null,
        has_record: false,
      });
    }
  }

  return successResponse({ year, month, monthly_total: monthlyTotal, days });
}
