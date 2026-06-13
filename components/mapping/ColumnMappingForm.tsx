"use client";

import { useEffect } from "react";
import { guessNameColumn, guessTitleColumn, guessParentColumn } from "@/lib/parser/excel";
import { useMappingStore } from "@/lib/store/mapping-store";

interface Props {
  fileId: string;
  fileName: string;
  sheetName: string;
  headers: string[];
}

const NONE = "__none__";

function ColumnSelect({
  label,
  value,
  headers,
  onChange,
}: {
  label: string;
  value: string | null;
  headers: string[];
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <select
        value={value ?? NONE}
        onChange={(e) => onChange(e.target.value === NONE ? null : e.target.value)}
        className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
      >
        <option value={NONE}>— 선택 안 함 —</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ColumnMappingForm({ fileId, fileName, sheetName, headers }: Props) {
  const { getMapping, setMapping } = useMappingStore();
  const mapping = getMapping(fileId, sheetName);

  useEffect(() => {
    if (!mapping) {
      setMapping(fileId, sheetName, {
        nameColumn: guessNameColumn(headers),
        titleColumn: guessTitleColumn(headers),
        parentColumn: guessParentColumn(headers),
      });
    }
  }, [fileId, sheetName, headers, mapping, setMapping]);

  const name = mapping?.nameColumn ?? guessNameColumn(headers);
  const title = mapping?.titleColumn ?? guessTitleColumn(headers);
  const parent = mapping?.parentColumn ?? guessParentColumn(headers);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3">
        <span className="text-xs text-gray-400">{fileName}</span>
        <h3 className="text-sm font-semibold text-gray-800">시트: {sheetName}</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          헤더 {headers.length}개 · AI가 컬럼을 추측했습니다. 필요 시 수정하세요.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ColumnSelect
          label="이름 컬럼 *"
          value={name}
          headers={headers}
          onChange={(v) => setMapping(fileId, sheetName, { nameColumn: v })}
        />
        <ColumnSelect
          label="직위/부서 컬럼"
          value={title}
          headers={headers}
          onChange={(v) => setMapping(fileId, sheetName, { titleColumn: v })}
        />
        <ColumnSelect
          label="상위부서 컬럼"
          value={parent}
          headers={headers}
          onChange={(v) => setMapping(fileId, sheetName, { parentColumn: v })}
        />
      </div>
    </div>
  );
}
