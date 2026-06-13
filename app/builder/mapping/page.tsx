"use client";

import { useRouter } from "next/navigation";
import { useParseStore } from "@/lib/store/parse-store";
import { useMappingStore } from "@/lib/store/mapping-store";
import { ColumnMappingForm } from "@/components/mapping/ColumnMappingForm";

export default function MappingPage() {
  const router = useRouter();
  const files = useParseStore((s) => s.files);
  const { mappings } = useMappingStore();

  const doneFiles = files.filter((f) => f.status === "done" && f.result);

  const allSheets = doneFiles.flatMap((f) =>
    (f.result?.sheets ?? []).map((s) => ({ fileId: f.id, fileName: f.name, sheet: s })),
  );

  const requiredMapped = allSheets.every(({ fileId, sheet }) => {
    const m = mappings.find(
      (mp) => mp.fileId === fileId && mp.sheetName === sheet.sheetName,
    );
    return m?.nameColumn != null;
  });

  const handleBack = () => router.push("/builder/upload");
  const handleNext = () => router.push("/builder/editor");

  if (doneFiles.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm text-gray-500">
          업로드된 파일이 없습니다.{" "}
          <button
            type="button"
            onClick={handleBack}
            className="text-blue-600 underline"
          >
            파일 업로드로 돌아가기
          </button>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">컬럼 매핑</h1>
      <p className="mb-8 text-sm text-gray-500">
        AI가 추측한 컬럼을 확인하고, 필요하면 직접 선택하세요. 이름 컬럼(*)은 필수입니다.
      </p>

      <div className="flex flex-col gap-4">
        {allSheets.map(({ fileId, fileName, sheet }) => (
          <ColumnMappingForm
            key={`${fileId}-${sheet.sheetName}`}
            fileId={fileId}
            fileName={fileName}
            sheetName={sheet.sheetName}
            headers={sheet.headers}
          />
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-gray-500 underline hover:text-gray-700"
        >
          ← 파일 업로드로
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!requiredMapped}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          트리 생성 →
        </button>
      </div>
    </main>
  );
}
