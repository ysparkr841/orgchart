import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import * as XLSX from "xlsx";

const mocks = vi.hoisted(() => ({
  projectFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: mocks.projectFindUnique,
    },
  },
}));

import { GET } from "./route";

describe("GET /api/export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("projectId 쿼리 파라미터가 없으면 400을 반환한다", async () => {
    const req = new NextRequest("http://localhost/api/export");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/projectId/);
  });

  it("프로젝트가 없으면 404를 반환한다", async () => {
    mocks.projectFindUnique.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/export?projectId=nonexistent");
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("노드 목록을 JSON attachment로 반환한다", async () => {
    mocks.projectFindUnique.mockResolvedValue({
      id: "p1",
      name: "테스트",
      nodes: [
        { id: "n1", title: "대표이사", name: null, parentId: null, order: 0 },
        { id: "n2", title: "부장", name: "김철수", parentId: "n1", order: 1 },
      ],
    });

    const req = new NextRequest("http://localhost/api/export?projectId=p1");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
    expect(res.headers.get("Content-Disposition")).toContain("p1");

    const body = (await res.json()) as { id: string }[];
    expect(body).toHaveLength(2);
    expect(body[0].id).toBe("n1");
    expect(body[1].id).toBe("n2");
  });

  it("format=xlsx 이면 XLSX 파일을 반환한다", async () => {
    mocks.projectFindUnique.mockResolvedValue({
      id: "p1",
      name: "테스트",
      nodes: [
        { id: "n1", title: "대표이사", name: null, parentId: null, order: 0 },
      ],
    });

    const req = new NextRequest("http://localhost/api/export?projectId=p1&format=xlsx");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("spreadsheetml");
    expect(res.headers.get("Content-Disposition")).toContain(".xlsx");

    const buf = Buffer.from(await res.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    expect(wb.SheetNames).toContain("OrgChart");
  });

  it("format이 유효하지 않으면 400을 반환한다", async () => {
    const req = new NextRequest("http://localhost/api/export?projectId=p1&format=csv");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/format/);
  });
});
