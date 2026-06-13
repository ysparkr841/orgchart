import { create } from "zustand";

export interface ColumnMapping {
  fileId: string;
  sheetName: string;
  nameColumn: string | null;
  titleColumn: string | null;
  parentColumn: string | null;
}

interface MappingStore {
  mappings: ColumnMapping[];
  setMapping: (
    fileId: string,
    sheetName: string,
    patch: Partial<Omit<ColumnMapping, "fileId" | "sheetName">>,
  ) => void;
  clearMappings: () => void;
  getMapping: (fileId: string, sheetName: string) => ColumnMapping | undefined;
}

export const useMappingStore = create<MappingStore>((set, get) => ({
  mappings: [],
  setMapping: (fileId, sheetName, patch) =>
    set((s) => {
      const idx = s.mappings.findIndex(
        (m) => m.fileId === fileId && m.sheetName === sheetName,
      );
      if (idx >= 0) {
        const updated = [...s.mappings];
        updated[idx] = { ...updated[idx], ...patch };
        return { mappings: updated };
      }
      return {
        mappings: [
          ...s.mappings,
          {
            fileId,
            sheetName,
            nameColumn: null,
            titleColumn: null,
            parentColumn: null,
            ...patch,
          },
        ],
      };
    }),
  clearMappings: () => set({ mappings: [] }),
  getMapping: (fileId, sheetName) =>
    get().mappings.find(
      (m) => m.fileId === fileId && m.sheetName === sheetName,
    ),
}));
