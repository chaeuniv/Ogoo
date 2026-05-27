import { NextRequest } from "next/server";
import { Keyword } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";
import { getAuthUser } from "@/lib/auth-server";

// TODO: Replace with user-configurable budget when a settings model is added
const WEEKLY_BUDGET = 150000;

type AlertLevel = "SAFE" | "CAUTION" | "WARNING" | "DANGER";

function getWeekBounds(referenceDate: Date): { start: Date; end: Date } {
  const day = referenceDate.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(referenceDate);
  start.setUTCDate(referenceDate.getUTCDate() + daysToMonday);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getAlertLevel(usedRate: number): AlertLevel {
  if (usedRate < 50) return "SAFE";
  if (usedRate < 75) return "CAUTION";
  if (usedRate < 90) return "WARNING";
  return "DANGER";
}

function getAlertMessage(level: AlertLevel, usedRate: number): string {
  const pct = Math.round(usedRate);
  switch (level) {
    case "SAFE":
      return "이번 주 소비가 예산 내에서 잘 관리되고 있어요.";
    case "CAUTION":
      return `이번 주 예산의 ${pct}%를 사용했어요. 남은 기간을 고려해 소비 속도를 조절해 보세요.`;
    case "WARNING":
      return `이번 주 예산의 ${pct}%를 사용했어요. 소비를 줄이는 것을 권장해요.`;
    case "DANGER":
      return `이번 주 예산의 ${pct}%를 사용했어요. 소비를 즉시 줄여야 해요.`;
  }
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const referenceDateParam = searchParams.get("reference_date");

  let referenceDate: Date;
  if (referenceDateParam) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(referenceDateParam)) {
      return errorResponse("reference_date must be in YYYY-MM-DD format", 400);
    }
    referenceDate = new Date(`${referenceDateParam}T00:00:00Z`);
    if (isNaN(referenceDate.getTime())) {
      return errorResponse("reference_date is not a valid date", 400);
    }
  } else {
    referenceDate = new Date();
    referenceDate.setUTCHours(0, 0, 0, 0);
  }

  const { start: weekStart, end: weekEnd } = getWeekBounds(referenceDate);

  const consumptions = await prisma.consumption.findMany({
    where: {
      userId: user.id,
      consumedAt: { gte: weekStart, lte: weekEnd },
    },
    select: { amount: true, keyword: true },
  });

  const weeklyTotal = consumptions.reduce((sum, c) => sum + c.amount, 0);

  const impulseItems = consumptions.filter((c) => c.keyword === Keyword.IMPULSE);
  const impulseCount = impulseItems.length;
  const impulseAmount = impulseItems.reduce((sum, c) => sum + c.amount, 0);

  // Round to 1 decimal place
  const budgetUsedRate = Math.round((weeklyTotal / WEEKLY_BUDGET) * 1000) / 10;
  const alertLevel = getAlertLevel(budgetUsedRate);
  const alertMessage = getAlertMessage(alertLevel, budgetUsedRate);

  return successResponse({
    week_start: toDateString(weekStart),
    week_end: toDateString(weekEnd),
    weekly_total: weeklyTotal,
    weekly_budget: WEEKLY_BUDGET,
    budget_used_rate: budgetUsedRate,
    alert_level: alertLevel,
    alert_message: alertMessage,
    impulse_count: impulseCount,
    impulse_amount: impulseAmount,
  });
}
