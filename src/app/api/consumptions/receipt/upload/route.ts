import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { successResponse, errorResponse } from "@/lib/response";

const VALID_SOURCES = ["CAMERA", "GALLERY"] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const VALID_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"];
const OCR_SUPPORTED_TYPES = ["image/jpeg", "image/png"] as const;

type OcrSupportedMime = (typeof OCR_SUPPORTED_TYPES)[number];

function normalizeImageMime(mimeType: string): string {
  return mimeType === "image/jpg" ? "image/jpeg" : mimeType;
}

interface OcrResult {
  title: string;
  amount: number;
  date: string;
  items: { name: string; price: number }[];
}

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function performOcr(buffer: Buffer, mimeType: string): Promise<OcrResult> {
  const empty: OcrResult = { title: "", amount: 0, date: "", items: [] };

  const normalizedMime = normalizeImageMime(mimeType);
  if (!OCR_SUPPORTED_TYPES.includes(normalizedMime as OcrSupportedMime)) return empty;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: normalizedMime as OcrSupportedMime,
              data: buffer.toString("base64"),
            },
          },
          {
            type: "text",
            text: `이 영수증 이미지를 분석하여 아래 JSON만 반환해주세요 (설명 없이 순수 JSON만):
{
  "title": "상호명",
  "amount": 총결제금액(정수),
  "date": "YYYY-MM-DD",
  "items": [{"name": "품목명", "price": 가격(정수)}]
}
인식 불가 필드: title/date는 "", amount/price는 0`,
          },
        ],
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") return empty;

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return empty;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: typeof parsed.title === "string" ? parsed.title : "",
      amount: Number.isInteger(parsed.amount) ? parsed.amount : (parseInt(parsed.amount) || 0),
      date: typeof parsed.date === "string" ? parsed.date : "",
      items: Array.isArray(parsed.items)
        ? parsed.items.map((item: { name?: unknown; price?: unknown }) => ({
            name: typeof item.name === "string" ? item.name : "",
            price: Number.isInteger(item.price)
              ? item.price
              : (parseInt(String(item.price)) || 0),
          }))
        : [],
    };
  } catch {
    return empty;
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return errorResponse("Unauthorized", 401);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return errorResponse("Invalid multipart/form-data", 400);
  }

  const imageField = formData.get("image");
  const sourceField = formData.get("source");

  if (!imageField || !(imageField instanceof File)) {
    return errorResponse("image is required", 400);
  }

  if (!sourceField || typeof sourceField !== "string") {
    return errorResponse("source is required", 400);
  }

  if (!VALID_SOURCES.includes(sourceField as (typeof VALID_SOURCES)[number])) {
    return errorResponse(`source must be one of: ${VALID_SOURCES.join(", ")}`, 400);
  }

  const mimeType = imageField.type.toLowerCase();
  if (!VALID_MIME_TYPES.includes(mimeType)) {
    return errorResponse("image must be jpeg, png, or heic", 400);
  }

  if (imageField.size > MAX_FILE_SIZE) {
    return errorResponse("image must be less than 10MB", 400);
  }

  const uploadId = `upload_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const ext = imageField.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${user.id}/${uploadId}.${ext}`;

  const buffer = Buffer.from(await imageField.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from("receipts")
    .upload(filePath, buffer, { contentType: imageField.type, upsert: false });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return errorResponse("Failed to upload image", 500);
  }

  const { data: urlData } = supabaseAdmin.storage.from("receipts").getPublicUrl(filePath);

  const ocrResult: OcrResult = { title: "", amount: 0, date: "", items: [] };

  // upload_id에 전체 경로를 저장해 조회 시 list() 없이 바로 signed URL 생성 가능
  return successResponse({
    upload_id: filePath,
    receipt_url: urlData.publicUrl,
    ocr_result: ocrResult,
  });
}
