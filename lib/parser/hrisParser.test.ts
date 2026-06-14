import { describe, it, expect } from "vitest";
import { parseHris } from "./hrisParser";

function buf(text: string): Buffer {
  return Buffer.from(text, "utf-8");
}

const XML_SIMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<employees>
  <employee>
    <id>1</id>
    <name>홍길동</name>
    <title>대표이사</title>
    <department>경영진</department>
    <managerId></managerId>
  </employee>
  <employee>
    <id>2</id>
    <name>김철수</name>
    <title>이사</title>
    <department>영업부</department>
    <managerId>1</managerId>
  </employee>
  <employee>
    <id>3</id>
    <name>이영희</name>
    <title>과장</title>
    <department>영업부</department>
    <managerId>2</managerId>
  </employee>
</employees>`;

const JSON_STANDARD = JSON.stringify({
  employees: [
    { id: "1", name: "홍길동", title: "대표이사", department: "경영진", managerId: "" },
    { id: "2", name: "김철수", title: "이사", department: "영업부", managerId: "1" },
    { id: "3", name: "이영희", title: "과장", department: "영업부", managerId: "2" },
  ],
});

const JSON_ARRAY_ROOT = JSON.stringify([
  { id: "1", name: "박지성", position: "CEO", dept: "경영", mgrId: "" },
  { id: "2", name: "손흥민", position: "CTO", dept: "기술", mgrId: "1" },
]);

describe("parseHris — XML", () => {
  it("표준 XML 구조에서 직원 목록을 파싱한다", async () => {
    const result = await parseHris(buf(XML_SIMPLE));
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].rows).toHaveLength(3);
    expect(result.warnings).toHaveLength(0);
  });

  it("최상위 직원(managerId 없음)의 상위는 빈 문자열", async () => {
    const result = await parseHris(buf(XML_SIMPLE));
    const root = result.sheets[0].rows[0];
    expect(root["이름"]).toBe("홍길동");
    expect(root["상위"]).toBe("");
  });

  it("하위 직원의 상위는 managerId에 해당하는 이름으로 변환", async () => {
    const result = await parseHris(buf(XML_SIMPLE));
    const child = result.sheets[0].rows[1];
    expect(child["이름"]).toBe("김철수");
    expect(child["상위"]).toBe("홍길동");
  });

  it("XML 태그가 없으면 경고를 반환한다", async () => {
    const result = await parseHris(buf("<root><item>test</item></root>"));
    expect(result.sheets).toHaveLength(0);
    expect(result.warnings[0]).toContain("<employee>");
  });
});

describe("parseHris — JSON", () => {
  it("employees 배열을 포함하는 JSON을 파싱한다", async () => {
    const result = await parseHris(buf(JSON_STANDARD));
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].rows).toHaveLength(3);
    expect(result.warnings).toHaveLength(0);
  });

  it("루트가 배열인 JSON을 파싱한다", async () => {
    const result = await parseHris(buf(JSON_ARRAY_ROOT));
    expect(result.sheets[0].rows).toHaveLength(2);
    expect(result.sheets[0].rows[1]["이름"]).toBe("손흥민");
  });

  it("별칭 필드(position, dept, mgrId)를 올바르게 매핑한다", async () => {
    const result = await parseHris(buf(JSON_ARRAY_ROOT));
    const ceo = result.sheets[0].rows[0];
    expect(ceo["직위"]).toBe("CEO");
    expect(ceo["부서"]).toBe("경영");
    expect(ceo["상위"]).toBe("");
  });

  it("빈 파일은 경고를 반환한다", async () => {
    const result = await parseHris(buf(""));
    expect(result.sheets).toHaveLength(0);
    expect(result.warnings[0]).toContain("비어 있습니다");
  });

  it("올바르지 않은 JSON은 경고를 반환한다", async () => {
    const result = await parseHris(buf("{invalid json}"));
    expect(result.sheets).toHaveLength(0);
    expect(result.warnings[0]).toContain("파싱 실패");
  });
});
