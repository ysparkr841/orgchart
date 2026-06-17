import { NextRequest, NextResponse } from "next/server";

export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function serverError(label: string, err: unknown, message: string): NextResponse {
  console.error(label, err);
  return NextResponse.json({ error: message }, { status: 500 });
}

type JsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

export async function parseJsonBody<T = unknown>(req: NextRequest): Promise<JsonResult<T>> {
  try {
    const data = (await req.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, response: apiError("JSON 파싱 실패", 400) };
  }
}
