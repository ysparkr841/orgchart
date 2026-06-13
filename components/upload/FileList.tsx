"use client";

import type { UploadedFile } from "@/lib/store/parse-store";
import { FilePreview } from "./FilePreview";

interface FileListProps {
  files: UploadedFile[];
  onRemove?: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: UploadedFile["status"] }) {
  const map: Record<UploadedFile["status"], { label: string; cls: string }> = {
    pending: { label: "대기", cls: "bg-gray-100 text-gray-600" },
    parsing: { label: "분석 중…", cls: "bg-blue-100 text-blue-700" },
    done: { label: "완료", cls: "bg-green-100 text-green-700" },
    error: { label: "오류", cls: "bg-red-100 text-red-700" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status === "parsing" && (
        <span className="mr-1 inline-block h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
      )}
      {label}
    </span>
  );
}

function SheetSummary({ file }: { file: UploadedFile }) {
  if (file.status !== "done" || !file.result) return null;
  const { sheets, warnings } = file.result;
  return (
    <div className="mt-1 text-xs text-gray-500">
      {sheets.map((s) => (
        <span key={s.sheetName} className="mr-3">
          [{s.sheetName}] {s.rows.length}행 · {s.headers.length}열
        </span>
      ))}
      {warnings.length > 0 && (
        <span className="text-amber-600">⚠ {warnings[0]}</span>
      )}
    </div>
  );
}

export function FileList({ files, onRemove }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
      {files.map((file) => (
        <li key={file.id} className="flex items-start gap-3 px-4 py-3">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-gray-800">
                {file.name}
              </span>
              <StatusBadge status={file.status} />
            </div>
            <span className="text-xs text-gray-400">{formatBytes(file.size)}</span>
            {file.status === "error" && (
              <p className="mt-0.5 text-xs text-red-600">{file.error}</p>
            )}
            <SheetSummary file={file} />
            {file.status === "done" && file.result && (
              <FilePreview sheets={file.result.sheets} />
            )}
          </div>
          {onRemove && file.status !== "parsing" && (
            <button
              type="button"
              onClick={() => onRemove(file.id)}
              className="ml-auto shrink-0 text-gray-400 hover:text-red-500"
              aria-label={`${file.name} 제거`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
