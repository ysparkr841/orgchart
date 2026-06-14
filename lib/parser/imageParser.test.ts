import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../ai/ollama", () => ({
  isOllamaAvailable: vi.fn(),
  chatWithImage: vi.fn(),
  OllamaError: class OllamaError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "OllamaError";
    }
  },
}));

import { parseImage } from "./imageParser";
import { isOllamaAvailable, chatWithImage } from "../ai/ollama";

const mockIsOllamaAvailable = vi.mocked(isOllamaAvailable);
const mockChatWithImage = vi.mocked(chatWithImage);

const DUMMY_BUFFER = Buffer.from("fake-image-data");

describe("parseImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Ollama 미가동 시 경고와 빈 시트를 반환한다", async () => {
    mockIsOllamaAvailable.mockResolvedValue(false);

    const result = await parseImage(DUMMY_BUFFER);
    expect(result.sheets).toHaveLength(0);
    expect(result.warnings[0]).toContain("Ollama 서버에 연결할 수 없습니다");
  });

  it("이미지에서 조직도 데이터를 추출하여 시트를 반환한다", async () => {
    mockIsOllamaAvailable.mockResolvedValue(true);
    mockChatWithImage.mockResolvedValue(
      JSON.stringify([
        { 이름: "홍길동", 직위: "대표이사", 상위: "" },
        { 이름: "김철수", 직위: "CTO", 상위: "홍길동" },
        { 이름: "이영희", 직위: "개발팀장", 상위: "김철수" },
      ]),
    );

    const result = await parseImage(DUMMY_BUFFER);
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].sheetName).toBe("이미지 OCR");
    expect(result.sheets[0].rows).toHaveLength(3);
    expect(result.sheets[0].rows[0]).toEqual({ 이름: "홍길동", 직위: "대표이사", 상위: "" });
    expect(result.warnings).toHaveLength(0);
  });

  it("base64 인코딩된 이미지 버퍼를 chatWithImage에 전달한다", async () => {
    mockIsOllamaAvailable.mockResolvedValue(true);
    mockChatWithImage.mockResolvedValue(
      JSON.stringify([{ 이름: "홍길동", 직위: "대표이사", 상위: "" }]),
    );

    const buf = Buffer.from("test-image");
    await parseImage(buf);
    expect(mockChatWithImage).toHaveBeenCalledWith(
      expect.any(String),
      buf.toString("base64"),
    );
  });

  it("응답에 JSON 배열이 없으면 경고와 빈 시트를 반환한다", async () => {
    mockIsOllamaAvailable.mockResolvedValue(true);
    mockChatWithImage.mockResolvedValue("조직도를 분석할 수 없습니다.");

    const result = await parseImage(DUMMY_BUFFER);
    expect(result.sheets).toHaveLength(0);
    expect(result.warnings[0]).toContain("수동으로 데이터를 입력해 주세요");
  });

  it("추출된 행이 없으면 경고와 빈 시트를 반환한다", async () => {
    mockIsOllamaAvailable.mockResolvedValue(true);
    mockChatWithImage.mockResolvedValue("[]");

    const result = await parseImage(DUMMY_BUFFER);
    expect(result.sheets).toHaveLength(0);
    expect(result.warnings[0]).toContain("추출하지 못했습니다");
  });

  it("chatWithImage 오류 시 경고와 빈 시트를 반환한다", async () => {
    mockIsOllamaAvailable.mockResolvedValue(true);
    mockChatWithImage.mockRejectedValue(new Error("네트워크 오류"));

    const result = await parseImage(DUMMY_BUFFER);
    expect(result.sheets).toHaveLength(0);
    expect(result.warnings[0]).toContain("수동으로 데이터를 입력해 주세요");
  });
});
