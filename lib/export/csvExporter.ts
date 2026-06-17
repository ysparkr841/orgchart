import type { RawNode } from "@/lib/tree/builder";

const HEADERS = ["id", "title", "name", "parentId", "order", "color", "avatarUrl"];

/** 셀 값에 쉼표/큰따옴표/개행이 있으면 큰따옴표로 감싼다 */
function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** RawNode 배열을 CSV 문자열로 변환한다 */
export function exportToCsv(nodes: RawNode[]): string {
  const rows = nodes.map((n) =>
    [
      n.id,
      n.title,
      n.name ?? "",
      n.parentId ?? "",
      String(n.order ?? 0),
      n.color ?? "",
      n.avatarUrl ?? "",
    ]
      .map(escapeCell)
      .join(",")
  );

  return [HEADERS.join(","), ...rows].join("\n");
}
