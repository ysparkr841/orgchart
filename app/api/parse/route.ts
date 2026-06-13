import { NextRequest, NextResponse } from "next/server";
import { parseExcel } from "@/lib/parser/excel";

export interface ParseFileResult {
  fileName: string;
  sheets: import("@/lib/parser/excel").SheetResult[];
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
    files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { sheets, warnings } = parseExcel(buffer);
      return { fileName: file.name, sheets, warnings };
    }),
  );

  return NextResponse.json({ results } satisfies ParseResponse);
}
