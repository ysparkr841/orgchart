import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

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

describe("GET /api/tree/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("존재하는 프로젝트를 조회하면 200과 노드 목록을 반환한다", async () => {
    mocks.projectFindUnique.mockResolvedValue({
      id: "p1",
      name: "테스트 조직도",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
      nodes: [
        { id: "n1", title: "대표이사", name: null, parentId: null, order: 0, meta: null },
        { id: "n2", title: "부장", name: "김철수", parentId: "n1", order: 1, meta: null },
      ],
    });

    const req = new NextRequest("http://localhost/api/tree/p1");
    const res = await GET(req, { params: { id: "p1" } });

    expect(res.status).toBe(200);
    const data = (await res.json()) as { projectId: string; name: string; nodes: unknown[] };
    expect(data.projectId).toBe("p1");
    expect(data.name).toBe("테스트 조직도");
    expect(data.nodes).toHaveLength(2);
    expect(mocks.projectFindUnique).toHaveBeenCalledWith({
      where: { id: "p1" },
      include: { nodes: { orderBy: { order: "asc" } } },
    });
  });

  it("존재하지 않는 프로젝트 조회 시 404를 반환한다", async () => {
    mocks.projectFindUnique.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/tree/nonexistent");
    const res = await GET(req, { params: { id: "nonexistent" } });

    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBeTruthy();
  });

  it("meta 필드가 JSON 문자열이면 파싱된 객체로 반환한다", async () => {
    mocks.projectFindUnique.mockResolvedValue({
      id: "p1",
      name: "테스트",
      createdAt: new Date(),
      updatedAt: new Date(),
      nodes: [
        {
          id: "n1",
          title: "대표이사",
          name: "홍길동",
          parentId: null,
          order: 0,
          meta: JSON.stringify({ department: "경영지원", level: 1 }),
        },
      ],
    });

    const req = new NextRequest("http://localhost/api/tree/p1");
    const res = await GET(req, { params: { id: "p1" } });
    const data = (await res.json()) as { nodes: { meta: { department: string; level: number } }[] };

    expect(data.nodes[0].meta).toEqual({ department: "경영지원", level: 1 });
  });
});
