import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  mockParseExcel,
  mockParsePdf,
  mockParseImage,
  mockParseHwp,
  mockParseHris,
  mockDetectFileType,
  mockIsSpreadsheet,
  mockIsImage,
  mockIsHwp,
  mockIsHris,
} = vi.hoisted(() => ({
  mockParseExcel: vi.fn(),
  mockParsePdf: vi.fn(),
  mockParseImage: vi.fn(),
  mockParseHwp: vi.fn(),
  mockParseHris: vi.fn(),
  mockDetectFileType: vi.fn(),
  mockIsSpreadsheet: vi.fn(),
  mockIsImage: vi.fn(),
  mockIsHwp: vi.fn(),
  mockIsHris: vi.fn(),
}));

vi.mock("@/lib/parser/excel", () => ({ parseExcel: mockParseExcel }));
vi.mock("@/lib/parser/pdfParser", () => ({ parsePdf: mockParsePdf }));
vi.mock("@/lib/parser/imageParser", () => ({ parseImage: mockParseImage }));
vi.mock("@/lib/parser/hwpParser", () => ({ parseHwp: mockParseHwp }));
vi.mock("@/lib/parser/hrisParser", () => ({ parseHris: mockParseHris }));
vi.mock("@/lib/parser/fileType", () => ({
  detectFileType: mockDetectFileType,
  isSpreadsheet: mockIsSpreadsheet,
  isImage: mockIsImage,
  isHwp: mockIsHwp,
  isHris: mockIsHris,
}));

import { POST } from "./route";

const EMPTY_SHEET = { sheetName: "Sheet1", headers: ["이름"], rows: [] };
const PARSE_RESULT = { sheets: [EMPTY_SHEET], warnings: [] };

function makeFile(name: string, type: string): File {
  return new File([new ArrayBuffer(10)], name, { type });
}

function makeReq(fd: FormData): NextRequest {
  const req = new NextRequest("http://localhost/api/parse", { method: "POST" });
  vi.spyOn(req, "formData").mockResolvedValue(fd);
  return req;
}

describe("POST /api/parse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSpreadsheet.mockReturnValue(false);
    mockIsImage.mockReturnValue(false);
    mockIsHwp.mockReturnValue(false);
    mockIsHris.mockReturnValue(false);
  });

  it("formData 파싱 실패 시 400을 반환한다", async () => {
    const req = new NextRequest("http://localhost/api/parse", { method: "POST" });
    vi.spyOn(req, "formData").mockRejectedValue(new Error("parse error"));
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/multipart/);
  });

  it("files 필드가 없으면 400을 반환한다", async () => {
    const fd = new FormData();
    const res = await POST(makeReq(fd));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/files/);
  });

  it("xlsx 파일을 전달하면 parseExcel을 호출하고 200을 반환한다", async () => {
    mockDetectFileType.mockReturnValue("xlsx");
    mockIsSpreadsheet.mockReturnValue(true);
    mockParseExcel.mockReturnValue(PARSE_RESULT);

    const fd = new FormData();
    fd.append("files", makeFile("data.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    const res = await POST(makeReq(fd));

    expect(res.status).toBe(200);
    expect(mockParseExcel).toHaveBeenCalledOnce();
    const body = (await res.json()) as { results: { sheets: unknown[] }[] };
    expect(body.results[0].sheets).toHaveLength(1);
  });

  it("pdf 파일을 전달하면 parsePdf를 호출하고 200을 반환한다", async () => {
    mockDetectFileType.mockReturnValue("pdf");
    mockIsSpreadsheet.mockReturnValue(false);
    mockParsePdf.mockResolvedValue(PARSE_RESULT);

    const fd = new FormData();
    fd.append("files", makeFile("doc.pdf", "application/pdf"));
    const res = await POST(makeReq(fd));

    expect(res.status).toBe(200);
    expect(mockParsePdf).toHaveBeenCalledOnce();
  });

  it("이미지 파일을 전달하면 parseImage를 호출하고 200을 반환한다", async () => {
    mockDetectFileType.mockReturnValue("jpg");
    mockIsImage.mockReturnValue(true);
    mockParseImage.mockResolvedValue(PARSE_RESULT);

    const fd = new FormData();
    fd.append("files", makeFile("org.jpg", "image/jpeg"));
    const res = await POST(makeReq(fd));

    expect(res.status).toBe(200);
    expect(mockParseImage).toHaveBeenCalledOnce();
  });

  it("hwp 파일을 전달하면 parseHwp를 호출하고 200을 반환한다", async () => {
    mockDetectFileType.mockReturnValue("hwp");
    mockIsHwp.mockReturnValue(true);
    mockParseHwp.mockResolvedValue(PARSE_RESULT);

    const fd = new FormData();
    fd.append("files", makeFile("report.hwp", "application/x-hwp"));
    const res = await POST(makeReq(fd));

    expect(res.status).toBe(200);
    expect(mockParseHwp).toHaveBeenCalledOnce();
  });

  it("hris xml 파일을 전달하면 parseHris를 호출하고 200을 반환한다", async () => {
    mockDetectFileType.mockReturnValue("xml");
    mockIsHris.mockReturnValue(true);
    mockParseHris.mockResolvedValue(PARSE_RESULT);

    const fd = new FormData();
    fd.append("files", makeFile("employees.xml", "application/xml"));
    const res = await POST(makeReq(fd));

    expect(res.status).toBe(200);
    expect(mockParseHris).toHaveBeenCalledOnce();
  });

  it("지원하지 않는 파일 형식이면 경고와 함께 200을 반환한다", async () => {
    mockDetectFileType.mockReturnValue("unknown");

    const fd = new FormData();
    fd.append("files", makeFile("file.xyz", "application/octet-stream"));
    const res = await POST(makeReq(fd));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: { warnings: string[]; sheets: unknown[] }[] };
    expect(body.results[0].sheets).toHaveLength(0);
    expect(body.results[0].warnings[0]).toMatch(/지원하지 않는/);
  });

  it("여러 파일을 전달하면 각각 파싱하고 results 배열로 반환한다", async () => {
    mockDetectFileType.mockReturnValueOnce("xlsx").mockReturnValueOnce("pdf");
    mockIsSpreadsheet.mockReturnValueOnce(true).mockReturnValueOnce(false);
    mockParseExcel.mockReturnValue(PARSE_RESULT);
    mockParsePdf.mockResolvedValue(PARSE_RESULT);

    const fd = new FormData();
    fd.append("files", makeFile("a.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    fd.append("files", makeFile("b.pdf", "application/pdf"));
    const res = await POST(makeReq(fd));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: unknown[] };
    expect(body.results).toHaveLength(2);
  });
});
