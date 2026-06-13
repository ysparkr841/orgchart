"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useParseStore } from "@/lib/store/parse-store";
import { useMappingStore } from "@/lib/store/mapping-store";
import { rowsToNodes } from "@/lib/tree/rowsToNodes";
import { buildTree } from "@/lib/tree/builder";
import type { TreeNode } from "@/lib/tree/builder";
import { OrgTreeChart } from "@/components/tree/OrgTreeChart";

export default function EditorPage() {
  const router = useRouter();
  const files = useParseStore((s) => s.files);
  const mappings = useMappingStore((s) => s.mappings);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  const { roots, orphans } = useMemo(() => {
    // 파싱 완료된 파일의 시트만 모아서 rowsToNodes 호출
    const allSheets = files.flatMap((f) =>
      f.status === "done" && f.result ? f.result.sheets.map((s) => s) : [],
    );
    if (allSheets.length === 0 || mappings.length === 0) {
      return { roots: [], orphans: [] };
    }
    const nodes = rowsToNodes(allSheets, mappings);
    return buildTree(nodes);
  }, [files, mappings]);

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
          {orphans.length > 0 && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              부모 없는 노드 {orphans.length}개 루트로 배치됨
            </span>
          )}
        </div>
        <div className="flex-1 min-h-0">
          <OrgTreeChart
            roots={roots}
            selectedId={selectedNode?.id ?? null}
            onSelect={setSelectedNode}
          />
        </div>
      </div>

      {/* 세부정보 패널 */}
      <aside className="w-72 border-l border-slate-200 bg-white p-5 overflow-y-auto">
        {selectedNode ? (
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-slate-800 text-sm">노드 세부정보</h2>
            <div className="flex flex-col gap-2">
              <DetailRow label="직위/부서" value={selectedNode.title} />
              {selectedNode.name && (
                <DetailRow label="이름" value={selectedNode.name} />
              )}
              {selectedNode.meta &&
                Object.entries(selectedNode.meta).map(([k, v]) => (
                  <DetailRow key={k} label={k} value={String(v ?? "")} />
                ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 mt-2">
            노드를 클릭하면 세부정보가 표시됩니다
          </p>
        )}
      </aside>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm text-slate-700 break-all">{value}</span>
    </div>
  );
}
