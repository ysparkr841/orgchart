import { describe, test, expect } from "vitest";
import { generateReactCode, generateVueCode } from "./codeExporter";
import type { TreeNode } from "@/lib/tree/builder";

const singleNode: TreeNode = {
  id: "1",
  title: "대표이사",
  name: "홍길동",
  order: 0,
  children: [],
};

const treeWithChildren: TreeNode[] = [
  {
    id: "root",
    title: "CEO",
    name: "홍길동",
    order: 0,
    children: [
      { id: "child1", title: "CTO", name: "김철수", order: 0, children: [] },
      { id: "child2", title: "CFO", name: "이영희", order: 1, children: [] },
    ],
  },
];

describe("generateReactCode", () => {
  test("root node 제목이 포함된다", () => {
    const code = generateReactCode([singleNode]);
    expect(code).toContain('"대표이사"');
    expect(code).toContain('"홍길동"');
  });

  test("자식 노드 데이터가 포함된다", () => {
    const code = generateReactCode(treeWithChildren);
    expect(code).toContain('"CTO"');
    expect(code).toContain('"김철수"');
    expect(code).toContain('"CFO"');
  });

  test("OrgChart 기본 export 컴포넌트가 포함된다", () => {
    const code = generateReactCode([singleNode]);
    expect(code).toContain("export default function OrgChart()");
  });

  test("OrgNodeCard 재귀 컴포넌트가 포함된다", () => {
    const code = generateReactCode([singleNode]);
    expect(code).toContain("function OrgNodeCard");
    expect(code).toContain("<OrgNodeCard key={child.id}");
  });

  test("빈 트리도 에러 없이 생성된다", () => {
    const code = generateReactCode([]);
    expect(code).toContain("ORG_DATA");
    expect(code).not.toContain('"CEO"');
  });

  test("id에 특수문자가 있으면 JSON.stringify로 이스케이프된다", () => {
    const node: TreeNode = { id: 'id"quote', title: "test", order: 0, children: [] };
    const code = generateReactCode([node]);
    expect(code).toContain('"id\\"quote"');
  });

  test("name이 없는 노드는 빈 문자열로 처리된다", () => {
    const code = generateReactCode([singleNode]);
    const node: TreeNode = { id: "x", title: "노드", order: 0, children: [] };
    const c = generateReactCode([node]);
    expect(c).toContain('name: ""');
  });
});

describe("generateVueCode", () => {
  test("root node 제목이 포함된다", () => {
    const code = generateVueCode([singleNode]);
    expect(code).toContain('"대표이사"');
    expect(code).toContain('"홍길동"');
  });

  test("자식 노드 데이터가 포함된다", () => {
    const code = generateVueCode(treeWithChildren);
    expect(code).toContain('"CTO"');
    expect(code).toContain('"CFO"');
  });

  test("Vue SFC 구조(template/script/style)가 포함된다", () => {
    const code = generateVueCode([singleNode]);
    expect(code).toContain("<template>");
    expect(code).toContain("<script>");
    expect(code).toContain("<style");
  });

  test("OrgNodeCard 재귀 컴포넌트가 포함된다", () => {
    const code = generateVueCode([singleNode]);
    expect(code).toContain("OrgNodeCard");
    expect(code).toContain("v-for");
  });

  test("빈 트리도 에러 없이 생성된다", () => {
    const code = generateVueCode([]);
    expect(code).toContain("orgData");
    expect(code).not.toContain('"CEO"');
  });
});
