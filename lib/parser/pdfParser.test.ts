import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDocument = vi.fn();

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: mockGetDocument,
}));

vi.mock("./textParser", () => ({
  parseText: vi.fn(),
}));

import { parsePdf } from "./pdfParser";
import { parseText } from "./textParser";

const mockParseText = vi.mocked(parseText);

function makePdfDoc(pages: Array<{ str: string; hasEOL?: boolean }[]>) {
  return {
    promise: Promise.resolve({
      numPages: pages.length,
      getPage: (i: number) =>
        Promise.resolve({
          getTextContent: () =>
            Promise.resolve({ items: pages[i - 1] }),
        }),
    }),
  };
}

describe("parsePdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("텍스트 PDF를 파싱하여 조직도 시트를 반환한다", async () => {
    mockGetDocument.mockReturnValue(
      makePdfDoc([
        [
          { str: "홍길동(대표이사)", hasEOL: true },
          { str: "  김철수(CTO)", hasEOL: true },
        ],
      ]),
    );

    mockParseText.mockResolvedValue({
      sheets: [
        {
          sheetName: "텍스트 입력",
          headers: ["이름", "직위", "상위"],
          rows: [
            { 이름: "홍길동", 직위: "대표이사", 상위: "" },
            { 이름: "김철수", 직위: "CTO", 상위: "홍길동" },
          ],
        },
      ],
      warnings: [],
    });

    const result = await parsePdf(Buffer.from("dummy-pdf"));
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].sheetName).toBe("PDF 파싱 결과");
    expect(result.sheets[0].rows).toHaveLength(2);
    expect(result.warnings).toHaveLength(0);
  });

  it("여러 페이지 PDF의 텍스트를 합쳐서 parseText에 전달한다", async () => {
    mockGetDocument.mockReturnValue(
      makePdfDoc([
        [{ str: "홍길동", hasEOL: true }],
        [{ str: "  김철수", hasEOL: true }],
      ]),
    );

    mockParseText.mockResolvedValue({
      sheets: [{ sheetName: "텍스트 입력", headers: ["이름", "직위", "상위"], rows: [] }],
      warnings: [],
    });

    await parsePdf(Buffer.from("two-page-pdf"));
    const callArg = mockParseText.mock.calls[0][0] as string;
    expect(callArg).toContain("홍길동");
    expect(callArg).toContain("김철수");
  });

  it("PDF 추출 실패 시 경고를 반환하고 시트는 비어 있다", async () => {
    mockGetDocument.mockImplementation(() => ({
      promise: Promise.reject(new Error("파일 손상")),
    }));

    const result = await parsePdf(Buffer.from("invalid"));
    expect(result.sheets).toHaveLength(0);
    expect(result.warnings[0]).toContain("PDF 텍스트 추출 실패");
  });

  it("텍스트가 없는 이미지 PDF는 경고를 반환한다", async () => {
    mockGetDocument.mockReturnValue(makePdfDoc([[]]));

    const result = await parsePdf(Buffer.from("image-pdf"));
    expect(result.sheets).toHaveLength(0);
    expect(result.warnings[0]).toContain("텍스트를 추출할 수 없습니다");
  });

  it("parseText 경고를 결과에 전달한다", async () => {
    mockGetDocument.mockReturnValue(
      makePdfDoc([[{ str: "홍길동", hasEOL: true }]]),
    );

    mockParseText.mockResolvedValue({
      sheets: [
        {
          sheetName: "텍스트 입력",
          headers: ["이름", "직위", "상위"],
          rows: [{ 이름: "홍길동", 직위: "", 상위: "" }],
        },
      ],
      warnings: ["Ollama를 사용할 수 없어 기본 파서를 사용합니다."],
    });

    const result = await parsePdf(Buffer.from("dummy"));
    expect(result.warnings).toContain("Ollama를 사용할 수 없어 기본 파서를 사용합니다.");
  });
});
