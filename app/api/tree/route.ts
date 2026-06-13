import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { topologicalSort } from "@/lib/tree/builder";
import type { RawNode } from "@/lib/tree/builder";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { nodes: true } } },
    });
    return NextResponse.json({ projects });
  } catch (err) {
    console.error("[GET /api/tree]", err);
    return NextResponse.json({ error: "DB 조회 실패" }, { status: 500 });
  }
}

interface SaveTreeBody {
  name: string;
  nodes: RawNode[];
  projectId?: string;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON 파싱 실패" }, { status: 400 });
  }

  const { name, nodes, projectId } = body as SaveTreeBody;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name 필드가 필요합니다." }, { status: 400 });
  }
  if (!Array.isArray(nodes)) {
    return NextResponse.json({ error: "nodes는 배열이어야 합니다." }, { status: 400 });
  }

  const sorted = topologicalSort(nodes);

  try {
    let pid = projectId;

    if (pid) {
      const existing = await prisma.project.findUnique({ where: { id: pid } });
      if (!existing) {
        return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
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

    return NextResponse.json({ projectId: pid }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/tree]", err);
    return NextResponse.json({ error: "DB 저장 실패" }, { status: 500 });
  }
}
