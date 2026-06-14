export type FileType = "xlsx" | "xls" | "csv" | "image" | "pdf" | "hwp" | "hwpx" | "unknown";

const EXT_MAP: Record<string, FileType> = {
  xlsx: "xlsx",
  xls: "xls",
  csv: "csv",
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  pdf: "pdf",
  hwp: "hwp",
  hwpx: "hwpx",
};

export function detectFileType(fileName: string, mimeType = ""): FileType {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (EXT_MAP[ext]) return EXT_MAP[ext];
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "text/csv") return "csv";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "xlsx";
  if (mimeType === "application/x-hwp" || mimeType === "application/haansofthwp") return "hwp";
  return "unknown";
}

export function isSpreadsheet(type: FileType): boolean {
  return type === "xlsx" || type === "xls" || type === "csv";
}

export function isImage(type: FileType): boolean {
  return type === "image";
}

export function isHwp(type: FileType): boolean {
  return type === "hwp" || type === "hwpx";
}

export const FILE_TYPE_LABELS: Record<FileType, string> = {
  xlsx: "XLSX",
  xls: "XLS",
  csv: "CSV",
  image: "이미지",
  pdf: "PDF",
  hwp: "HWP",
  hwpx: "HWPX",
  unknown: "알 수 없음",
};

export const ACCEPTED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/x-hwp",
  "application/haansofthwp",
];

export const ACCEPTED_EXTENSIONS = ".xlsx,.xls,.csv,.jpg,.jpeg,.png,.gif,.webp,.pdf,.hwp,.hwpx";
