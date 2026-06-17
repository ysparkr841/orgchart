"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import { useEditorStore } from "@/lib/store/editor-store";
import { treeToRawNodes } from "@/lib/tree/builder";
import { OrgTreeChart } from "@/components/tree/OrgTreeChart";
import { jsPDF } from "jspdf";
import { generateReactCode, generateVueCode } from "@/lib/export/codeExporter";
import { usePlanStore } from "@/lib/store/plan-store";
import { applyWatermark } from "@/lib/export/watermark";
import { downloadBlob, downloadDataUrl } from "@/lib/utils/downloadFile";

export default function ExportPage() {
  const router = useRouter();
  const { roots, projectId } = useEditorStore();
  const { plan, setPlan, isFree } = usePlanStore();
  const treeRef = useRef<HTMLDivElement>(null);
  const [pngLoading, setPngLoading] = useState(false);
  const [pngError, setPngError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

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
    downloadBlob(
      JSON.stringify(nodes, null, 2),
      `orgchart-${projectId ?? "export"}.json`,
      "application/json"
    );
  }

  async function downloadPng() {
    if (!treeRef.current) return;
    setPngLoading(true);
    setPngError(null);
    try {
      let dataUrl = await toPng(treeRef.current, {
        backgroundColor: "#f8fafc",
        pixelRatio: 2,
      });
      if (isFree()) dataUrl = await applyWatermark(dataUrl);
      downloadDataUrl(dataUrl, `orgchart-${projectId ?? "export"}.png`);
    } catch {
      setPngError("PNG 변환에 실패했습니다.");
    } finally {
      setPngLoading(false);
    }
  }

  function downloadCode(type: "react" | "vue") {
    setCodeError(null);
    try {
      const code = type === "react" ? generateReactCode(roots) : generateVueCode(roots);
      const ext = type === "react" ? "tsx" : "vue";
      downloadBlob(code, `OrgChart.${ext}`, "text/plain;charset=utf-8");
    } catch {
      setCodeError("코드 생성에 실패했습니다.");
    }
  }

  async function downloadPdf() {
    if (!treeRef.current) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      let dataUrl = await toPng(treeRef.current, {
        backgroundColor: "#f8fafc",
        pixelRatio: 2,
      });
      if (isFree()) dataUrl = await applyWatermark(dataUrl);
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;
      const orientation = imgW > imgH ? "landscape" : "portrait";
      const doc = new jsPDF({ orientation, unit: "px", format: [imgW, imgH] });
      doc.addImage(dataUrl, "PNG", 0, 0, imgW, imgH);
      doc.save(`orgchart-${projectId ?? "export"}.pdf`);
    } catch {
      setPdfError("PDF 변환에 실패했습니다.");
    } finally {
      setPdfLoading(false);
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
          {/* 플랜 배지 */}
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              plan === "pro"
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {plan === "pro" ? "Pro" : "무료"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {(pngError || pdfError || codeError) && (
            <span className="text-xs text-red-600">{pngError ?? pdfError ?? codeError}</span>
          )}
          {/* 플랜 전환 (데모용) */}
          {plan === "free" ? (
            <button
              onClick={() => setPlan("pro")}
              className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600"
              title="Pro 플랜으로 업그레이드하면 워터마크 없이 내보낼 수 있습니다"
            >
              Pro 업그레이드 (데모)
            </button>
          ) : (
            <button
              onClick={() => setPlan("free")}
              className="px-3 py-1.5 bg-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-300"
            >
              무료로 전환
            </button>
          )}
          <button
            onClick={downloadJson}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50"
          >
            JSON 다운로드
          </button>
          <button
            onClick={() => downloadCode("react")}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50"
          >
            React 코드
          </button>
          <button
            onClick={() => downloadCode("vue")}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50"
          >
            Vue 코드
          </button>
          <button
            onClick={downloadPng}
            disabled={pngLoading}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pngLoading ? "변환 중…" : "PNG 다운로드"}
          </button>
          <button
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pdfLoading ? "변환 중…" : "PDF 다운로드"}
          </button>
        </div>
      </header>

      {/* 무료 플랜 안내 배너 */}
      {plan === "free" && (
        <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700 flex items-center gap-2">
          <span>무료 플랜: PNG/PDF 내보내기 시 워터마크가 추가됩니다.</span>
          <button
            onClick={() => setPlan("pro")}
            className="underline font-medium hover:text-amber-900"
          >
            Pro로 업그레이드
          </button>
        </div>
      )}

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
