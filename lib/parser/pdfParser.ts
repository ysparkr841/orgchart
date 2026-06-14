import type { ExcelParseResult } from "./excel";
import { parseText } from "./textParser";

interface TextItem {
  str: string;
  hasEOL?: boolean;
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  // 서버 사이드에서 Worker 없이 실행
  GlobalWorkerOptions.workerSrc = "";

  const data = new Uint8Array(buffer);
  const loadingTask = getDocument({ data, useSystemFonts: true });
  const doc = await loadingTask.promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    let lineText = "";
    const lines: string[] = [];
    for (const item of content.items) {
      const ti = item as TextItem;
      lineText += ti.str;
      if (ti.hasEOL) {
        const trimmed = lineText.trim();
        if (trimmed) lines.push(trimmed);
        lineText = "";
      }
    }
    if (lineText.trim()) lines.push(lineText.trim());
    if (lines.length > 0) pages.push(lines.join("\n"));
  }

  return pages.join("\n");
}

export async function parsePdf(buffer: Buffer): Promise<ExcelParseResult> {
  let text: string;
  try {
    text = await extractTextFromPdf(buffer);
  } catch (err) {
    return {
      sheets: [],
      warnings: [`PDF 텍스트 추출 실패: ${String(err)}. 이미지 스캔 PDF는 지원하지 않습니다.`],
    };
  }

  if (!text.trim()) {
    return {
      sheets: [],
      warnings: ["PDF에서 텍스트를 추출할 수 없습니다. 스캔 이미지 PDF는 지원하지 않습니다."],
    };
  }

  const result = await parseText(text);
  return {
    sheets: result.sheets.map((s) => ({ ...s, sheetName: "PDF 파싱 결과" })),
    warnings: result.warnings,
  };
}
