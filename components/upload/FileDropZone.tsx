"use client";

import { useCallback, useRef, useState } from "react";

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];
const ACCEPTED_EXTENSIONS = ".xlsx,.xls";

function isExcelFile(file: File): boolean {
  return (
    ACCEPTED_TYPES.includes(file.type) ||
    file.name.endsWith(".xlsx") ||
    file.name.endsWith(".xls")
  );
}

export function FileDropZone({ onFilesSelected, disabled = false }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled) return;
      const valid = Array.from(fileList).filter(isExcelFile);
      if (valid.length > 0) onFilesSelected(valid);
    },
    [onFilesSelected, disabled],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragOver(false), []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files),
    [handleFiles],
  );

  const onClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="파일 업로드 영역. 클릭하거나 파일을 끌어다 놓으세요."
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={[
        "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-8 py-14 transition-colors",
        "cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500",
        disabled
          ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
          : isDragOver
            ? "border-blue-500 bg-blue-50 text-blue-700"
            : "border-gray-300 bg-white text-gray-500 hover:border-blue-400 hover:bg-blue-50",
      ].join(" ")}
    >
      <svg
        className="h-12 w-12"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
        />
      </svg>
      <div className="text-center">
        <p className="text-base font-medium">엑셀 파일을 끌어다 놓거나 클릭하여 선택</p>
        <p className="mt-1 text-sm">.xlsx, .xls 파일 지원 · 여러 파일 동시 업로드 가능</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        multiple
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />
    </div>
  );
}
