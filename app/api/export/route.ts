import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { RawNode } from "@/lib/tree/builder";

/** GET /api/export?projectId=xxx — DB에서 조직도를 불러와 JSON으로 반환 */
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { nodes: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const nodes: RawNode[] = project.nodes.map((n) => ({
    id: n.id,
    title: n.title,
    name: n.name ?? undefined,
    parentId: n.parentId ?? undefined,
    order: n.order,
  }));

  return new NextResponse(JSON.stringify(nodes, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="orgchart-${projectId}.json"`,
    },
  });
}
