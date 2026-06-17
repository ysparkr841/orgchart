import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { exportToExcel } from "./excelExporter";
import type { RawNode } from "@/lib/tree/builder";

const SAMPLE_NODES: RawNode[] = [
  { id: "1", title: "대표이사", name: "김철수", parentId: undefined, order: 0 },
  { id: "2", title: "개발팀장", name: "이영희", parentId: "1", order: 1 },
  { id: "3", title: "디자이너", name: "박민준", parentId: "1", order: 2, color: "#ff0000" },
];

function parseBuffer(buf: Buffer) {
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets["OrgChart"];
  return XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);
}

describe("exportToExcel", () => {
  it("Buffer를 반환한다", () => {
    const result = exportToExcel(SAMPLE_NODES);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it("헤더 행이 올바르다", () => {
    const buf = exportToExcel(SAMPLE_NODES);
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets["OrgChart"];
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
    expect(rows[0]).toEqual(["id", "title", "name", "parentId", "order", "color", "avatarUrl"]);
  });

  it("노드 수만큼 데이터 행이 생성된다", () => {
    const buf = exportToExcel(SAMPLE_NODES);
    const rows = parseBuffer(buf);
    expect(rows).toHaveLength(3);
  });

  it("노드 데이터가 올바르게 기록된다", () => {
    const buf = exportToExcel(SAMPLE_NODES);
    const rows = parseBuffer(buf);
    expect(rows[0]).toMatchObject({ id: "1", title: "대표이사", name: "김철수", parentId: "", order: 0 });
    expect(rows[1]).toMatchObject({ id: "2", title: "개발팀장", name: "이영희", parentId: "1", order: 1 });
  });

  it("optional 필드가 빈 문자열로 처리된다", () => {
    const buf = exportToExcel([{ id: "1", title: "대표이사" }]);
    const rows = parseBuffer(buf);
    expect(rows[0]).toMatchObject({ name: "", parentId: "", color: "", avatarUrl: "" });
  });

  it("color 필드가 기록된다", () => {
    const buf = exportToExcel(SAMPLE_NODES);
    const rows = parseBuffer(buf);
    expect(rows[2]).toMatchObject({ color: "#ff0000" });
  });

  it("빈 노드 배열이면 헤더만 있는 파일을 생성한다", () => {
    const buf = exportToExcel([]);
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets["OrgChart"];
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(["id", "title", "name", "parentId", "order", "color", "avatarUrl"]);
  });

  it("시트 이름이 OrgChart다", () => {
    const buf = exportToExcel(SAMPLE_NODES);
    const wb = XLSX.read(buf, { type: "buffer" });
    expect(wb.SheetNames).toContain("OrgChart");
  });
});
