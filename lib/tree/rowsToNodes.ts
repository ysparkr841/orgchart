import type { ColumnMapping } from "@/lib/store/mapping-store";
import type { SheetResult } from "@/lib/parser/excel";
import type { RawNode } from "@/lib/tree/builder";

/**
 * 파싱된 시트 데이터 + 컬럼 매핑 → RawNode 배열
 * parentColumn 값은 동일 데이터셋 내 다른 노드의 title과 매칭하여 parentId를 설정한다
 */
export function rowsToNodes(
  sheets: SheetResult[],
  mappings: ColumnMapping[],
): RawNode[] {
  const allNodes: RawNode[] = [];
  const titleToId = new Map<string, string>();

  // 1패스: 노드 생성 (id/title/name)
  for (const mapping of mappings) {
    if (!mapping.nameColumn && !mapping.titleColumn) continue;
    const sheet = sheets.find((s) => s.sheetName === mapping.sheetName);
    if (!sheet) continue;

    sheet.rows.forEach((row, i) => {
      const id = `${mapping.fileId}__${mapping.sheetName}__${i}`;
      const title = mapping.titleColumn
        ? String(row[mapping.titleColumn] ?? "")
        : String(row[mapping.nameColumn!] ?? `노드-${i}`);
      const name = mapping.nameColumn
        ? String(row[mapping.nameColumn] ?? "")
        : undefined;

      allNodes.push({
        id,
        title,
        name: name || undefined,
        meta: row as Record<string, unknown>,
      });

      if (title) titleToId.set(title, id);
    });
  }

  // 2패스: parentId 설정 (parentColumn 값 → titleToId 조회)
  let nodeIdx = 0;
  for (const mapping of mappings) {
    if (!mapping.nameColumn && !mapping.titleColumn) continue;
    const sheet = sheets.find((s) => s.sheetName === mapping.sheetName);
    if (!sheet) continue;

    for (const row of sheet.rows) {
      const parentTitle = mapping.parentColumn
        ? String(row[mapping.parentColumn] ?? "")
        : "";
      const node = allNodes[nodeIdx];
      if (node && parentTitle) {
        const parentId = titleToId.get(parentTitle);
        if (parentId && parentId !== node.id) {
          node.parentId = parentId;
        }
      }
      nodeIdx++;
    }
  }

  return allNodes;
}
