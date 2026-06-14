import { NextRequest, NextResponse } from "next/server";
import { parseExcel } from "@/lib/parser/excel";
import { parsePdf } from "@/lib/parser/pdfParser";
import { parseImage } from "@/lib/parser/imageParser";
import { parseHwp } from "@/lib/parser/hwpParser";
import { parseHris } from "@/lib/parser/hrisParser";
import { detectFileType, isSpreadsheet, isImage, isHwp, isHris, type FileType } from "@/lib/parser/fileType";
import type { SheetResult } from "@/lib/parser/excel";

export interface ParseFileResult {
  fileName: string;
  fileType: FileType;
  sheets: SheetResult[];
  warnings: string[];
}

export interface ParseResponse {
  results: ParseFileResult[];
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "multipart/form-data 파싱 실패" }, { status: 400 });
  }

  const rawFiles = formData.getAll("files");
  const files = rawFiles.filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "files 필드가 없거나 파일이 없습니다." }, { status: 400 });
  }

  const results: ParseFileResult[] = await Promise.all(
    files.map(async (file): Promise<ParseFileResult> => {
      const fileType = detectFileType(file.name, file.type);

      if (isSpreadsheet(fileType)) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const { sheets, warnings } = parseExcel(buffer);
        return { fileName: file.name, fileType, sheets, warnings };
      }

      if (fileType === "pdf") {
        const buffer = Buffer.from(await file.arrayBuffer());
        const { sheets, warnings } = await parsePdf(buffer);
        return { fileName: file.name, fileType, sheets, warnings };
      }

      if (isImage(fileType)) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const { sheets, warnings } = await parseImage(buffer);
        return { fileName: file.name, fileType, sheets, warnings };
      }

      if (isHwp(fileType)) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const { sheets, warnings } = await parseHwp(buffer);
        return { fileName: file.name, fileType, sheets, warnings };
      }

      if (isHris(fileType)) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const { sheets, warnings } = await parseHris(buffer);
        return { fileName: file.name, fileType, sheets, warnings };
      }

      return {
        fileName: file.name,
        fileType,
        sheets: [],
        warnings: ["지원하지 않는 파일 형식입니다. 수동으로 데이터를 입력해 주세요."],
      };
    }),
  );

  return NextResponse.json({ results } satisfies ParseResponse);
}
