import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import {
  parseExcel,
  guessNameColumn,
  guessTitleColumn,
} from "./excel";

function makeExcelBuffer(
  sheets: Record<string, Record<string, unknown>[]>,
): Buffer {
  const wb = XLSX.utils.book_new();
  for (const [name, data] of Object.entries(sheets)) {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

describe("parseExcel", () => {
  it("단순 단일 시트를 파싱한다", () => {
    const buf = makeExcelBuffer({
      직원: [
        { 이름: "홍길동", 부서: "개발팀" },
        { 이름: "김영희", 부서: "기획팀" },
      ],
    });
    const result = parseExcel(buf);
    expect(result.warnings).toHaveLength(0);
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].headers).toEqual(["이름", "부서"]);
    expect(result.sheets[0].rows).toHaveLength(2);
    expect(result.sheets[0].rows[0]).toEqual({ 이름: "홍길동", 부서: "개발팀" });
  });

  it("다중 시트를 모두 파싱한다", () => {
    const buf = makeExcelBuffer({
      부서: [{ 부서명: "개발팀" }, { 부서명: "기획팀" }],
      직원: [{ 이름: "홍길동", 팀: "개발팀" }],
    });
    const result = parseExcel(buf);
    expect(result.sheets).toHaveLength(2);
    expect(result.sheets.map((s) => s.sheetName)).toEqual(["부서", "직원"]);
  });

  it("빈 행은 제외한다", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["이름", "부서"],
      ["홍길동", "개발팀"],
      ["", ""],
      ["김영희", "기획팀"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const result = parseExcel(buf);
    expect(result.sheets[0].rows).toHaveLength(2);
  });

  it("잘못된 바이너리에 warnings를 반환하고 crash하지 않는다", () => {
    // SheetJS가 일부 텍스트를 CSV로 파싱하므로 진짜 깨진 바이너리를 사용
    const garbage = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe]);
    const result = parseExcel(garbage);
    // crash 없이 반환해야 함 (sheets 비거나 warnings 있거나)
    expect(result.sheets.length + result.warnings.length).toBeGreaterThan(0);
  });
});

describe("guessNameColumn", () => {
  it("이름 컬럼을 추측한다", () => {
    expect(guessNameColumn(["부서", "이름", "직위"])).toBe("이름");
    expect(guessNameColumn(["dept", "name", "title"])).toBe("name");
    expect(guessNameColumn(["부서", "직위"])).toBeNull();
  });
});

describe("guessTitleColumn", () => {
  it("부서/직위 컬럼을 추측한다", () => {
    expect(guessTitleColumn(["이름", "부서", "직급"])).toBe("부서");
    expect(guessTitleColumn(["name", "dept", "title"])).toBe("dept");
    expect(guessTitleColumn(["이름", "나이"])).toBeNull();
  });
});
