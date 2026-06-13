import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { nodes: true } } },
  });

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">내 조직도</h1>
          <Link
            href="/builder/upload"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + 새 조직도 만들기
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg mb-4">저장된 조직도가 없습니다.</p>
            <Link
              href="/builder/upload"
              className="text-blue-600 hover:underline text-sm"
            >
              첫 조직도 만들기 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-gray-900 truncate">
                    {p.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    노드 {p._count.nodes}개 ·{" "}
                    {new Date(p.updatedAt).toLocaleDateString("ko-KR")} 수정
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/builder/editor?projectId=${p.id}`}
                    className="flex-1 text-center text-sm bg-blue-50 text-blue-700 rounded-lg py-1.5 hover:bg-blue-100"
                  >
                    편집
                  </Link>
                  <Link
                    href={`/builder/export?projectId=${p.id}`}
                    className="flex-1 text-center text-sm bg-gray-50 text-gray-700 rounded-lg py-1.5 hover:bg-gray-100"
                  >
                    내보내기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
