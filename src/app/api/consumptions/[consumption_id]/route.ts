import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { successResponse, errorResponse } from "@/lib/response";

interface Alternative {
  title: string;
  estimated_save: number;
}

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function generateAlternatives(
  title: string,
  amount: number,
  category: string
): Promise<Alternative[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `사용자가 "${title}"을(를) ${amount}원에 구매했습니다. (카테고리: ${category})
이 소비를 대체할 수 있는 더 저렴한 대안 2~3개를 JSON 배열만 반환해주세요 (설명 없이):
[{"title": "대안명", "estimated_save": 절약금액(정수)}]
estimated_save는 양수이며 ${amount}원 이하여야 합니다.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") return [];

  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed: unknown[] = JSON.parse(jsonMatch[0]);
    return parsed
      .filter(
        (item): item is { title: string; estimated_save: number } =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).title === "string" &&
          typeof (item as Record<string, unknown>).estimated_save === "number"
      )
      .map((item) => ({
        title: item.title,
        estimated_save: Math.max(0, Math.min(Math.round(item.estimated_save), amount)),
      }));
  } catch {
    return [];
  }
}

async function resolveReceiptUrl(
  userId: string,
  uploadId: string
): Promise<string | null> {
  const { data: files } = await supabaseAdmin.storage
    .from("receipts")
    .list(userId);

  const matched = (files ?? []).find((f) => {
    const fileId = f.name.includes(".")
      ? f.name.slice(0, f.name.lastIndexOf("."))
      : f.name;
    return fileId === uploadId;
  });

  if (!matched) return null;

  const { data } = supabaseAdmin.storage
    .from("receipts")
    .getPublicUrl(`${userId}/${matched.name}`);

  return data.publicUrl;
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

  // Generate AI alternatives (graceful degradation on failure)
  let alternatives: Alternative[] = [];
  try {
    alternatives = await generateAlternatives(
      consumption.title,
      consumption.amount,
      consumption.category
    );
  } catch (err) {
    console.error("Alternatives generation error:", err);
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
    alternatives,
    created_at: consumption.createdAt.toISOString(),
    updated_at: consumption.updatedAt.toISOString(),
  });
}
