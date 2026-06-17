import * as XLSX from "xlsx";
import type { RawNode } from "@/lib/tree/builder";

const HEADERS = ["id", "title", "name", "parentId", "order", "color", "avatarUrl"];

/** RawNode 배열을 XLSX 버퍼로 변환한다 */
export function exportToExcel(nodes: RawNode[]): Buffer {
  const rows = nodes.map((n) => [
    n.id,
    n.title,
    n.name ?? "",
    n.parentId ?? "",
    n.order ?? 0,
    n.color ?? "",
    n.avatarUrl ?? "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "OrgChart");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
