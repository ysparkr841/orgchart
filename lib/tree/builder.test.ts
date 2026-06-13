import { describe, it, expect } from "vitest";
import { buildTree, flattenTree, getDepth, topologicalSort, treeToRawNodes } from "./builder";
import type { RawNode } from "./builder";

const NODES: RawNode[] = [
  { id: "1", title: "본사", parentId: null },
  { id: "2", title: "개발팀", parentId: "1", order: 1 },
  { id: "3", title: "기획팀", parentId: "1", order: 2 },
  { id: "4", title: "프론트엔드", parentId: "2", order: 1 },
  { id: "5", title: "백엔드", parentId: "2", order: 2 },
];

describe("buildTree", () => {
  it("단일 루트 트리를 올바르게 조립한다", () => {
    const { roots, orphans } = buildTree(NODES);
    expect(orphans).toHaveLength(0);
    expect(roots).toHaveLength(1);
    expect(roots[0].title).toBe("본사");
    expect(roots[0].children).toHaveLength(2);
  });

  it("자식 노드 순서(order)를 정렬한다", () => {
    const { roots } = buildTree(NODES);
    const devTeam = roots[0].children[0];
    expect(devTeam.title).toBe("개발팀");
    expect(devTeam.children[0].title).toBe("프론트엔드");
    expect(devTeam.children[1].title).toBe("백엔드");
  });

  it("복수 루트를 지원한다", () => {
    const multi: RawNode[] = [
      { id: "a", title: "A팀", parentId: null },
      { id: "b", title: "B팀", parentId: null },
    ];
    const { roots } = buildTree(multi);
    expect(roots).toHaveLength(2);
  });

  it("존재하지 않는 parentId는 orphan 처리 후 루트로 올린다", () => {
    const broken: RawNode[] = [
      { id: "1", title: "팀장", parentId: "MISSING" },
    ];
    const { roots, orphans } = buildTree(broken);
    expect(orphans).toHaveLength(1);
    expect(roots).toHaveLength(1);
  });

  it("빈 입력을 처리한다", () => {
    const { roots, orphans } = buildTree([]);
    expect(roots).toHaveLength(0);
    expect(orphans).toHaveLength(0);
  });
});

describe("flattenTree", () => {
  it("BFS 순서로 모든 노드를 반환한다", () => {
    const { roots } = buildTree(NODES);
    const flat = flattenTree(roots);
    expect(flat).toHaveLength(5);
    expect(flat[0].title).toBe("본사");
    expect(flat[1].title).toBe("개발팀");
    expect(flat[2].title).toBe("기획팀");
  });
});

describe("getDepth", () => {
  it("루트의 depth는 0이다", () => {
    const { roots } = buildTree(NODES);
    expect(getDepth(roots, "1")).toBe(0);
  });

  it("2단계 노드의 depth는 1이다", () => {
    const { roots } = buildTree(NODES);
    expect(getDepth(roots, "2")).toBe(1);
  });

  it("3단계 노드의 depth는 2이다", () => {
    const { roots } = buildTree(NODES);
    expect(getDepth(roots, "4")).toBe(2);
  });

  it("존재하지 않는 id는 -1을 반환한다", () => {
    const { roots } = buildTree(NODES);
    expect(getDepth(roots, "999")).toBe(-1);
  });
});

describe("topologicalSort", () => {
  it("부모가 자식보다 앞에 온다", () => {
    const nodes: RawNode[] = [
      { id: "child", title: "자식", parentId: "parent" },
      { id: "parent", title: "부모" },
    ];
    const sorted = topologicalSort(nodes);
    const parentIdx = sorted.findIndex((n) => n.id === "parent");
    const childIdx = sorted.findIndex((n) => n.id === "child");
    expect(parentIdx).toBeLessThan(childIdx);
  });

  it("3단계 깊이도 올바르게 정렬한다", () => {
    const nodes: RawNode[] = [
      { id: "3", title: "손자", parentId: "2" },
      { id: "1", title: "루트" },
      { id: "2", title: "자식", parentId: "1" },
    ];
    const sorted = topologicalSort(nodes);
    const ids = sorted.map((n) => n.id);
    expect(ids.indexOf("1")).toBeLessThan(ids.indexOf("2"));
    expect(ids.indexOf("2")).toBeLessThan(ids.indexOf("3"));
  });

  it("순환 참조가 있어도 모든 노드를 반환한다", () => {
    const nodes: RawNode[] = [
      { id: "a", title: "A", parentId: "b" },
      { id: "b", title: "B", parentId: "a" },
    ];
    const sorted = topologicalSort(nodes);
    expect(sorted).toHaveLength(2);
  });

  it("빈 배열을 처리한다", () => {
    expect(topologicalSort([])).toHaveLength(0);
  });
});

describe("treeToRawNodes", () => {
  it("트리를 RawNode 배열로 펼치고 parentId를 올바르게 설정한다", () => {
    const { roots } = buildTree(NODES);
    const raw = treeToRawNodes(roots);
    expect(raw).toHaveLength(NODES.length);
    const root = raw.find((n) => n.id === "1");
    expect(root?.parentId).toBeNull();
    const dev = raw.find((n) => n.id === "2");
    expect(dev?.parentId).toBe("1");
    const fe = raw.find((n) => n.id === "4");
    expect(fe?.parentId).toBe("2");
  });

  it("빈 배열에서 빈 배열을 반환한다", () => {
    expect(treeToRawNodes([])).toHaveLength(0);
  });
});
