"use client";

import { useState } from "react";
import type { SheetResult } from "@/lib/parser/excel";

interface FilePreviewProps {
  sheets: SheetResult[];
}

export function FilePreview({ sheets }: FilePreviewProps) {
  const [open, setOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState(0);

  if (sheets.length === 0) return null;

  const sheet = sheets[activeSheet] ?? sheets[0];
  const sampleRows = sheet.rows.slice(0, 5);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
      >
        {open ? "▲ 미리보기 닫기" : "▼ 미리보기 (헤더 + 샘플 5행)"}
      </button>

      {open && (
        <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
          {sheets.length > 1 && (
            <div className="flex border-b border-gray-200 bg-gray-50">
              {sheets.map((s, i) => (
                <button
                  key={s.sheetName}
                  type="button"
                  onClick={() => setActiveSheet(i)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    i === activeSheet
                      ? "border-b-2 border-blue-600 bg-white text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {s.sheetName}
                </button>
              ))}
            </div>
          )}

          {sheet.headers.length === 0 ? (
            <p className="p-3 text-xs text-gray-400">헤더가 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    {sheet.headers.map((h) => (
                      <th
                        key={h}
                        className="max-w-[140px] truncate whitespace-nowrap border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700"
                        title={h}
                      >
                        {h || "(빈 헤더)"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={sheet.headers.length}
                        className="px-3 py-2 text-gray-400"
                      >
                        데이터 없음
                      </td>
                    </tr>
                  ) : (
                    sampleRows.map((row, ri) => (
                      <tr
                        key={ri}
                        className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        {sheet.headers.map((h) => (
                          <td
                            key={h}
                            className="max-w-[140px] truncate whitespace-nowrap border-b border-gray-100 px-3 py-1.5 text-gray-600"
                            title={String(row[h] ?? "")}
                          >
                            {String(row[h] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {sheet.rows.length > 5 && (
                <p className="border-t border-gray-100 px-3 py-1.5 text-xs text-gray-400">
                  … 외 {sheet.rows.length - 5}행 더 있음
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
