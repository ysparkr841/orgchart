import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { RawNode } from "@/lib/tree/builder";
import { exportToExcel } from "@/lib/export/excelExporter";

/** GET /api/export?projectId=xxx&format=json|xlsx — DB에서 조직도를 불러와 반환 */
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const format = req.nextUrl.searchParams.get("format") ?? "json";
  if (format !== "json" && format !== "xlsx") {
    return NextResponse.json({ error: "format must be json or xlsx" }, { status: 400 });
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

  if (format === "xlsx") {
    const buffer = exportToExcel(nodes);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="orgchart-${projectId}.xlsx"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(nodes, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="orgchart-${projectId}.json"`,
    },
  });
}
