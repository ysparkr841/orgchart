import type { ExcelParseResult } from "./excel";
import { parseText } from "./textParser";

async function extractTextFromHwp(buffer: Buffer): Promise<string> {
  const { detectFormat, hwpToText, HwpEncryptedError, HwpUnsupportedError } = await import(
    "@ssabrojs/hwpxjs"
  );
  const data = new Uint8Array(buffer);
  const format = detectFormat(data);

  if (format === "hwpx") {
    const { HwpxReader } = await import("@ssabrojs/hwpxjs");
    const reader = new HwpxReader();
    await reader.loadFromArrayBuffer(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);
    return reader.extractText({ joinParagraphs: "\n" });
  }

  if (format === "hwp") {
    try {
      return await hwpToText(data, { paragraphSeparator: "\n", sectionSeparator: "\n\n" });
    } catch (err) {
      if (err instanceof HwpEncryptedError) throw new Error("암호화된 HWP 파일은 지원하지 않습니다.");
      if (err instanceof HwpUnsupportedError) throw new Error("지원하지 않는 HWP 버전입니다.");
      throw err;
    }
  }

  throw new Error(`지원하지 않는 HWP 형식입니다 (감지: ${format})`);
}

export async function parseHwp(buffer: Buffer): Promise<ExcelParseResult> {
  let text: string;
  try {
    text = await extractTextFromHwp(buffer);
  } catch (err) {
    return {
      sheets: [],
      warnings: [`HWP 텍스트 추출 실패: ${String(err)}`],
    };
  }

  if (!text.trim()) {
    return {
      sheets: [],
      warnings: ["HWP 파일에서 텍스트를 추출할 수 없습니다. 수동으로 데이터를 입력해 주세요."],
    };
  }

  const result = await parseText(text);
  return {
    sheets: result.sheets.map((s) => ({ ...s, sheetName: "HWP 파싱 결과" })),
    warnings: result.warnings,
  };
}
