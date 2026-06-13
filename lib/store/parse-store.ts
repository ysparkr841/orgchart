import { create } from "zustand";
import type { ExcelParseResult } from "@/lib/parser/excel";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "pending" | "parsing" | "done" | "error";
  result?: ExcelParseResult;
  error?: string;
}

interface ParseStore {
  files: UploadedFile[];
  addFiles: (files: UploadedFile[]) => void;
  updateFile: (id: string, patch: Partial<UploadedFile>) => void;
  clearFiles: () => void;
}

export const useParseStore = create<ParseStore>((set) => ({
  files: [],
  addFiles: (files) => set((s) => ({ files: [...s.files, ...files] })),
  updateFile: (id, patch) =>
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    })),
  clearFiles: () => set({ files: [] }),
}));
