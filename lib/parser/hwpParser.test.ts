import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDetectFormat = vi.fn();
const mockHwpToText = vi.fn();
const mockExtractText = vi.fn();
const mockLoadFromArrayBuffer = vi.fn();

vi.mock("@ssabrojs/hwpxjs", () => ({
  detectFormat: mockDetectFormat,
  hwpToText: mockHwpToText,
  HwpEncryptedError: class HwpEncryptedError extends Error {},
  HwpUnsupportedError: class HwpUnsupportedError extends Error {},
  HwpxReader: class HwpxReader {
    loadFromArrayBuffer = mockLoadFromArrayBuffer;
    extractText = mockExtractText;
  },
}));

vi.mock("./textParser", () => ({
  parseText: vi.fn(),
}));

import { parseHwp } from "./hwpParser";
import { parseText } from "./textParser";

const mockParseText = vi.mocked(parseText);

const SAMPLE_SHEET = {
  sheetName: "텍스트 입력",
  headers: ["이름", "직위", "상위"],
  rows: [
    { 이름: "홍길동", 직위: "대표이사", 상위: "" },
    { 이름: "김철수", 직위: "CTO", 상위: "홍길동" },
  ],
};

describe("parseHwp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("HWPX 파일을 파싱하여 조직도 시트를 반환한다", async () => {
    mockDetectFormat.mockReturnValue("hwpx");
    mockLoadFromArrayBuffer.mockResolvedValue(undefined);
    mockExtractText.mockResolvedValue("홍길동(대표이사)\n  김철수(CTO)");
    mockParseText.mockResolvedValue({ sheets: [SAMPLE_SHEET], warnings: [] });

    const result = await parseHwp(Buffer.from("dummy-hwpx"));
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].sheetName).toBe("HWP 파싱 결과");
    expect(result.sheets[0].rows).toHaveLength(2);
    expect(result.warnings).toHaveLength(0);
  });

  it("HWP 5.0 바이너리 파일을 파싱하여 조직도 시트를 반환한다", async () => {
    mockDetectFormat.mockReturnValue("hwp");
    mockHwpToText.mockResolvedValue("홍길동(대표이사)\n  김철수(CTO)");
    mockParseText.mockResolvedValue({ sheets: [SAMPLE_SHEET], warnings: [] });

    const result = await parseHwp(Buffer.from("dummy-hwp"));
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].sheetName).toBe("HWP 파싱 결과");
    expect(mockHwpToText).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      { paragraphSeparator: "\n", sectionSeparator: "\n\n" },
    );
  });

  it("지원하지 않는 형식이면 경고를 포함한 빈 시트를 반환한다", async () => {
    mockDetectFormat.mockReturnValue("unknown");

    const result = await parseHwp(Buffer.from("bad-data"));
    expect(result.sheets).toHaveLength(0);
    expect(result.warnings[0]).toContain("HWP 텍스트 추출 실패");
  });

  it("텍스트가 비어있으면 경고를 반환한다", async () => {
    mockDetectFormat.mockReturnValue("hwpx");
    mockLoadFromArrayBuffer.mockResolvedValue(undefined);
    mockExtractText.mockResolvedValue("   ");
    mockParseText.mockResolvedValue({ sheets: [], warnings: [] });

    const result = await parseHwp(Buffer.from("empty-hwpx"));
    expect(result.sheets).toHaveLength(0);
    expect(result.warnings[0]).toContain("텍스트를 추출할 수 없습니다");
  });

  it("parseText 경고를 전달한다", async () => {
    mockDetectFormat.mockReturnValue("hwp");
    mockHwpToText.mockResolvedValue("홍길동");
    mockParseText.mockResolvedValue({
      sheets: [{ ...SAMPLE_SHEET, rows: [] }],
      warnings: ["AI 파싱 실패, 들여쓰기 방식으로 재시도"],
    });

    const result = await parseHwp(Buffer.from("dummy-hwp"));
    expect(result.warnings).toContain("AI 파싱 실패, 들여쓰기 방식으로 재시도");
  });

  it("추출 오류 발생 시 경고를 포함한 빈 시트를 반환한다", async () => {
    mockDetectFormat.mockReturnValue("hwp");
    mockHwpToText.mockRejectedValue(new Error("디코딩 오류"));

    const result = await parseHwp(Buffer.from("corrupt-hwp"));
    expect(result.sheets).toHaveLength(0);
    expect(result.warnings[0]).toContain("HWP 텍스트 추출 실패");
    expect(result.warnings[0]).toContain("디코딩 오류");
  });
});
