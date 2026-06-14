"use client";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { buildTree, treeToRawNodes } from "@/lib/tree/builder";
import type { RawNode, TreeNode } from "@/lib/tree/builder";
import { OrgTreeChart } from "@/components/tree/OrgTreeChart";
import { useEditorStore } from "@/lib/store/editor-store";
import { NodeEditPanel } from "@/components/editor/NodeEditPanel";

interface ProjectData {
  projectId: string;
  name: string;
  nodes: RawNode[];
  createdAt: string;
  updatedAt: string;
}

function SharePageInner() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const editMode = searchParams.get("edit") === "1";

  const [data, setData] = useState<ProjectData | null>(null);
  const [viewRoots, setViewRoots] = useState<TreeNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { roots, setRoots, isDirty } = useEditorStore();

  useEffect(() => {
    fetch(`/api/tree/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("조직도를 찾을 수 없습니다.");
        return res.json() as Promise<ProjectData>;
      })
      .then((proj) => {
        setData(proj);
        const { roots: r } = buildTree(proj.nodes);
        if (editMode) {
          setRoots(r, proj.projectId);
        } else {
          setViewRoots(r);
        }
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "불러오기 실패"),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave() {
    if (!data) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          nodes: treeToRawNodes(roots),
          projectId: data.projectId,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setIsSaving(false);
    }
  }

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

  const displayRoots = editMode ? roots : viewRoots;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
        <h1 className="text-lg font-semibold text-slate-800">{data.name}</h1>
        <div className="flex items-center gap-3">
          {editMode ? (
            <>
              {saveError && (
                <span className="text-xs text-red-600">{saveError}</span>
              )}
              {saveSuccess && (
                <span className="text-xs text-green-600">저장 완료 ✓</span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving ? "저장 중…" : isDirty ? "저장" : "저장됨"}
              </button>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                편집 모드
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-400">읽기 전용</span>
          )}
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <OrgTreeChart
            roots={displayRoots}
            selectedId={selectedNode?.id ?? null}
            onSelect={editMode ? setSelectedNode : () => undefined}
          />
        </div>
        {editMode && selectedNode && (
          <aside className="w-72 border-l border-slate-200 bg-white overflow-y-auto">
            <NodeEditPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          </aside>
        )}
      </div>
      {editMode && !selectedNode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <p className="text-xs text-slate-400 bg-white/80 px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
            노드를 클릭하면 편집 패널이 표시됩니다
          </p>
        </div>
      )}
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-slate-400">
          불러오는 중…
        </div>
      }
    >
      <SharePageInner />
    </Suspense>
  );
}
