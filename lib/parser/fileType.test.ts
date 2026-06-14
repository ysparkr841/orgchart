import { describe, it, expect } from "vitest";
import { detectFileType, isSpreadsheet, isHwp, isHris } from "./fileType";

describe("detectFileType", () => {
  it("확장자로 xlsx 감지", () => {
    expect(detectFileType("조직도.xlsx")).toBe("xlsx");
  });

  it("확장자로 xls 감지", () => {
    expect(detectFileType("data.xls")).toBe("xls");
  });

  it("확장자로 csv 감지", () => {
    expect(detectFileType("members.csv")).toBe("csv");
  });

  it("확장자로 jpg 감지", () => {
    expect(detectFileType("org.jpg")).toBe("image");
  });

  it("확장자로 jpeg 감지", () => {
    expect(detectFileType("org.jpeg")).toBe("image");
  });

  it("확장자로 png 감지", () => {
    expect(detectFileType("chart.png")).toBe("image");
  });

  it("확장자로 pdf 감지", () => {
    expect(detectFileType("report.pdf")).toBe("pdf");
  });

  it("확장자 없을 때 MIME 타입으로 fallback", () => {
    expect(detectFileType("datafile", "image/png")).toBe("image");
    expect(detectFileType("datafile", "application/pdf")).toBe("pdf");
    expect(detectFileType("datafile", "text/csv")).toBe("csv");
  });

  it("알 수 없는 파일은 unknown 반환", () => {
    expect(detectFileType("script.exe")).toBe("unknown");
    expect(detectFileType("archive.zip")).toBe("unknown");
  });

  it("대소문자 무관하게 감지", () => {
    expect(detectFileType("FILE.XLSX")).toBe("xlsx");
    expect(detectFileType("IMAGE.PNG")).toBe("image");
  });
});

describe("isSpreadsheet", () => {
  it("xlsx/xls/csv는 스프레드시트", () => {
    expect(isSpreadsheet("xlsx")).toBe(true);
    expect(isSpreadsheet("xls")).toBe(true);
    expect(isSpreadsheet("csv")).toBe(true);
  });

  it("image/pdf/unknown은 스프레드시트 아님", () => {
    expect(isSpreadsheet("image")).toBe(false);
    expect(isSpreadsheet("pdf")).toBe(false);
    expect(isSpreadsheet("unknown")).toBe(false);
  });
});

describe("detectFileType — hwp/hwpx", () => {
  it("확장자로 hwp 감지", () => {
    expect(detectFileType("조직도.hwp")).toBe("hwp");
  });

  it("확장자로 hwpx 감지", () => {
    expect(detectFileType("조직도.hwpx")).toBe("hwpx");
  });

  it("HWP MIME 타입으로 감지", () => {
    expect(detectFileType("file", "application/x-hwp")).toBe("hwp");
    expect(detectFileType("file", "application/haansofthwp")).toBe("hwp");
  });
});

describe("isHwp", () => {
  it("hwp/hwpx는 true", () => {
    expect(isHwp("hwp")).toBe(true);
    expect(isHwp("hwpx")).toBe(true);
  });

  it("다른 타입은 false", () => {
    expect(isHwp("pdf")).toBe(false);
    expect(isHwp("xlsx")).toBe(false);
    expect(isHwp("unknown")).toBe(false);
  });
});

describe("detectFileType — xml/json (HRIS)", () => {
  it("확장자로 xml 감지", () => {
    expect(detectFileType("hris_export.xml")).toBe("xml");
  });

  it("확장자로 json 감지", () => {
    expect(detectFileType("employees.json")).toBe("json");
  });

  it("XML MIME 타입으로 감지", () => {
    expect(detectFileType("file", "text/xml")).toBe("xml");
    expect(detectFileType("file", "application/xml")).toBe("xml");
  });

  it("JSON MIME 타입으로 감지", () => {
    expect(detectFileType("file", "application/json")).toBe("json");
  });
});

describe("isHris", () => {
  it("xml/json은 true", () => {
    expect(isHris("xml")).toBe(true);
    expect(isHris("json")).toBe(true);
  });

  it("다른 타입은 false", () => {
    expect(isHris("pdf")).toBe(false);
    expect(isHris("hwp")).toBe(false);
    expect(isHris("unknown")).toBe(false);
  });
});
