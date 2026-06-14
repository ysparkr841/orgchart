"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParseStore } from "@/lib/store/parse-store";
import { useMappingStore } from "@/lib/store/mapping-store";
import { useEditorStore } from "@/lib/store/editor-store";
import { rowsToNodes } from "@/lib/tree/rowsToNodes";
import { buildTree, treeToRawNodes } from "@/lib/tree/builder";
import type { TreeNode } from "@/lib/tree/builder";
import { searchNodes } from "@/lib/tree/search";
import { OrgTreeChart, type TreeLayout } from "@/components/tree/OrgTreeChart";
import { OrgListView } from "@/components/tree/OrgListView";
import { NodeEditPanel } from "@/components/editor/NodeEditPanel";
import { HistoryPanel } from "@/components/editor/HistoryPanel";
import type { RawNode } from "@/lib/tree/builder";

type ViewMode = "tree" | "list" | "split";

export default function EditorPage() {
  const router = useRouter();
  const files = useParseStore((s) => s.files);
  const mappings = useMappingStore((s) => s.mappings);
  const { roots, isDirty, projectId, setRoots, markSaved, moveNode } = useEditorStore();
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [copied, setCopied] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);
  const [layout, setLayout] = useState<TreeLayout>("horizontal");
  const [searchQuery, setSearchQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);

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

  const highlightIds = useMemo(
    () => searchNodes(roots, searchQuery),
    [roots, searchQuery],
  );

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

  function handleRestoreNodes(rawNodes: unknown[]) {
    const { roots: restoredRoots } = buildTree(rawNodes as RawNode[]);
    setRoots(restoredRoots);
    setSelectedNode(null);
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
      <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">조직도 편집기</h1>
          <div className="flex items-center gap-2 flex-1 max-w-xs mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름/직책 검색…"
                className="w-full pl-3 pr-16 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {searchQuery ? (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <span className="text-xs text-slate-400">{highlightIds.size}건</span>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-slate-400 hover:text-slate-600 text-xs leading-none"
                  >
                    ✕
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* 뷰 전환 토글 */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
              <button
                onClick={() => setViewMode("tree")}
                className={`px-3 py-1.5 transition-colors ${
                  viewMode === "tree"
                    ? "bg-slate-700 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                트리
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 border-l border-slate-200 transition-colors ${
                  viewMode === "list"
                    ? "bg-slate-700 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                목록
              </button>
              <button
                onClick={() => setViewMode("split")}
                className={`px-3 py-1.5 border-l border-slate-200 transition-colors ${
                  viewMode === "split"
                    ? "bg-slate-700 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                분할
              </button>
            </div>
            {/* 레이아웃 토글 (트리/분할 모드에서만) */}
            {(viewMode === "tree" || viewMode === "split") && (
              <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
                <button
                  onClick={() => setLayout("horizontal")}
                  className={`px-3 py-1.5 ${layout === "horizontal" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  가로
                </button>
                <button
                  onClick={() => setLayout("vertical")}
                  className={`px-3 py-1.5 ${layout === "vertical" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  세로
                </button>
              </div>
            )}
            {orphans.length > 0 && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                부모 없는 노드 {orphans.length}개 루트로 배치됨
              </span>
            )}
            {saveError && (
              <span className="text-xs text-red-600">{saveError}</span>
            )}
            {projectId && (
              <button
                onClick={() => setShowHistory((v) => !v)}
                className={`px-4 py-1.5 text-sm rounded-lg border ${
                  showHistory
                    ? "bg-amber-50 border-amber-300 text-amber-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                이력
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="px-4 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? "저장 중…" : isDirty ? "저장" : "저장됨"}
            </button>
            {projectId && (
              <>
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
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/share/${projectId}?edit=1`;
                    void navigator.clipboard.writeText(url).then(() => {
                      setCopiedEdit(true);
                      setTimeout(() => setCopiedEdit(false), 2000);
                    });
                  }}
                  className="px-4 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700"
                >
                  {copiedEdit ? "복사됨!" : "편집 링크"}
                </button>
              </>
            )}
            <button
              onClick={() => router.push("/builder/export")}
              className="px-4 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800"
            >
              내보내기
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 flex gap-3">
          {(viewMode === "tree" || viewMode === "split") && (
            <div className={viewMode === "split" ? "flex-1 min-w-0" : "flex-1"}>
              <OrgTreeChart
                roots={roots}
                selectedId={selectedNode?.id ?? null}
                onSelect={setSelectedNode}
                layout={layout}
                onMove={moveNode}
                highlightIds={highlightIds}
              />
            </div>
          )}
          {(viewMode === "list" || viewMode === "split") && (
            <div className={`${viewMode === "split" ? "w-96 border-l border-slate-200 bg-white rounded-lg" : "flex-1"} min-h-0 overflow-hidden`}>
              <OrgListView
                roots={roots}
                selectedId={selectedNode?.id ?? null}
                onSelect={setSelectedNode}
                searchQuery={searchQuery}
              />
            </div>
          )}
        </div>
      </div>

      <aside className="w-72 border-l border-slate-200 bg-white overflow-hidden flex flex-col">
        {showHistory && projectId ? (
          <HistoryPanel projectId={projectId} onRestore={handleRestoreNodes} />
        ) : (
          <div className="p-5 overflow-y-auto flex-1">
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
          </div>
        )}
      </aside>
    </div>
  );
}
