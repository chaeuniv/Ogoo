import { NextRequest } from "next/server";
import { Category, Keyword } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/response";

// TODO: Replace with user-configurable budget when a settings model is added
const DAILY_BUDGET = 50000;

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

  const dayStart = new Date(targetDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const yesterdayStart = new Date(dayStart);
  yesterdayStart.setUTCDate(dayStart.getUTCDate() - 1);
  const yesterdayEnd = new Date(dayEnd);
  yesterdayEnd.setUTCDate(dayEnd.getUTCDate() - 1);

  const [todayConsumptions, yesterdayConsumptions] = await Promise.all([
    prisma.consumption.findMany({
      where: { userId: user.id, consumedAt: { gte: dayStart, lte: dayEnd } },
      select: { amount: true, keyword: true, category: true },
    }),
    prisma.consumption.findMany({
      where: { userId: user.id, consumedAt: { gte: yesterdayStart, lte: yesterdayEnd } },
      select: { amount: true },
    }),
  ]);

  const totalAmount = todayConsumptions.reduce((sum, c) => sum + c.amount, 0);
  const yesterdayTotal = yesterdayConsumptions.reduce((sum, c) => sum + c.amount, 0);

  const budgetUsedRate = Math.round((totalAmount / DAILY_BUDGET) * 1000) / 10;

  // All keywords present, defaulting to 0
  const emotionBreakdown: Record<string, number> = {
    [Keyword.STABLE]: 0,
    [Keyword.IMPULSE]: 0,
    [Keyword.STRESS]: 0,
    [Keyword.REWARD]: 0,
  };
  for (const c of todayConsumptions) {
    emotionBreakdown[c.keyword]++;
  }

  // Only categories with amount > 0, sorted descending
  const categoryMap = new Map<Category, number>();
  for (const c of todayConsumptions) {
    categoryMap.set(c.category, (categoryMap.get(c.category) ?? 0) + c.amount);
  }
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      rate: totalAmount > 0 ? Math.round((amount / totalAmount) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const diffAmount = Math.abs(totalAmount - yesterdayTotal);
  const direction =
    totalAmount > yesterdayTotal ? "UP" : totalAmount < yesterdayTotal ? "DOWN" : "SAME";

  return successResponse({
    date: dayStart.toISOString().slice(0, 10),
    total_amount: totalAmount,
    consumption_count: todayConsumptions.length,
    budget_limit: DAILY_BUDGET,
    budget_used_rate: budgetUsedRate,
    emotion_breakdown: emotionBreakdown,
    category_breakdown: categoryBreakdown,
    compared_to_yesterday: {
      diff_amount: diffAmount,
      direction,
    },
  });
}
