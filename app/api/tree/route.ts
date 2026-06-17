import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { topologicalSort } from "@/lib/tree/builder";
import type { RawNode } from "@/lib/tree/builder";
import { apiError, serverError, parseJsonBody } from "@/lib/api/routeHelpers";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { nodes: true } } },
    });
    return NextResponse.json({ projects });
  } catch (err) {
    return serverError("[GET /api/tree]", err, "DB 조회 실패");
  }
}

interface SaveTreeBody {
  name: string;
  nodes: RawNode[];
  projectId?: string;
}

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody<SaveTreeBody>(req);
  if (!parsed.ok) return parsed.response;
  const { name, nodes, projectId } = parsed.data;

  if (!name || typeof name !== "string") {
    return apiError("name 필드가 필요합니다.", 400);
  }
  if (!Array.isArray(nodes)) {
    return apiError("nodes는 배열이어야 합니다.", 400);
  }

  const sorted = topologicalSort(nodes);

  try {
    let pid = projectId;

    if (pid) {
      const existing = await prisma.project.findUnique({ where: { id: pid } });
      if (!existing) {
        return apiError("프로젝트를 찾을 수 없습니다.", 404);
      }
      await prisma.project.update({ where: { id: pid }, data: { name } });
      await prisma.node.deleteMany({ where: { projectId: pid } });
    } else {
      const project = await prisma.project.create({ data: { name } });
      pid = project.id;
    }

    for (const raw of sorted) {
      await prisma.node.create({
        data: {
          id: raw.id,
          projectId: pid!,
          parentId: raw.parentId ?? null,
          title: raw.title,
          name: raw.name ?? null,
          order: raw.order ?? 0,
          meta: raw.meta ? JSON.stringify(raw.meta) : null,
        },
      });
    }

    // 저장 시점 스냅샷 기록 (변경 이력 추적)
    await prisma.projectSnapshot.create({
      data: { projectId: pid!, nodes: JSON.stringify(sorted) },
    });

    return NextResponse.json({ projectId: pid }, { status: 201 });
  } catch (err) {
    return serverError("[POST /api/tree]", err, "DB 저장 실패");
  }
}
