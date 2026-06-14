import { describe, it, expect } from "vitest";
import { rowsToNodes } from "./rowsToNodes";
import type { ColumnMapping } from "@/lib/store/mapping-store";
import type { SheetResult } from "@/lib/parser/excel";

const sheet = (
  name: string,
  rows: Record<string, unknown>[],
): SheetResult => ({
  sheetName: name,
  rows,
  headers: rows.length > 0 ? Object.keys(rows[0]) : [],
});

const mapping = (
  overrides: Partial<ColumnMapping> & Pick<ColumnMapping, "sheetName" | "fileId">,
): ColumnMapping => ({
  nameColumn: null,
  titleColumn: null,
  parentColumn: null,
  ...overrides,
});

describe("rowsToNodes", () => {
  it("빈 매핑이면 빈 배열을 반환한다", () => {
    const result = rowsToNodes([], []);
    expect(result).toEqual([]);
  });

  it("nameColumn만 있으면 title을 name 값으로 설정한다", () => {
    const rows = [{ name: "CEO" }, { name: "CTO" }];
    const result = rowsToNodes(
      [sheet("Sheet1", rows)],
      [mapping({ fileId: "f1", sheetName: "Sheet1", nameColumn: "name" })],
    );
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("CEO");
    expect(result[0].name).toBe("CEO");
    expect(result[1].title).toBe("CTO");
  });

  it("titleColumn이 있으면 title을 titleColumn 값으로 설정한다", () => {
    const rows = [
      { 직위: "대표이사", 이름: "홍길동" },
      { 직위: "기술이사", 이름: "김철수" },
    ];
    const result = rowsToNodes(
      [sheet("S1", rows)],
      [
        mapping({
          fileId: "f1",
          sheetName: "S1",
          titleColumn: "직위",
          nameColumn: "이름",
        }),
      ],
    );
    expect(result[0].title).toBe("대표이사");
    expect(result[0].name).toBe("홍길동");
    expect(result[1].title).toBe("기술이사");
    expect(result[1].name).toBe("김철수");
  });

  it("parentColumn 값이 다른 노드의 title과 일치하면 parentId를 설정한다", () => {
    const rows = [
      { title: "CEO", parent: "" },
      { title: "CTO", parent: "CEO" },
      { title: "CFO", parent: "CEO" },
    ];
    const result = rowsToNodes(
      [sheet("S1", rows)],
      [
        mapping({
          fileId: "f1",
          sheetName: "S1",
          titleColumn: "title",
          parentColumn: "parent",
        }),
      ],
    );
    expect(result[0].parentId).toBeUndefined();
    expect(result[1].parentId).toBe(result[0].id);
    expect(result[2].parentId).toBe(result[0].id);
  });

  it("자기 자신을 가리키는 parent는 무시한다", () => {
    const rows = [{ title: "CEO", parent: "CEO" }];
    const result = rowsToNodes(
      [sheet("S1", rows)],
      [
        mapping({
          fileId: "f1",
          sheetName: "S1",
          titleColumn: "title",
          parentColumn: "parent",
        }),
      ],
    );
    expect(result[0].parentId).toBeUndefined();
  });

  it("존재하지 않는 parent title은 parentId를 설정하지 않는다", () => {
    const rows = [{ title: "CTO", parent: "NonExistent" }];
    const result = rowsToNodes(
      [sheet("S1", rows)],
      [
        mapping({
          fileId: "f1",
          sheetName: "S1",
          titleColumn: "title",
          parentColumn: "parent",
        }),
      ],
    );
    expect(result[0].parentId).toBeUndefined();
  });

  it("nameColumn과 titleColumn 모두 없으면 해당 매핑은 건너뛴다", () => {
    const rows = [{ x: "a" }];
    const result = rowsToNodes(
      [sheet("S1", rows)],
      [mapping({ fileId: "f1", sheetName: "S1" })],
    );
    expect(result).toHaveLength(0);
  });

  it("매핑의 sheetName과 일치하는 시트가 없으면 건너뛴다", () => {
    const result = rowsToNodes(
      [sheet("Sheet1", [{ name: "CEO" }])],
      [mapping({ fileId: "f1", sheetName: "Sheet2", nameColumn: "name" })],
    );
    expect(result).toHaveLength(0);
  });

  it("row 값이 undefined여도 빈 문자열로 처리한다", () => {
    const rows = [{ title: undefined }];
    const result = rowsToNodes(
      [sheet("S1", rows)],
      [
        mapping({
          fileId: "f1",
          sheetName: "S1",
          titleColumn: "title",
        }),
      ],
    );
    expect(result[0].title).toBe("");
  });

  it("id는 fileId__sheetName__rowIndex 형식이다", () => {
    const rows = [{ name: "A" }, { name: "B" }];
    const result = rowsToNodes(
      [sheet("Sheet1", rows)],
      [mapping({ fileId: "file1", sheetName: "Sheet1", nameColumn: "name" })],
    );
    expect(result[0].id).toBe("file1__Sheet1__0");
    expect(result[1].id).toBe("file1__Sheet1__1");
  });

  it("row 전체를 meta 필드에 저장한다", () => {
    const rows = [{ title: "CEO", dept: "경영지원" }];
    const result = rowsToNodes(
      [sheet("S1", rows)],
      [mapping({ fileId: "f1", sheetName: "S1", titleColumn: "title" })],
    );
    expect(result[0].meta).toEqual({ title: "CEO", dept: "경영지원" });
  });

  it("여러 매핑(시트)을 연속으로 처리하여 통합 노드 배열을 반환한다", () => {
    const sheet1 = sheet("임원", [{ 이름: "CEO" }]);
    const sheet2 = sheet("팀장", [{ 이름: "팀장A" }, { 이름: "팀장B" }]);
    const result = rowsToNodes(
      [sheet1, sheet2],
      [
        mapping({ fileId: "f1", sheetName: "임원", nameColumn: "이름" }),
        mapping({ fileId: "f1", sheetName: "팀장", nameColumn: "이름" }),
      ],
    );
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe("CEO");
    expect(result[1].title).toBe("팀장A");
    expect(result[2].title).toBe("팀장B");
  });
});
