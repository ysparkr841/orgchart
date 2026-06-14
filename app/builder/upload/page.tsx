"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { FileDropZone } from "@/components/upload/FileDropZone";
import { FileList } from "@/components/upload/FileList";
import { useParseStore, type UploadedFile } from "@/lib/store/parse-store";
import type { ParseResponse } from "@/app/api/parse/route";
import type { ExcelParseResult } from "@/lib/parser/excel";
import { detectFileType } from "@/lib/parser/fileType";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function UploadPage() {
  const router = useRouter();
  const { files, addFiles, updateFile, clearFiles } = useParseStore();
  const [showTextInput, setShowTextInput] = useState(false);
  const [rawText, setRawText] = useState("");
  const [isParsingText, setIsParsingText] = useState(false);

  const isParsing = files.some((f) => f.status === "parsing") || isParsingText;
  const isDone = files.length > 0 && files.every((f) => f.status === "done" || f.status === "error");
  const hasValidResult = files.some((f) => f.status === "done");

  const handleFilesSelected = useCallback(
    async (selected: File[]) => {
      const newFiles: UploadedFile[] = selected.map((f) => ({
        id: generateId(),
        name: f.name,
        size: f.size,
        fileType: detectFileType(f.name, f.type),
        status: "parsing",
      }));
      addFiles(newFiles);

      const formData = new FormData();
      selected.forEach((f) => formData.append("files", f));

      let data: ParseResponse;
      try {
        const res = await fetch("/api/parse", { method: "POST", body: formData });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = (await res.json()) as ParseResponse;
      } catch (err) {
        newFiles.forEach(({ id }) =>
          updateFile(id, { status: "error", error: `서버 오류: ${String(err)}` }),
        );
        return;
      }

      newFiles.forEach(({ id, name }) => {
        const match = data.results.find((r) => r.fileName === name);
        if (!match) {
          updateFile(id, { status: "error", error: "서버에서 결과를 받지 못했습니다." });
          return;
        }
        updateFile(id, {
          status: "done",
          result: { sheets: match.sheets, warnings: match.warnings },
        });
      });
    },
    [addFiles, updateFile],
  );

  const handleRemove = useCallback(
    (id: string) => {
      useParseStore.setState((s) => ({
        files: s.files.filter((f) => f.id !== id),
      }));
    },
    [],
  );

  const handleTextParse = async () => {
    if (!rawText.trim() || isParsingText) return;
    setIsParsingText(true);

    const id = generateId();
    addFiles([{ id, name: "텍스트 입력", size: rawText.length, status: "parsing" }]);

    try {
      const res = await fetch("/api/parse/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ExcelParseResult;
      updateFile(id, { status: "done", result: data });
      setRawText("");
      setShowTextInput(false);
    } catch (err) {
      updateFile(id, { status: "error", error: `파싱 실패: ${String(err)}` });
    } finally {
      setIsParsingText(false);
    }
  };

  const handleReset = () => {
    clearFiles();
  };

  const handleNext = () => {
    router.push("/builder/mapping");
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">파일 업로드</h1>
      <p className="mb-8 text-sm text-gray-500">
        조직 데이터 파일을 업로드하세요. 엑셀, CSV, 이미지, PDF를 여러 파일 한 번에 올릴 수 있습니다.
      </p>

      <FileDropZone onFilesSelected={handleFilesSelected} disabled={isParsing} />

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowTextInput((v) => !v)}
          className="text-sm text-blue-600 hover:underline"
        >
          {showTextInput ? "텍스트 입력 닫기 ▲" : "텍스트로 직접 입력 ▼"}
        </button>

        {showTextInput && (
          <div className="mt-3 rounded-lg border border-gray-200 p-4">
            <p className="mb-2 text-xs text-gray-500">
              조직도 텍스트를 붙여넣으세요. 들여쓰기로 계층을 표현하거나 괄호/대시로 직위를 표기하면 자동 파싱됩니다.
              Ollama가 실행 중이면 AI가 자유 형식 텍스트도 분석합니다.
            </p>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`예시:\n홍길동(대표이사)\n  김철수(CTO)\n    이영희(개발팀장)\n  박민수(CFO)`}
              rows={8}
              className="w-full rounded border border-gray-300 p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleTextParse}
                disabled={!rawText.trim() || isParsingText}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
              >
                {isParsingText ? "파싱 중..." : "파싱하기"}
              </button>
            </div>
          </div>
        )}
      </div>

      <FileList files={files} onRemove={handleRemove} />

      {files.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            disabled={isParsing}
            className="text-sm text-gray-500 underline hover:text-gray-700 disabled:opacity-40"
          >
            전체 초기화
          </button>
          {isDone && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!hasValidResult}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
            >
              컬럼 매핑으로 →
            </button>
          )}
        </div>
      )}
    </main>
  );
}
