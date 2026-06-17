import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { RawNode } from "@/lib/tree/builder";
import { exportToExcel } from "@/lib/export/excelExporter";
import { exportToCsv } from "@/lib/export/csvExporter";
import { apiError } from "@/lib/api/routeHelpers";

/** GET /api/export?projectId=xxx&format=json|xlsx|csv — DB에서 조직도를 불러와 반환 */
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return apiError("projectId required", 400);
  }

  const format = req.nextUrl.searchParams.get("format") ?? "json";
  if (format !== "json" && format !== "xlsx" && format !== "csv") {
    return apiError("format must be json, xlsx, or csv", 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { nodes: true },
  });

  if (!project) {
    return apiError("Project not found", 404);
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

  if (format === "csv") {
    const csv = exportToCsv(nodes);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orgchart-${projectId}.csv"`,
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
