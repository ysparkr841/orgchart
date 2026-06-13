import * as XLSX from "xlsx";

export interface ParsedRow {
  [key: string]: unknown;
}

export interface SheetResult {
  sheetName: string;
  headers: string[];
  rows: ParsedRow[];
}

export interface ExcelParseResult {
  sheets: SheetResult[];
  /** 파싱 경고 메시지 (실패해도 에러 던지지 않음) */
  warnings: string[];
}

function normalizeHeader(raw: unknown): string {
  return String(raw ?? "").trim();
}

function parseSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
): SheetResult | null {
  const ws = workbook.Sheets[sheetName];
  if (!ws) return null;

  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
  });

  if (raw.length === 0) {
    return { sheetName, headers: [], rows: [] };
  }

  const [headerRow, ...dataRows] = raw as unknown[][];
  const headers = (headerRow ?? []).map(normalizeHeader);

  const rows: ParsedRow[] = dataRows
    .filter((row) => row.some((cell) => cell !== "" && cell != null))
    .map((row) => {
      const obj: ParsedRow = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? "";
      });
      return obj;
    });

  return { sheetName, headers, rows };
}

/**
 * Buffer(서버) 또는 ArrayBuffer(브라우저) 에서 엑셀을 파싱한다.
 * 파싱 실패 시 에러를 던지지 않고 warnings에 담아 반환한다.
 */
export function parseExcel(
  data: Buffer | ArrayBuffer | Uint8Array,
): ExcelParseResult {
  const warnings: string[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: "buffer" });
  } catch (err) {
    warnings.push(`엑셀 파일 읽기 실패: ${String(err)}`);
    return { sheets: [], warnings };
  }

  const sheets: SheetResult[] = [];

  for (const name of workbook.SheetNames) {
    try {
      const result = parseSheet(workbook, name);
      if (result) sheets.push(result);
    } catch (err) {
      warnings.push(`시트 "${name}" 파싱 실패: ${String(err)}`);
    }
  }

  if (sheets.length === 0 && warnings.length === 0) {
    warnings.push("빈 엑셀 파일입니다.");
  }

  return { sheets, warnings };
}

/** 가장 유력한 "이름" 컬럼 헤더를 추측한다 */
export function guessNameColumn(headers: string[]): string | null {
  const candidates = ["이름", "성명", "name", "담당자", "직원명"];
  for (const c of candidates) {
    const found = headers.find((h) => h.toLowerCase().includes(c));
    if (found) return found;
  }
  return null;
}

/** 가장 유력한 "부서/직위" 컬럼 헤더를 추측한다 */
export function guessTitleColumn(headers: string[]): string | null {
  const candidates = ["부서", "팀", "직위", "직책", "부문", "dept", "title"];
  for (const c of candidates) {
    const found = headers.find((h) => h.toLowerCase().includes(c));
    if (found) return found;
  }
  return null;
}
