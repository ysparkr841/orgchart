import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockParseText } = vi.hoisted(() => ({ mockParseText: vi.fn() }));

vi.mock("@/lib/parser/textParser", () => ({
  parseText: mockParseText,
}));

import { POST } from "./route";

describe("POST /api/parse/text", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParseText.mockResolvedValue({
      sheets: [{ sheetName: "텍스트 입력", headers: ["이름", "직위", "상위"], rows: [] }],
      warnings: [],
    });
  });

  function makeReq(body: unknown) {
    return new NextRequest("http://localhost/api/parse/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("유효한 텍스트를 전달하면 parseText를 호출하고 200을 반환한다", async () => {
    const req = makeReq({ text: "홍길동 (대표이사)" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { sheets: unknown[] };
    expect(mockParseText).toHaveBeenCalledWith("홍길동 (대표이사)");
    expect(data.sheets).toHaveLength(1);
  });

  it("JSON 파싱 실패 시 400을 반환한다", async () => {
    const req = new NextRequest("http://localhost/api/parse/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-valid-json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("JSON 파싱 실패");
  });

  it("text 필드가 없으면 400을 반환한다", async () => {
    const req = makeReq({ other: "field" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/text/);
  });

  it("text가 빈 문자열(공백)이면 400을 반환한다", async () => {
    const req = makeReq({ text: "   " });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("text가 문자열이 아니면 400을 반환한다", async () => {
    const req = makeReq({ text: 123 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
