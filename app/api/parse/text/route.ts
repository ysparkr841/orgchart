import { NextRequest, NextResponse } from "next/server";
import { parseText } from "@/lib/parser/textParser";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON 파싱 실패" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("text" in body) ||
    typeof (body as Record<string, unknown>).text !== "string" ||
    !(body as Record<string, string>).text.trim()
  ) {
    return NextResponse.json(
      { error: "text 필드가 비어 있거나 없습니다." },
      { status: 400 },
    );
  }

  const text = (body as Record<string, string>).text;
  const result = await parseText(text);
  return NextResponse.json(result);
}
