"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParseStore } from "@/lib/store/parse-store";
import { useMappingStore } from "@/lib/store/mapping-store";
import { useEditorStore } from "@/lib/store/editor-store";
import { rowsToNodes } from "@/lib/tree/rowsToNodes";
import { buildTree, treeToRawNodes } from "@/lib/tree/builder";
import type { TreeNode } from "@/lib/tree/builder";
import { OrgTreeChart } from "@/components/tree/OrgTreeChart";
import { NodeEditPanel } from "@/components/editor/NodeEditPanel";

export default function EditorPage() {
  const router = useRouter();
  const files = useParseStore((s) => s.files);
  const mappings = useMappingStore((s) => s.mappings);
  const { roots, isDirty, projectId, setRoots, markSaved } = useEditorStore();
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 파싱 결과 → editor 스토어 초기화 (최초 1회)
  const { roots: parsedRoots, orphans } = useMemo(() => {
    const allSheets = files.flatMap((f) =>
      f.status === "done" && f.result ? f.result.sheets : [],
    );
    if (allSheets.length === 0 || mappings.length === 0) {
      return { roots: [], orphans: [] };
    }
    return buildTree(rowsToNodes(allSheets, mappings));
  }, [files, mappings]);

  useEffect(() => {
    if (parsedRoots.length > 0 && roots.length === 0) {
      setRoots(parsedRoots);
    }
  }, [parsedRoots, roots.length, setRoots]);

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "조직도",
          nodes: treeToRawNodes(roots),
          projectId: projectId ?? undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { projectId: pid } = (await res.json()) as { projectId: string };
      markSaved(pid);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setIsSaving(false);
    }
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-slate-500">업로드된 파일이 없습니다.</p>
        <button
          onClick={() => router.push("/builder/upload")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          파일 업로드로 이동
        </button>
      </div>
    );
  }

  if (mappings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-slate-500">컬럼 매핑이 완료되지 않았습니다.</p>
        <button
          onClick={() => router.push("/builder/mapping")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          컬럼 매핑으로 이동
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* 트리 영역 */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">조직도 편집기</h1>
          <div className="flex items-center gap-3">
            {orphans.length > 0 && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                부모 없는 노드 {orphans.length}개 루트로 배치됨
              </span>
            )}
            {saveError && (
              <span className="text-xs text-red-600">{saveError}</span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="px-4 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? "저장 중…" : isDirty ? "저장" : "저장됨"}
            </button>
            {projectId && (
              <button
                onClick={() => {
                  const url = `${window.location.origin}/share/${projectId}`;
                  void navigator.clipboard.writeText(url).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                {copied ? "복사됨!" : "공유 링크"}
              </button>
            )}
            <button
              onClick={() => router.push("/builder/export")}
              className="px-4 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800"
            >
              내보내기
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <OrgTreeChart
            roots={roots}
            selectedId={selectedNode?.id ?? null}
            onSelect={setSelectedNode}
          />
        </div>
      </div>

      {/* 세부정보/편집 패널 */}
      <aside className="w-72 border-l border-slate-200 bg-white p-5 overflow-y-auto">
        {selectedNode ? (
          <NodeEditPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        ) : (
          <p className="text-sm text-slate-400 mt-2">
            노드를 클릭하면 편집 패널이 표시됩니다
          </p>
        )}
      </aside>
    </div>
  );
}
