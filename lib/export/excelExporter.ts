import * as XLSX from "xlsx";
import type { RawNode } from "@/lib/tree/builder";
import { EXPORT_HEADERS, nodeToRow } from "@/lib/export/exportHelpers";

/** RawNode 배열을 XLSX 버퍼로 변환한다 */
export function exportToExcel(nodes: RawNode[]): Buffer {
  const rows = nodes.map(nodeToRow);

  const ws = XLSX.utils.aoa_to_sheet([EXPORT_HEADERS, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "OrgChart");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
