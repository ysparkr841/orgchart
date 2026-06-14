import type { RawNode } from "@/lib/tree/builder";

/** RawNode 배열을 JSON 문자열로 직렬화 (스냅샷 저장용) */
export function serializeSnapshot(nodes: RawNode[]): string {
  return JSON.stringify(nodes);
}

/** JSON 문자열에서 RawNode 배열 복원 (스냅샷 로드용) */
export function deserializeSnapshot(json: string): RawNode[] {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) return [];
  return parsed as RawNode[];
}

/** JSON 스냅샷 문자열에서 노드 수만 빠르게 계산 */
export function countNodesInSnapshot(json: string): number {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}
