import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { apiError, serverError, parseJsonBody } from "./routeHelpers";

describe("apiError", () => {
  it("지정한 status와 error 메시지를 반환한다", async () => {
    const res = apiError("잘못된 요청", 400);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "잘못된 요청" });
  });

  it("404 응답을 생성한다", async () => {
    const res = apiError("찾을 수 없습니다", 404);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "찾을 수 없습니다" });
  });
});

describe("serverError", () => {
  it("500 응답과 지정 메시지를 반환하고 console.error를 호출한다", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("DB down");
    const res = serverError("[TEST]", err, "DB 오류");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "DB 오류" });
    expect(spy).toHaveBeenCalledWith("[TEST]", err);
    spy.mockRestore();
  });
});

describe("parseJsonBody", () => {
  it("유효한 JSON body를 파싱한다", async () => {
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ name: "테스트" }),
      headers: { "Content-Type": "application/json" },
    });
    const result = await parseJsonBody(req);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ name: "테스트" });
    }
  });

  it("잘못된 JSON이면 ok=false 와 400 응답을 반환한다", async () => {
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      body: "{ invalid json",
      headers: { "Content-Type": "application/json" },
    });
    const result = await parseJsonBody(req);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body).toEqual({ error: "JSON 파싱 실패" });
    }
  });
});
