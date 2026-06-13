"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { buildTree } from "@/lib/tree/builder";
import type { RawNode, TreeNode } from "@/lib/tree/builder";
import { OrgTreeChart } from "@/components/tree/OrgTreeChart";

interface ProjectData {
  projectId: string;
  name: string;
  nodes: RawNode[];
  createdAt: string;
  updatedAt: string;
}

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ProjectData | null>(null);
  const [roots, setRoots] = useState<TreeNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tree/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("조직도를 찾을 수 없습니다.");
        return res.json() as Promise<ProjectData>;
      })
      .then((proj) => {
        setData(proj);
        const { roots: r } = buildTree(proj.nodes);
        setRoots(r);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "불러오기 실패"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400">
        불러오는 중…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error ?? "알 수 없는 오류"}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
        <h1 className="text-lg font-semibold text-slate-800">{data.name}</h1>
        <span className="text-xs text-slate-400">읽기 전용</span>
      </header>
      <div className="flex-1 overflow-hidden">
        <OrgTreeChart
          roots={roots}
          selectedId={null}
          onSelect={() => undefined}
        />
      </div>
    </div>
  );
}
