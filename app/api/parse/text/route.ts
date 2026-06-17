import { NextRequest, NextResponse } from "next/server";
import { parseText } from "@/lib/parser/textParser";
import { apiError, parseJsonBody } from "@/lib/api/routeHelpers";

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (
    typeof body !== "object" ||
    body === null ||
    !("text" in body) ||
    typeof (body as Record<string, unknown>).text !== "string" ||
    !(body as Record<string, string>).text.trim()
  ) {
    return apiError("text 필드가 비어 있거나 없습니다.", 400);
  }

  const text = (body as Record<string, string>).text;
  const result = await parseText(text);
  return NextResponse.json(result);
}
