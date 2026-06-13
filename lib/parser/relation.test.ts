import { describe, it, expect, vi, beforeEach } from "vitest";
import { inferFileRelations } from "./relation";
import type { FileInput } from "./relation";

// Ollama를 항상 미연결로 모킹
vi.mock("@/lib/ai/ollama", () => ({
  isOllamaAvailable: vi.fn().mockResolvedValue(false),
  chat: vi.fn(),
}));

const DEPT_FILE: FileInput = {
  fileId: "f1",
  fileName: "departments.xlsx",
  sheets: [
    {
      sheetName: "부서",
      headers: ["부서코드", "부서명", "상위부서코드"],
      rows: [
        { 부서코드: "D01", 부서명: "개발팀", 상위부서코드: "" },
        { 부서코드: "D02", 부서명: "기획팀", 상위부서코드: "D01" },
      ],
    },
  ],
};

const EMP_FILE: FileInput = {
  fileId: "f2",
  fileName: "employees.xlsx",
  sheets: [
    {
      sheetName: "직원",
      headers: ["직원번호", "이름", "부서코드", "직위"],
      rows: [
        { 직원번호: "E001", 이름: "홍길동", 부서코드: "D01", 직위: "팀장" },
        { 직원번호: "E002", 이름: "김영희", 부서코드: "D02", 직위: "사원" },
      ],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("inferFileRelations — 자기참조 감지", () => {
  it("상위부서코드 → 부서코드 자기참조를 감지한다", async () => {
    const result = await inferFileRelations([DEPT_FILE]);
    const selfRef = result.relations.find(
      (r) =>
        r.from.column === "상위부서코드" && r.to.column === "부서코드",
    );
    expect(selfRef).toBeDefined();
    expect(selfRef?.confidence).toBeGreaterThanOrEqual(0.8);
  });
});

describe("inferFileRelations — 파일 간 관계 감지", () => {
  it("두 파일에서 동일 컬럼명(부서코드)을 FK로 감지한다", async () => {
    const result = await inferFileRelations([DEPT_FILE, EMP_FILE]);
    const fk = result.relations.find(
      (r) =>
        r.from.column === "부서코드" &&
        r.to.column === "부서코드" &&
        r.from.fileId !== r.to.fileId,
    );
    expect(fk).toBeDefined();
    expect(fk?.method).toBe("heuristic");
  });

  it("단일 파일이면 파일 간 관계를 반환하지 않는다", async () => {
    const result = await inferFileRelations([DEPT_FILE]);
    const crossFile = result.relations.filter(
      (r) => r.from.fileId !== r.to.fileId,
    );
    expect(crossFile).toHaveLength(0);
  });

  it("Ollama 미연결 경고를 포함한다", async () => {
    const result = await inferFileRelations([DEPT_FILE, EMP_FILE]);
    expect(result.warnings.some((w) => w.includes("Ollama"))).toBe(true);
  });

  it("신뢰도 내림차순으로 정렬된다", async () => {
    const result = await inferFileRelations([DEPT_FILE, EMP_FILE]);
    const confs = result.relations.map((r) => r.confidence);
    for (let i = 1; i < confs.length; i++) {
      expect(confs[i - 1]).toBeGreaterThanOrEqual(confs[i]);
    }
  });
});

describe("inferFileRelations — 빈 입력", () => {
  it("파일이 없으면 빈 결과를 반환한다", async () => {
    const result = await inferFileRelations([]);
    expect(result.relations).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});
