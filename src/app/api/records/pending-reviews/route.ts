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

const SIGNED_URL_TTL = 60 * 60 * 24 * 365;

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  // 4일 이상 경과 기준일
  const cutoff = new Date();
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(cutoff.getUTCDate() - 4);

  const items = await prisma.consumption.findMany({
    where: {
      userId: user.id,
      rating: null,
      consumedAt: { lte: cutoff },
    },
    orderBy: { consumedAt: "asc" },
    take: 3,
    select: {
      id: true,
      title: true,
      category: true,
      categoryLabel: true,
      consumedAt: true,
      uploadId: true,
    },
  });

  const result = await Promise.all(
    items.map(async (c) => {
      let thumbnail_url: string | null = null;
      if (c.uploadId) {
        let filePath = c.uploadId.includes("/") ? c.uploadId : null;
        if (!filePath) {
          const { data: files } = await supabaseAdmin.storage
            .from("receipts")
            .list(user.id, { search: c.uploadId });
          const matched = files?.find((f) => f.name.startsWith(c.uploadId!));
          filePath = matched ? `${user.id}/${matched.name}` : null;
        }
        if (filePath) {
          const { data } = await supabaseAdmin.storage
            .from("receipts")
            .createSignedUrl(filePath, SIGNED_URL_TTL);
          thumbnail_url = data?.signedUrl ?? null;
        }
      }
      return {
        id: c.id,
        title: c.title,
        category_label: c.categoryLabel ?? c.category,
        consumed_at: c.consumedAt.toISOString().slice(0, 10),
        thumbnail_url,
      };
    })
  );

  return successResponse({ items: result });
}
