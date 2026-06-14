import { describe, it, expect, vi } from "vitest";
import { parseTextWithIndent, parseText } from "./textParser";

vi.mock("@/lib/ai/ollama", () => ({
  isOllamaAvailable: vi.fn().mockResolvedValue(false),
  chat: vi.fn(),
  OllamaError: class OllamaError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "OllamaError";
    }
  },
}));

describe("parseTextWithIndent", () => {
  it("들여쓰기 계층 구조 파싱", () => {
    const text = `홍길동
  김철수
    이영희
  박민수`;
    const rows = parseTextWithIndent(text);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ 이름: "홍길동", 상위: "" });
    expect(rows[1]).toMatchObject({ 이름: "김철수", 상위: "홍길동" });
    expect(rows[2]).toMatchObject({ 이름: "이영희", 상위: "김철수" });
    expect(rows[3]).toMatchObject({ 이름: "박민수", 상위: "홍길동" });
  });

  it("괄호 패턴으로 직위 파싱", () => {
    const rows = parseTextWithIndent("홍길동(대표이사)");
    expect(rows[0]).toMatchObject({ 이름: "홍길동", 직위: "대표이사" });
  });

  it("대시 패턴으로 직위 파싱", () => {
    const rows = parseTextWithIndent("홍길동 - CEO");
    expect(rows[0]).toMatchObject({ 이름: "홍길동", 직위: "CEO" });
  });

  it("콜론 패턴으로 직위 파싱", () => {
    const rows = parseTextWithIndent("홍길동: 대표이사");
    expect(rows[0]).toMatchObject({ 이름: "홍길동", 직위: "대표이사" });
  });

  it("리스트 마커 제거", () => {
    const rows = parseTextWithIndent("- 홍길동\n  * 김철수");
    expect(rows[0]).toMatchObject({ 이름: "홍길동" });
    expect(rows[1]).toMatchObject({ 이름: "김철수", 상위: "홍길동" });
  });

  it("괄호+들여쓰기 복합 계층", () => {
    const text = `홍길동(대표이사)
  김철수(CTO)
    이영희(개발팀장)
  박민수(CFO)`;
    const rows = parseTextWithIndent(text);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ 이름: "홍길동", 직위: "대표이사", 상위: "" });
    expect(rows[1]).toMatchObject({ 이름: "김철수", 직위: "CTO", 상위: "홍길동" });
    expect(rows[2]).toMatchObject({ 이름: "이영희", 직위: "개발팀장", 상위: "김철수" });
    expect(rows[3]).toMatchObject({ 이름: "박민수", 직위: "CFO", 상위: "홍길동" });
  });

  it("빈 텍스트는 빈 배열 반환", () => {
    expect(parseTextWithIndent("")).toHaveLength(0);
    expect(parseTextWithIndent("   \n  ")).toHaveLength(0);
  });

  it("빈 줄 무시", () => {
    const rows = parseTextWithIndent("홍길동\n\n  김철수\n");
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ 이름: "김철수", 상위: "홍길동" });
  });
});

describe("parseText — Ollama 없을 때", () => {
  it("경고 포함 및 기본 파서 결과 반환", async () => {
    const result = await parseText("홍길동\n  김철수");
    expect(result.warnings.some((w) => w.includes("Ollama"))).toBe(true);
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].sheetName).toBe("텍스트 입력");
    expect(result.sheets[0].headers).toEqual(["이름", "직위", "상위"]);
    expect(result.sheets[0].rows).toHaveLength(2);
  });

  it("빈 텍스트 — 파싱 결과 없음 경고", async () => {
    const result = await parseText("   ");
    expect(result.sheets).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes("파싱 결과가 없습니다"))).toBe(true);
  });
});
