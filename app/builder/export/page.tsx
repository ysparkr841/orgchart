"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import { useEditorStore } from "@/lib/store/editor-store";
import { treeToRawNodes } from "@/lib/tree/builder";
import { OrgTreeChart } from "@/components/tree/OrgTreeChart";

export default function ExportPage() {
  const router = useRouter();
  const { roots, projectId } = useEditorStore();
  const treeRef = useRef<HTMLDivElement>(null);
  const [pngLoading, setPngLoading] = useState(false);
  const [pngError, setPngError] = useState<string | null>(null);

  if (roots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-slate-500">편집된 조직도가 없습니다.</p>
        <button
          onClick={() => router.push("/builder/editor")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          편집기로 이동
        </button>
      </div>
    );
  }

  function downloadJson() {
    const nodes = treeToRawNodes(roots);
    const blob = new Blob([JSON.stringify(nodes, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orgchart-${projectId ?? "export"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPng() {
    if (!treeRef.current) return;
    setPngLoading(true);
    setPngError(null);
    try {
      const dataUrl = await toPng(treeRef.current, {
        backgroundColor: "#f8fafc",
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `orgchart-${projectId ?? "export"}.png`;
      a.click();
    } catch {
      setPngError("PNG 변환에 실패했습니다.");
    } finally {
      setPngLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/builder/editor")}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← 편집기로 돌아가기
          </button>
          <h1 className="text-xl font-semibold text-slate-800">내보내기</h1>
        </div>
        <div className="flex items-center gap-3">
          {pngError && (
            <span className="text-xs text-red-600">{pngError}</span>
          )}
          <button
            onClick={downloadJson}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50"
          >
            JSON 다운로드
          </button>
          <button
            onClick={downloadPng}
            disabled={pngLoading}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pngLoading ? "변환 중…" : "PNG 다운로드"}
          </button>
        </div>
      </header>

      {/* 트리 미리보기 */}
      <main className="flex-1 overflow-auto p-6">
        <div
          ref={treeRef}
          className="w-full h-full min-h-[600px] bg-slate-50 rounded-xl"
        >
          <OrgTreeChart roots={roots} selectedId={null} onSelect={() => {}} />
        </div>
      </main>
    </div>
  );
}
