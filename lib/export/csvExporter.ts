import type { RawNode } from "@/lib/tree/builder";
import { EXPORT_HEADERS, nodeToRow } from "@/lib/export/exportHelpers";

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
    nodeToRow(n).map((v) => escapeCell(String(v))).join(",")
  );

  return [EXPORT_HEADERS.join(","), ...rows].join("\n");
}
