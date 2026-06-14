import type { ExcelParseResult, SheetResult, ParsedRow } from "./excel";

interface HrisEmployee {
  id: string;
  name: string;
  title: string;
  department: string;
  managerId: string;
}

function extractXmlTagText(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function parseXmlEmployees(xmlText: string): HrisEmployee[] {
  const employeeBlocks = xmlText.match(/<employee[^>]*>[\s\S]*?<\/employee>/gi) ?? [];
  return employeeBlocks.map((block) => ({
    id:
      extractXmlTagText(block, "id") ||
      extractXmlTagText(block, "empId") ||
      extractXmlTagText(block, "employeeId"),
    name:
      extractXmlTagText(block, "name") ||
      extractXmlTagText(block, "empName") ||
      extractXmlTagText(block, "fullName"),
    title:
      extractXmlTagText(block, "title") ||
      extractXmlTagText(block, "position") ||
      extractXmlTagText(block, "jobTitle"),
    department:
      extractXmlTagText(block, "department") ||
      extractXmlTagText(block, "dept") ||
      extractXmlTagText(block, "deptName"),
    managerId:
      extractXmlTagText(block, "managerId") ||
      extractXmlTagText(block, "mgrId") ||
      extractXmlTagText(block, "supervisorId"),
  }));
}

function parseJsonEmployees(jsonText: string): HrisEmployee[] {
  const data = JSON.parse(jsonText) as Record<string, unknown>;

  let rawList: unknown[] = [];
  if (Array.isArray(data)) {
    rawList = data;
  } else if (Array.isArray(data.employees)) {
    rawList = data.employees as unknown[];
  } else if (Array.isArray(data.data)) {
    rawList = data.data as unknown[];
  } else if (Array.isArray(data.members)) {
    rawList = data.members as unknown[];
  }

  return rawList.map((emp) => {
    const e = emp as Record<string, unknown>;
    return {
      id: String(e.id ?? e.empId ?? e.employeeId ?? ""),
      name: String(e.name ?? e.empName ?? e.fullName ?? ""),
      title: String(e.title ?? e.position ?? e.jobTitle ?? ""),
      department: String(e.department ?? e.dept ?? e.deptName ?? ""),
      managerId: String(e.managerId ?? e.mgrId ?? e.supervisorId ?? e.parentId ?? ""),
    };
  });
}

function buildSheetResult(employees: HrisEmployee[]): SheetResult {
  const idToName = new Map<string, string>();
  for (const emp of employees) {
    if (emp.id) idToName.set(emp.id, emp.name);
  }

  const rows: ParsedRow[] = employees.map((emp) => ({
    이름: emp.name,
    직위: emp.title || emp.department,
    부서: emp.department,
    상위: emp.managerId ? (idToName.get(emp.managerId) ?? emp.managerId) : "",
  }));

  return {
    sheetName: "HRIS 파싱 결과",
    headers: ["이름", "직위", "부서", "상위"],
    rows,
  };
}

export async function parseHris(buffer: Buffer): Promise<ExcelParseResult> {
  const text = buffer.toString("utf-8").trim();

  if (!text) {
    return { sheets: [], warnings: ["HRIS 파일이 비어 있습니다."] };
  }

  try {
    let employees: HrisEmployee[];

    if (text.startsWith("<")) {
      employees = parseXmlEmployees(text);
      if (employees.length === 0) {
        return {
          sheets: [],
          warnings: [
            "HRIS XML에서 직원 데이터를 찾을 수 없습니다. <employee> 태그를 확인해 주세요.",
          ],
        };
      }
    } else {
      employees = parseJsonEmployees(text);
      if (employees.length === 0) {
        return {
          sheets: [],
          warnings: [
            "HRIS JSON에서 직원 데이터를 찾을 수 없습니다. employees/data/members 배열을 확인해 주세요.",
          ],
        };
      }
    }

    const unnamed = employees.filter((e) => !e.name).length;
    const warnings: string[] = [];
    if (unnamed > 0) {
      warnings.push(`이름 필드가 없는 직원 ${unnamed}명은 제외되었습니다.`);
    }

    const validEmployees = employees.filter((e) => e.name);
    const sheet = buildSheetResult(validEmployees);

    return { sheets: [sheet], warnings };
  } catch (err) {
    return {
      sheets: [],
      warnings: [`HRIS 파싱 실패: ${String(err)}. 파일 형식(XML/JSON)을 확인해 주세요.`],
    };
  }
}
