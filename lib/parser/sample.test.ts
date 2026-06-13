import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import { parseExcel, guessNameColumn, guessTitleColumn, guessParentColumn } from "./excel";

const SAMPLE_DIR = path.join(process.cwd(), "tests", "sample_data");

function readSample(filename: string): Buffer {
  return fs.readFileSync(path.join(SAMPLE_DIR, filename));
}

describe("샘플 데이터 — simple_org.csv", () => {
  it("헤더와 행 수가 정확하다", () => {
    const buf = readSample("simple_org.csv");
    const result = parseExcel(buf);
    expect(result.warnings).toHaveLength(0);
    expect(result.sheets).toHaveLength(1);
    const sheet = result.sheets[0];
    expect(sheet.headers).toEqual(["id", "name", "title", "parent_id"]);
    expect(sheet.rows).toHaveLength(12);
  });

  it("루트 노드(parent_id 없음)가 1개다", () => {
    const buf = readSample("simple_org.csv");
    const { sheets } = parseExcel(buf);
    const roots = sheets[0].rows.filter(
      (r) => r["parent_id"] === "" || r["parent_id"] == null,
    );
    expect(roots).toHaveLength(1);
    expect(roots[0]["name"]).toBe("이재현");
  });

  it("guessNameColumn이 'name'을 감지한다", () => {
    const buf = readSample("simple_org.csv");
    const { sheets } = parseExcel(buf);
    expect(guessNameColumn(sheets[0].headers)).toBe("name");
  });

  it("guessParentColumn이 'parent_id'를 감지한다", () => {
    const buf = readSample("simple_org.csv");
    const { sheets } = parseExcel(buf);
    expect(guessParentColumn(sheets[0].headers)).toBe("parent_id");
  });
});

describe("샘플 데이터 — simple_org.xlsx", () => {
  it("단일 시트 '조직도' 파싱 — 12행", () => {
    const buf = readSample("simple_org.xlsx");
    const result = parseExcel(buf);
    expect(result.warnings).toHaveLength(0);
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].sheetName).toBe("조직도");
    expect(result.sheets[0].rows).toHaveLength(12);
  });

  it("CSV와 동일한 데이터를 포함한다", () => {
    const buf = readSample("simple_org.xlsx");
    const { sheets } = parseExcel(buf);
    const names = sheets[0].rows.map((r) => r["name"]);
    expect(names).toContain("이재현");
    expect(names).toContain("박준호");
  });
});

describe("샘플 데이터 — hospital_multi.xlsx (멀티 시트)", () => {
  it("'부서'와 '직원' 두 시트를 파싱한다", () => {
    const buf = readSample("hospital_multi.xlsx");
    const result = parseExcel(buf);
    expect(result.warnings).toHaveLength(0);
    expect(result.sheets).toHaveLength(2);
    expect(result.sheets.map((s) => s.sheetName)).toEqual(["부서", "직원"]);
  });

  it("부서 시트: 8개 부서, 루트 1개", () => {
    const buf = readSample("hospital_multi.xlsx");
    const { sheets } = parseExcel(buf);
    const deptSheet = sheets.find((s) => s.sheetName === "부서")!;
    expect(deptSheet.rows).toHaveLength(8);
    const roots = deptSheet.rows.filter(
      (r) => r["parent_dept_id"] === "" || r["parent_dept_id"] == null,
    );
    expect(roots).toHaveLength(1);
    expect(roots[0]["dept_name"]).toBe("한국종합병원");
  });

  it("직원 시트: 12명, dept_id 외래키 존재", () => {
    const buf = readSample("hospital_multi.xlsx");
    const { sheets } = parseExcel(buf);
    const staffSheet = sheets.find((s) => s.sheetName === "직원")!;
    expect(staffSheet.rows).toHaveLength(12);
    expect(staffSheet.headers).toContain("dept_id");
  });
});

describe("샘플 데이터 — hospital CSV 쌍 (멀티 파일 관계 추론용)", () => {
  it("departments.csv: 8개 부서", () => {
    const buf = readSample("hospital_departments.csv");
    const { sheets } = parseExcel(buf);
    expect(sheets[0].rows).toHaveLength(8);
    expect(sheets[0].headers).toEqual(["dept_id", "dept_name", "parent_dept_id"]);
  });

  it("staff.csv: 12명, dept_id 컬럼으로 departments.csv와 조인 가능", () => {
    const deptBuf = readSample("hospital_departments.csv");
    const staffBuf = readSample("hospital_staff.csv");
    const deptSheet = parseExcel(deptBuf).sheets[0];
    const staffSheet = parseExcel(staffBuf).sheets[0];

    const deptIds = new Set(deptSheet.rows.map((r) => String(r["dept_id"])));
    const staffDeptIds = staffSheet.rows.map((r) => String(r["dept_id"]));
    // 모든 직원의 dept_id가 부서 테이블에 존재해야 한다
    for (const did of staffDeptIds) {
      expect(deptIds.has(did)).toBe(true);
    }
  });
});
