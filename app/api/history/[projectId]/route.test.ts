import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

type MockFn = ReturnType<typeof vi.fn>;

interface MockTx {
  node: { deleteMany: MockFn; create: MockFn };
  projectSnapshot: { create: MockFn };
}

const mocks = vi.hoisted(() => ({
  projectFindUnique: vi.fn(),
  snapshotFindMany: vi.fn(),
  snapshotFindFirst: vi.fn(),
  transaction: vi.fn(),
  txNodeDeleteMany: vi.fn(),
  txNodeCreate: vi.fn(),
  txSnapshotCreate: vi.fn(),
  topologicalSort: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findUnique: mocks.projectFindUnique },
    projectSnapshot: {
      findMany: mocks.snapshotFindMany,
      findFirst: mocks.snapshotFindFirst,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/tree/builder", () => ({
  topologicalSort: mocks.topologicalSort,
}));

import { GET, POST } from "./route";

const makeParams = (projectId: string) => ({ params: { projectId } });

describe("GET /api/history/[projectId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("프로젝트가 없으면 404를 반환한다", async () => {
    mocks.projectFindUnique.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/history/p1");
    const res = await GET(req, makeParams("p1"));
    expect(res.status).toBe(404);
  });

  it("스냅샷 목록과 각 스냅샷의 nodeCount를 반환한다", async () => {
    mocks.projectFindUnique.mockResolvedValue({ id: "p1", name: "테스트" });
    mocks.snapshotFindMany.mockResolvedValue([
      {
        id: "s1",
        createdAt: new Date("2024-01-01"),
        nodes: JSON.stringify([{ id: "n1", title: "대표이사", order: 0 }]),
      },
      {
        id: "s2",
        createdAt: new Date("2024-01-02"),
        nodes: JSON.stringify([
          { id: "n1", title: "대표이사", order: 0 },
          { id: "n2", title: "부장", order: 1 },
        ]),
      },
    ]);

    const req = new NextRequest("http://localhost/api/history/p1");
    const res = await GET(req, makeParams("p1"));

    expect(res.status).toBe(200);
    const data = (await res.json()) as { snapshots: { id: string; nodeCount: number }[] };
    expect(data.snapshots).toHaveLength(2);
    expect(data.snapshots[0]).toMatchObject({ id: "s1", nodeCount: 1 });
    expect(data.snapshots[1]).toMatchObject({ id: "s2", nodeCount: 2 });
  });
});

describe("POST /api/history/[projectId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.topologicalSort.mockImplementation((nodes: unknown[]) => nodes);
    mocks.txNodeDeleteMany.mockResolvedValue({ count: 0 });
    mocks.txNodeCreate.mockResolvedValue({ id: "n1" });
    mocks.txSnapshotCreate.mockResolvedValue({ id: "s-new" });
    mocks.transaction.mockImplementation(async (cb: (tx: MockTx) => Promise<void>) => {
      await cb({
        node: { deleteMany: mocks.txNodeDeleteMany, create: mocks.txNodeCreate },
        projectSnapshot: { create: mocks.txSnapshotCreate },
      });
    });
  });

  function makeReq(projectId: string, body: unknown) {
    return new NextRequest(`http://localhost/api/history/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("JSON 파싱 실패 시 400을 반환한다", async () => {
    const req = new NextRequest("http://localhost/api/history/p1", {
      method: "POST",
      body: "not-valid-json{{{",
    });
    const res = await POST(req, makeParams("p1"));
    expect(res.status).toBe(400);
  });

  it("snapshotId가 없으면 400을 반환한다", async () => {
    const req = makeReq("p1", { other: "value" });
    const res = await POST(req, makeParams("p1"));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/snapshotId/);
  });

  it("스냅샷이 없으면 404를 반환한다", async () => {
    mocks.snapshotFindFirst.mockResolvedValue(null);
    const req = makeReq("p1", { snapshotId: "s-nonexistent" });
    const res = await POST(req, makeParams("p1"));
    expect(res.status).toBe(404);
  });

  it("복원 성공 시 200과 projectId, nodeCount를 반환한다", async () => {
    const nodes = [{ id: "n1", title: "대표이사", order: 0 }];
    mocks.snapshotFindFirst.mockResolvedValue({
      id: "s1",
      projectId: "p1",
      nodes: JSON.stringify(nodes),
    });

    const req = makeReq("p1", { snapshotId: "s1" });
    const res = await POST(req, makeParams("p1"));

    expect(res.status).toBe(200);
    const data = (await res.json()) as { projectId: string; nodeCount: number };
    expect(data.projectId).toBe("p1");
    expect(data.nodeCount).toBe(1);
    expect(mocks.topologicalSort).toHaveBeenCalledOnce();
    expect(mocks.txNodeDeleteMany).toHaveBeenCalledOnce();
    expect(mocks.txSnapshotCreate).toHaveBeenCalledOnce();
  });

  it("트랜잭션 실패 시 500을 반환한다", async () => {
    mocks.snapshotFindFirst.mockResolvedValue({
      id: "s1",
      projectId: "p1",
      nodes: JSON.stringify([{ id: "n1", title: "대표이사", order: 0 }]),
    });
    mocks.transaction.mockRejectedValue(new Error("DB 오류"));

    const req = makeReq("p1", { snapshotId: "s1" });
    const res = await POST(req, makeParams("p1"));
    expect(res.status).toBe(500);
  });
});
