import type { SheetResult } from "./excel";
import { chatWithImage, isOllamaAvailable, OllamaError } from "../ai/ollama";

export interface ImageParseResult {
  sheets: SheetResult[];
  warnings: string[];
}

interface OrgRow {
  이름: string;
  직위: string;
  상위: string;
}

const IMAGE_OCR_PROMPT = `이 이미지는 조직도입니다. 조직도에 있는 모든 사람과 부서 정보를 추출하여 JSON 배열만 반환하세요.
각 항목 형식: {"이름": "이름 또는 부서명", "직위": "직위나 역할(없으면 빈 문자열)", "상위": "직속 상위 담당자 또는 부서명(최상위면 빈 문자열)"}
JSON 배열 외 다른 텍스트는 포함하지 마세요.`;

function extractRowsFromResponse(raw: string): OrgRow[] {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new OllamaError("응답에서 JSON 배열을 찾을 수 없습니다.");

  const parsed = JSON.parse(match[0]) as unknown[];
  return parsed
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && "이름" in item,
    )
    .map((item) => ({
      이름: String(item["이름"] ?? "").trim(),
      직위: String(item["직위"] ?? "").trim(),
      상위: String(item["상위"] ?? "").trim(),
    }))
    .filter((r) => r.이름 !== "");
}

export async function parseImage(buffer: Buffer): Promise<ImageParseResult> {
  const available = await isOllamaAvailable();
  if (!available) {
    return {
      sheets: [],
      warnings: [
        "Ollama 서버에 연결할 수 없습니다. 이미지 OCR을 사용하려면 Ollama를 실행하고 qwen2.5vl:7b 모델을 설치해 주세요.",
      ],
    };
  }

  let rows: OrgRow[] = [];
  try {
    const base64 = buffer.toString("base64");
    const raw = await chatWithImage(IMAGE_OCR_PROMPT, base64);
    rows = extractRowsFromResponse(raw);
  } catch (err) {
    const msg = err instanceof OllamaError ? err.message : "이미지 OCR 중 오류가 발생했습니다.";
    return {
      sheets: [],
      warnings: [`${msg} 수동으로 데이터를 입력해 주세요.`],
    };
  }

  if (rows.length === 0) {
    return {
      sheets: [],
      warnings: ["이미지에서 조직도 데이터를 추출하지 못했습니다. 수동으로 입력해 주세요."],
    };
  }

  return {
    sheets: [
      {
        sheetName: "이미지 OCR",
        headers: ["이름", "직위", "상위"],
        rows: rows.map((r) => ({ 이름: r.이름, 직위: r.직위, 상위: r.상위 })),
      },
    ],
    warnings: [],
  };
}
