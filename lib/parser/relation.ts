import type { SheetResult } from "@/lib/parser/excel";
import { chat, isOllamaAvailable } from "@/lib/ai/ollama";

export interface FileInput {
  fileId: string;
  fileName: string;
  sheets: SheetResult[];
}

export interface ColumnRef {
  fileId: string;
  fileName: string;
  sheetName: string;
  column: string;
}

export interface FileRelation {
  /** 참조하는 쪽 (FK 보유) */
  from: ColumnRef;
  /** 참조받는 쪽 (PK 보유) */
  to: ColumnRef;
  method: "heuristic" | "ai";
  /** 신뢰도 0~1 */
  confidence: number;
  reason: string;
}

export interface RelationInferResult {
  relations: FileRelation[];
  warnings: string[];
}

/** 컬럼명을 소문자 + 특수문자 제거로 정규화 */
function normalizeCol(col: string): string {
  return col.toLowerCase().replace(/[\s_\-\.]+/g, "");
}

/** ID/코드성 컬럼 후보인지 판별 */
function isIdLike(col: string): boolean {
  const n = normalizeCol(col);
  return (
    n.endsWith("id") ||
    n.endsWith("코드") ||
    n.endsWith("code") ||
    n.endsWith("번호") ||
    n.endsWith("no") ||
    n.endsWith("key") ||
    n.endsWith("키")
  );
}

interface ColEntry {
  fileId: string;
  fileName: string;
  sheetName: string;
  column: string;
  normalized: string;
}

function extractColumns(files: FileInput[]): ColEntry[] {
  const entries: ColEntry[] = [];
  for (const file of files) {
    for (const sheet of file.sheets) {
      for (const col of sheet.headers) {
        if (!col) continue;
        entries.push({
          fileId: file.fileId,
          fileName: file.fileName,
          sheetName: sheet.sheetName,
          column: col,
          normalized: normalizeCol(col),
        });
      }
    }
  }
  return entries;
}

/** 상위/parent 패턴 컬럼 → 자기참조 관계 감지 */
function detectSelfRef(files: FileInput[]): FileRelation[] {
  const relations: FileRelation[] = [];
  for (const file of files) {
    for (const sheet of file.sheets) {
      const parentCols = sheet.headers.filter((h) => {
        const n = normalizeCol(h);
        return (
          n.startsWith("상위") ||
          n.startsWith("parent") ||
          n.includes("상위") ||
          n === "parentid" ||
          n === "parentcode"
        );
      });
      // 같은 시트에서 대응 컬럼 찾기
      for (const pCol of parentCols) {
        const pn = normalizeCol(pCol);
        // 상위부서코드 → 부서코드, parent_dept → dept
        const stripped = pn
          .replace(/^상위/, "")
          .replace(/^parent/, "");
        const target = sheet.headers.find(
          (h) => normalizeCol(h) === stripped && h !== pCol,
        );
        if (target) {
          relations.push({
            from: {
              fileId: file.fileId,
              fileName: file.fileName,
              sheetName: sheet.sheetName,
              column: pCol,
            },
            to: {
              fileId: file.fileId,
              fileName: file.fileName,
              sheetName: sheet.sheetName,
              column: target,
            },
            method: "heuristic",
            confidence: 0.9,
            reason: `"${pCol}"은 "상위/parent" 패턴 — "${target}"을 참조하는 자기참조 관계`,
          });
        }
      }
    }
  }
  return relations;
}

/** 파일 간 컬럼명 완전일치 → FK 관계 */
function detectExactMatch(files: FileInput[]): FileRelation[] {
  if (files.length < 2) return [];
  const relations: FileRelation[] = [];
  const cols = extractColumns(files);

  for (let i = 0; i < cols.length; i++) {
    for (let j = i + 1; j < cols.length; j++) {
      const a = cols[i];
      const b = cols[j];
      if (a.fileId === b.fileId && a.sheetName === b.sheetName) continue;
      if (a.normalized !== b.normalized) continue;
      if (!isIdLike(a.column)) continue;

      // 동일 컬럼명이 두 파일에 있으면 FK 관계로 간주
      relations.push({
        from: { fileId: a.fileId, fileName: a.fileName, sheetName: a.sheetName, column: a.column },
        to:   { fileId: b.fileId, fileName: b.fileName, sheetName: b.sheetName, column: b.column },
        method: "heuristic",
        confidence: 0.8,
        reason: `"${a.column}" 컬럼명 완전 일치 — 두 파일 간 FK 관계 가능성`,
      });
    }
  }
  return relations;
}

/** 유사 컬럼명 감지 (한쪽이 다른 쪽을 포함) */
function detectPartialMatch(files: FileInput[]): FileRelation[] {
  if (files.length < 2) return [];
  const relations: FileRelation[] = [];
  const cols = extractColumns(files);

  for (let i = 0; i < cols.length; i++) {
    for (let j = i + 1; j < cols.length; j++) {
      const a = cols[i];
      const b = cols[j];
      if (a.fileId === b.fileId && a.sheetName === b.sheetName) continue;
      if (a.normalized === b.normalized) continue; // 완전일치는 위에서 처리됨
      if (!isIdLike(a.column) && !isIdLike(b.column)) continue;

      const aContainsB = a.normalized.includes(b.normalized) && b.normalized.length >= 2;
      const bContainsA = b.normalized.includes(a.normalized) && a.normalized.length >= 2;

      if (aContainsB || bContainsA) {
        const from = aContainsB ? a : b;
        const to   = aContainsB ? b : a;
        relations.push({
          from: { fileId: from.fileId, fileName: from.fileName, sheetName: from.sheetName, column: from.column },
          to:   { fileId: to.fileId,   fileName: to.fileName,   sheetName: to.sheetName,   column: to.column },
          method: "heuristic",
          confidence: 0.6,
          reason: `"${from.column}"이 "${to.column}"을 포함 — 부분 컬럼명 매칭`,
        });
      }
    }
  }
  return relations;
}

function buildAiPrompt(files: FileInput[]): string {
  const summaries = files.map((f) => {
    const sheets = f.sheets.map((s) => {
      const sample = s.rows.slice(0, 2).map((r) =>
        Object.entries(r)
          .slice(0, 5)
          .map(([k, v]) => `${k}=${v}`)
          .join(", "),
      );
      return `  시트 "${s.sheetName}": 컬럼=[${s.headers.join(", ")}], 샘플=[${sample.join(" | ")}]`;
    });
    return `파일 "${f.fileName}" (id=${f.fileId}):\n${sheets.join("\n")}`;
  });

  return `다음 파일들의 컬럼 구조를 분석하여 파일 간 관계를 추론하세요.

${summaries.join("\n\n")}

다음 JSON 형식으로만 응답하세요 (추가 설명 없이):
{
  "relations": [
    {
      "fromFileId": "...",
      "fromSheet": "...",
      "fromColumn": "...",
      "toFileId": "...",
      "toSheet": "...",
      "toColumn": "...",
      "confidence": 0.0~1.0,
      "reason": "한국어로 추론 근거"
    }
  ]
}

관계가 없으면 relations 배열을 비워주세요.`;
}

interface AiRelationRaw {
  fromFileId: string;
  fromSheet: string;
  fromColumn: string;
  toFileId: string;
  toSheet: string;
  toColumn: string;
  confidence: number;
  reason: string;
}

function parseAiResponse(
  raw: string,
  files: FileInput[],
): FileRelation[] {
  const fileMap = new Map(files.map((f) => [f.fileId, f]));

  let parsed: { relations?: AiRelationRaw[] };
  try {
    // JSON 블록만 추출
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return [];
    parsed = JSON.parse(match[0]) as { relations?: AiRelationRaw[] };
  } catch {
    return [];
  }

  return (parsed.relations ?? []).flatMap((r) => {
    const fromFile = fileMap.get(r.fromFileId);
    const toFile = fileMap.get(r.toFileId);
    if (!fromFile || !toFile) return [];

    return [
      {
        from: {
          fileId: r.fromFileId,
          fileName: fromFile.fileName,
          sheetName: r.fromSheet,
          column: r.fromColumn,
        },
        to: {
          fileId: r.toFileId,
          fileName: toFile.fileName,
          sheetName: r.toSheet,
          column: r.toColumn,
        },
        method: "ai" as const,
        confidence: Math.min(1, Math.max(0, Number(r.confidence) || 0.5)),
        reason: r.reason ?? "AI 추론",
      },
    ];
  });
}

/** 중복 관계 제거 (from+to 동일 쌍) */
function dedup(relations: FileRelation[]): FileRelation[] {
  const seen = new Set<string>();
  return relations.filter((r) => {
    const key = [
      r.from.fileId, r.from.sheetName, r.from.column,
      r.to.fileId,   r.to.sheetName,   r.to.column,
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 여러 파일의 시트 구조를 분석하여 파일 간 관계를 추론한다.
 * Ollama 사용 가능 시 AI 추론을 추가하고, 불가 시 휴리스틱만 사용한다.
 */
export async function inferFileRelations(
  files: FileInput[],
): Promise<RelationInferResult> {
  const warnings: string[] = [];
  const heuristic: FileRelation[] = [
    ...detectSelfRef(files),
    ...detectExactMatch(files),
    ...detectPartialMatch(files),
  ];

  let aiRelations: FileRelation[] = [];
  if (files.length >= 2) {
    try {
      const available = await isOllamaAvailable();
      if (available) {
        const prompt = buildAiPrompt(files);
        const raw = await chat([{ role: "user", content: prompt }]);
        aiRelations = parseAiResponse(raw, files);
      } else {
        warnings.push("Ollama 서버 미연결 — 휴리스틱 추론만 사용합니다");
      }
    } catch (err) {
      warnings.push(`AI 추론 실패 (${String(err)}) — 휴리스틱 추론만 사용합니다`);
    }
  }

  // AI 결과 우선, 동일 쌍은 휴리스틱 제거
  const aiKeys = new Set(
    aiRelations.map((r) =>
      [r.from.fileId, r.from.sheetName, r.from.column, r.to.fileId, r.to.sheetName, r.to.column].join("|"),
    ),
  );
  const filteredHeuristic = heuristic.filter((r) => {
    const key = [r.from.fileId, r.from.sheetName, r.from.column, r.to.fileId, r.to.sheetName, r.to.column].join("|");
    return !aiKeys.has(key);
  });

  const relations = dedup([...aiRelations, ...filteredHeuristic]).sort(
    (a, b) => b.confidence - a.confidence,
  );

  return { relations, warnings };
}
