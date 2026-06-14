import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { RawNode } from "@/lib/tree/builder";
import { topologicalSort } from "@/lib/tree/builder";

// 프로젝트 스냅샷 목록 조회 (최신순, 노드 데이터 제외하고 메타만 반환)
export async function GET(
  _req: NextRequest,
  { params }: { params: { projectId: string } },
) {
  const { projectId } = params;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  const snapshots = await prisma.projectSnapshot.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, createdAt: true, nodes: true },
  });

  const result = snapshots.map((s) => {
    const nodes = JSON.parse(s.nodes) as RawNode[];
    return { id: s.id, createdAt: s.createdAt, nodeCount: nodes.length };
  });

  return NextResponse.json({ snapshots: result });
}

// 특정 스냅샷으로 프로젝트 복원
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } },
) {
  const { projectId } = params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON 파싱 실패" }, { status: 400 });
  }

  const { snapshotId } = body as { snapshotId?: string };
  if (!snapshotId || typeof snapshotId !== "string") {
    return NextResponse.json({ error: "snapshotId가 필요합니다." }, { status: 400 });
  }

  const snapshot = await prisma.projectSnapshot.findFirst({
    where: { id: snapshotId, projectId },
  });
  if (!snapshot) {
    return NextResponse.json({ error: "스냅샷을 찾을 수 없습니다." }, { status: 404 });
  }

  const nodes = JSON.parse(snapshot.nodes) as RawNode[];
  const sorted = topologicalSort(nodes);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.node.deleteMany({ where: { projectId } });
      for (const raw of sorted) {
        await tx.node.create({
          data: {
            id: raw.id,
            projectId,
            parentId: raw.parentId ?? null,
            title: raw.title,
            name: raw.name ?? null,
            order: raw.order ?? 0,
            meta: raw.meta ? JSON.stringify(raw.meta) : null,
          },
        });
      }
      // 복원 자체도 스냅샷으로 기록
      await tx.projectSnapshot.create({
        data: { projectId, nodes: snapshot.nodes },
      });
    });

    return NextResponse.json({ projectId, nodeCount: sorted.length });
  } catch (err) {
    console.error("[POST /api/history/:projectId]", err);
    return NextResponse.json({ error: "복원 실패" }, { status: 500 });
  }
}
