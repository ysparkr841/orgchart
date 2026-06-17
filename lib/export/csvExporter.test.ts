import { describe, it, expect } from "vitest";
import { exportToCsv } from "./csvExporter";
import type { RawNode } from "@/lib/tree/builder";

const SAMPLE_NODES: RawNode[] = [
  { id: "1", title: "대표이사", name: "김철수", parentId: undefined, order: 0 },
  { id: "2", title: "개발팀장", name: "이영희", parentId: "1", order: 1 },
  { id: "3", title: "디자이너", name: "박민준", parentId: "1", order: 2, color: "#ff0000" },
];

describe("exportToCsv", () => {
  it("문자열을 반환한다", () => {
    const result = exportToCsv(SAMPLE_NODES);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("첫 번째 행이 헤더다", () => {
    const csv = exportToCsv(SAMPLE_NODES);
    const firstLine = csv.split("\n")[0];
    expect(firstLine).toBe("id,title,name,parentId,order,color,avatarUrl");
  });

  it("노드 수만큼 데이터 행이 생성된다", () => {
    const csv = exportToCsv(SAMPLE_NODES);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(SAMPLE_NODES.length + 1); // 헤더 포함
  });

  it("노드 데이터가 올바르게 기록된다", () => {
    const csv = exportToCsv(SAMPLE_NODES);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("1,대표이사,김철수,,0,,");
    expect(lines[2]).toBe("2,개발팀장,이영희,1,1,,");
  });

  it("optional 필드가 빈 문자열로 처리된다", () => {
    const csv = exportToCsv([{ id: "1", title: "대표이사" }]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("1,대표이사,,,0,,");
  });

  it("color 필드가 기록된다", () => {
    const csv = exportToCsv(SAMPLE_NODES);
    const lines = csv.split("\n");
    expect(lines[3]).toContain("#ff0000");
  });

  it("빈 노드 배열이면 헤더만 있는 CSV를 생성한다", () => {
    const csv = exportToCsv([]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("id,title,name,parentId,order,color,avatarUrl");
  });

  it("쉼표가 포함된 값은 큰따옴표로 감싼다", () => {
    const csv = exportToCsv([{ id: "1", title: "영업, 마케팅" }]);
    const lines = csv.split("\n");
    expect(lines[1]).toContain('"영업, 마케팅"');
  });

  it("큰따옴표가 포함된 값은 이스케이프된다", () => {
    const csv = exportToCsv([{ id: "1", title: '김"철수"' }]);
    const lines = csv.split("\n");
    expect(lines[1]).toContain('"김""철수"""');
  });
});
