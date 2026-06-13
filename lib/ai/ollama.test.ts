import { describe, it, expect } from "vitest";
import { chat, isOllamaAvailable, OllamaError } from "./ollama";

describe("isOllamaAvailable", () => {
  it("반환값이 boolean이다", async () => {
    const result = await isOllamaAvailable();
    expect(typeof result).toBe("boolean");
  });

  it("5초 이내에 응답한다", async () => {
    const start = Date.now();
    await isOllamaAvailable();
    expect(Date.now() - start).toBeLessThan(5_000);
  });
});

describe("chat — llama3.2:3b 연동", () => {
  it("간단한 프롬프트에 비어있지 않은 문자열을 반환한다", { timeout: 60_000 }, async () => {
    const available = await isOllamaAvailable();
    if (!available) return; // Ollama 미연결 환경 건너뜀

    const response = await chat([{ role: "user", content: "1+1은 얼마야? 숫자만 답해." }]);
    expect(typeof response).toBe("string");
    expect(response.trim().length).toBeGreaterThan(0);
  });

  it("system 메시지를 포함한 대화를 처리한다", { timeout: 60_000 }, async () => {
    const available = await isOllamaAvailable();
    if (!available) return;

    const response = await chat([
      { role: "system", content: "당신은 조직도 분석 전문가입니다." },
      { role: "user", content: "안녕하세요." },
    ]);
    expect(typeof response).toBe("string");
    expect(response.trim().length).toBeGreaterThan(0);
  });

  it("타임아웃 초과 시 OllamaError를 던진다", { timeout: 10_000 }, async () => {
    const available = await isOllamaAvailable();
    if (!available) return;

    // 50ms 타임아웃 — 실제 응답 전에 반드시 만료됨
    await expect(
      chat([{ role: "user", content: "안녕?" }], "llama3.2:3b", 50),
    ).rejects.toThrow(OllamaError);
  });

  it("존재하지 않는 모델 사용 시 OllamaError를 던진다", { timeout: 15_000 }, async () => {
    const available = await isOllamaAvailable();
    if (!available) return;

    await expect(
      chat([{ role: "user", content: "안녕?" }], "nonexistent-model:999"),
    ).rejects.toThrow(OllamaError);
  });
});

describe("OllamaError", () => {
  it("message와 cause를 올바르게 저장한다", () => {
    const cause = new Error("원인 오류");
    const err = new OllamaError("연결 실패", cause);
    expect(err.message).toBe("연결 실패");
    expect(err.cause).toBe(cause);
    expect(err.name).toBe("OllamaError");
    expect(err).toBeInstanceOf(Error);
  });

  it("cause 없이도 생성된다", () => {
    const err = new OllamaError("타임아웃");
    expect(err.message).toBe("타임아웃");
    expect(err.cause).toBeUndefined();
  });
});
