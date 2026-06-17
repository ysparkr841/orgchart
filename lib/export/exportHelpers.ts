import type { RawNode } from "@/lib/tree/builder";

export const EXPORT_HEADERS = [
  "id",
  "title",
  "name",
  "parentId",
  "order",
  "color",
  "avatarUrl",
];

/** RawNode를 내보내기 행 데이터로 변환한다 */
export function nodeToRow(n: RawNode): (string | number)[] {
  return [
    n.id,
    n.title,
    n.name ?? "",
    n.parentId ?? "",
    n.order ?? 0,
    n.color ?? "",
    n.avatarUrl ?? "",
  ];
}
