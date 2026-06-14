import { describe, test, expect } from "vitest";
import { searchNodes } from "./search";
import type { TreeNode } from "./builder";

function makeNode(
  id: string,
  title: string,
  name?: string,
  children: TreeNode[] = [],
): TreeNode {
  return { id, title, name, children, order: 0 };
}

const tree: TreeNode[] = [
  makeNode("1", "개발팀", undefined, [
    makeNode("2", "프론트엔드", "김철수"),
    makeNode("3", "백엔드", "이영희"),
  ]),
  makeNode("4", "인사팀", "박민준"),
];

describe("searchNodes", () => {
  test("빈 쿼리는 빈 Set 반환", () => {
    expect(searchNodes(tree, "").size).toBe(0);
    expect(searchNodes(tree, "  ").size).toBe(0);
  });

  test("직책(title) 기준 매칭", () => {
    const result = searchNodes(tree, "개발");
    expect(result.has("1")).toBe(true);
    expect(result.has("4")).toBe(false);
  });

  test("이름(name) 기준 매칭", () => {
    const result = searchNodes(tree, "김철수");
    expect(result.has("2")).toBe(true);
    expect(result.has("1")).toBe(false);
  });

  test("대소문자 구분 없이 매칭", () => {
    const eng = [makeNode("a", "Frontend", "John Doe")];
    expect(searchNodes(eng, "frontend").has("a")).toBe(true);
    expect(searchNodes(eng, "JOHN").has("a")).toBe(true);
  });

  test("중첩 노드 매칭", () => {
    const result = searchNodes(tree, "이영희");
    expect(result.has("3")).toBe(true);
    expect(result.has("1")).toBe(false);
  });

  test("부분 문자열 매칭", () => {
    const result = searchNodes(tree, "팀");
    expect(result.has("1")).toBe(true); // 개발팀
    expect(result.has("4")).toBe(true); // 인사팀
    expect(result.has("2")).toBe(false);
  });

  test("빈 트리는 빈 Set 반환", () => {
    expect(searchNodes([], "검색어").size).toBe(0);
  });
});
