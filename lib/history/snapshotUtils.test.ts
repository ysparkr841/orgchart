import { describe, it, expect } from "vitest";
import {
  serializeSnapshot,
  deserializeSnapshot,
  countNodesInSnapshot,
} from "./snapshotUtils";
import type { RawNode } from "@/lib/tree/builder";

const SAMPLE_NODES: RawNode[] = [
  { id: "1", title: "대표이사", order: 0 },
  { id: "2", title: "CTO", parentId: "1", order: 1 },
  { id: "3", title: "개발팀장", parentId: "2", name: "김철수", order: 2 },
];

describe("serializeSnapshot", () => {
  it("RawNode 배열을 JSON 문자열로 변환한다", () => {
    const json = serializeSnapshot(SAMPLE_NODES);
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json) as unknown[];
    expect(parsed).toHaveLength(3);
  });

  it("빈 배열을 직렬화한다", () => {
    expect(serializeSnapshot([])).toBe("[]");
  });
});

describe("deserializeSnapshot", () => {
  it("JSON 문자열을 RawNode 배열로 복원한다", () => {
    const json = serializeSnapshot(SAMPLE_NODES);
    const nodes = deserializeSnapshot(json);
    expect(nodes).toHaveLength(3);
    expect(nodes[0].id).toBe("1");
    expect(nodes[0].title).toBe("대표이사");
  });

  it("parentId, name 등 선택 필드도 보존한다", () => {
    const json = serializeSnapshot(SAMPLE_NODES);
    const nodes = deserializeSnapshot(json);
    expect(nodes[2].parentId).toBe("2");
    expect(nodes[2].name).toBe("김철수");
  });

  it("배열이 아닌 JSON이면 빈 배열을 반환한다", () => {
    expect(deserializeSnapshot('{"not": "array"}')).toEqual([]);
  });

  it("직렬화 → 역직렬화 왕복이 데이터를 보존한다", () => {
    const nodes = deserializeSnapshot(serializeSnapshot(SAMPLE_NODES));
    expect(nodes).toEqual(SAMPLE_NODES);
  });
});

describe("countNodesInSnapshot", () => {
  it("JSON 문자열에서 노드 수를 반환한다", () => {
    const json = serializeSnapshot(SAMPLE_NODES);
    expect(countNodesInSnapshot(json)).toBe(3);
  });

  it("빈 배열이면 0을 반환한다", () => {
    expect(countNodesInSnapshot("[]")).toBe(0);
  });

  it("잘못된 JSON이면 0을 반환한다", () => {
    expect(countNodesInSnapshot("invalid-json")).toBe(0);
  });

  it("배열이 아닌 JSON이면 0을 반환한다", () => {
    expect(countNodesInSnapshot('{"key": "value"}')).toBe(0);
  });
});
