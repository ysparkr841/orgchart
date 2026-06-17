import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  projectFindMany: vi.fn(),
  projectFindUnique: vi.fn(),
  projectCreate: vi.fn(),
  projectUpdate: vi.fn(),
  nodeCreate: vi.fn(),
  nodeDeleteMany: vi.fn(),
  snapshotCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findMany: mocks.projectFindMany,
      findUnique: mocks.projectFindUnique,
      create: mocks.projectCreate,
      update: mocks.projectUpdate,
    },
    node: {
      create: mocks.nodeCreate,
      deleteMany: mocks.nodeDeleteMany,
    },
    projectSnapshot: {
      create: mocks.snapshotCreate,
    },
  },
}));

import { GET, POST } from "./route";

describe("GET /api/tree", () => {
  beforeEach(() => vi.clearAllMocks());

  it("프로젝트 목록을 반환한다", async () => {
    mocks.projectFindMany.mockResolvedValue([
      { id: "p1", name: "테스트", updatedAt: new Date(), createdAt: new Date(), _count: { nodes: 3 } },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = (await res.json()) as { projects: { id: string }[] };
    expect(data.projects).toHaveLength(1);
    expect(data.projects[0].id).toBe("p1");
  });

  it("DB 조회 실패 시 500을 반환한다", async () => {
    mocks.projectFindMany.mockRejectedValue(new Error("DB 오류"));
    const res = await GET();
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBeTruthy();
  });
});

describe("POST /api/tree", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.projectCreate.mockResolvedValue({ id: "new-pid", name: "테스트", createdAt: new Date(), updatedAt: new Date() });
    mocks.nodeCreate.mockResolvedValue({ id: "n1" });
    mocks.snapshotCreate.mockResolvedValue({ id: "s1" });
  });

  function makeReq(body: unknown) {
    return new NextRequest("http://localhost/api/tree", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("name이 없으면 400을 반환한다", async () => {
    const req = makeReq({ nodes: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("nodes가 배열이 아니면 400을 반환한다", async () => {
    const req = makeReq({ name: "테스트", nodes: "invalid" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("신규 프로젝트를 생성하고 201과 projectId를 반환한다", async () => {
    const req = makeReq({
      name: "테스트",
      nodes: [{ id: "n1", title: "대표이사", order: 0 }],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = (await res.json()) as { projectId: string };
    expect(data.projectId).toBe("new-pid");
    expect(mocks.projectCreate).toHaveBeenCalledWith({ data: { name: "테스트" } });
    expect(mocks.snapshotCreate).toHaveBeenCalledOnce();
  });

  it("존재하지 않는 projectId로 업데이트 시 404를 반환한다", async () => {
    mocks.projectFindUnique.mockResolvedValue(null);
    const req = makeReq({ name: "테스트", nodes: [], projectId: "non-existent" });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});
