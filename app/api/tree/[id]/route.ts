import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { RawNode } from "@/lib/tree/builder";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { nodes: { orderBy: { order: "asc" } } },
  });

  if (!project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  const nodes: RawNode[] = project.nodes.map((n) => ({
    id: n.id,
    title: n.title,
    name: n.name ?? undefined,
    parentId: n.parentId ?? undefined,
    order: n.order,
    meta: n.meta ? (JSON.parse(n.meta) as Record<string, unknown>) : undefined,
  }));

  return NextResponse.json({
    projectId: project.id,
    name: project.name,
    nodes,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}
