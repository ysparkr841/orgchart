import type { SheetResult } from "@/lib/parser/excel";
import { chat, isOllamaAvailable, OllamaError } from "@/lib/ai/ollama";

export interface TextParseResult {
  sheets: SheetResult[];
  warnings: string[];
}

interface OrgRow {
  이름: string;
  직위: string;
  상위: string;
}

const OLLAMA_PROMPT = `아래 텍스트에서 조직도 데이터를 추출하여 JSON 배열만 반환하세요.
각 항목 형식: {"이름": "이름값", "직위": "직위나 부서명(없으면 빈 문자열)", "상위": "상위 담당자 이름(최상위면 빈 문자열)"}
JSON 배열 외 다른 텍스트는 포함하지 마세요.

텍스트:
`;

/** 들여쓰기/괄호/대시 패턴을 이용한 기본 파서 (Ollama 없을 때 fallback) */
export function parseTextWithIndent(text: string): OrgRow[] {
  const rows: OrgRow[] = [];
  const stack: { name: string; indent: number }[] = [];

  for (const line of text.split("\n")) {
    const trimmed = line.trim().replace(/^[-*•·]+\s*/, "");
    if (!trimmed) continue;

    const indent = line.search(/\S/);
    let name = trimmed;
    let title = "";

    const parenMatch = trimmed.match(/^(.+?)\s*[（(](.+?)[)）]\s*$/);
    const dashMatch = trimmed.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    const colonMatch = trimmed.match(/^(.+?)\s*[:：]\s*(.+)$/);

    if (parenMatch) {
      name = parenMatch[1].trim();
      title = parenMatch[2].trim();
    } else if (dashMatch) {
      name = dashMatch[1].trim();
      title = dashMatch[2].trim();
    } else if (colonMatch) {
      name = colonMatch[1].trim();
      title = colonMatch[2].trim();
    }

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack.length > 0 ? stack[stack.length - 1].name : "";
    rows.push({ 이름: name, 직위: title, 상위: parent });
    stack.push({ name, indent });
  }

  return rows;
}

function extractRowsFromOllamaResponse(raw: string): OrgRow[] {
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

function rowsToSheet(rows: OrgRow[]): SheetResult {
  return {
    sheetName: "텍스트 입력",
    headers: ["이름", "직위", "상위"],
    rows: rows.map((r) => ({ 이름: r.이름, 직위: r.직위, 상위: r.상위 })),
  };
}

export async function parseText(text: string): Promise<TextParseResult> {
  const warnings: string[] = [];
  let rows: OrgRow[] = [];

  const available = await isOllamaAvailable();

  if (available) {
    try {
      const raw = await chat([{ role: "user", content: OLLAMA_PROMPT + text }]);
      rows = extractRowsFromOllamaResponse(raw);
      if (rows.length === 0) {
        warnings.push("AI 파싱 결과가 비어 있어 기본 파서로 재시도합니다.");
        rows = parseTextWithIndent(text);
      }
    } catch (err) {
      warnings.push(`AI 파싱 실패: ${String(err)}. 기본 파서를 사용합니다.`);
      rows = parseTextWithIndent(text);
    }
  } else {
    warnings.push("Ollama를 사용할 수 없어 기본 들여쓰기 파서를 사용합니다.");
    rows = parseTextWithIndent(text);
  }

  if (rows.length === 0) {
    return {
      sheets: [],
      warnings: [...warnings, "파싱 결과가 없습니다. 들여쓰기 또는 괄호 형식으로 입력해 주세요."],
    };
  }

  return { sheets: [rowsToSheet(rows)], warnings };
}
