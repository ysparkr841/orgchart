import { describe, it, expect, beforeEach } from "vitest";
import { useParseStore } from "./parse-store";
import type { UploadedFile } from "./parse-store";

function file(id: string, name = `${id}.xlsx`): UploadedFile {
  return { id, name, size: 1024, status: "pending" };
}

beforeEach(() => {
  useParseStore.setState({ files: [] });
});

describe("useParseStore", () => {
  it("기본 상태는 빈 files 배열이다", () => {
    expect(useParseStore.getState().files).toEqual([]);
  });

  it("addFiles로 파일 목록에 추가한다", () => {
    useParseStore.getState().addFiles([file("a"), file("b")]);
    expect(useParseStore.getState().files).toHaveLength(2);
  });

  it("addFiles를 여러 번 호출하면 누적된다", () => {
    useParseStore.getState().addFiles([file("a")]);
    useParseStore.getState().addFiles([file("b"), file("c")]);
    expect(useParseStore.getState().files).toHaveLength(3);
  });

  it("updateFile로 특정 파일의 status를 변경한다", () => {
    useParseStore.getState().addFiles([file("a"), file("b")]);
    useParseStore.getState().updateFile("a", { status: "parsing" });
    const files = useParseStore.getState().files;
    expect(files.find((f) => f.id === "a")?.status).toBe("parsing");
    expect(files.find((f) => f.id === "b")?.status).toBe("pending");
  });

  it("updateFile로 error 메시지를 설정한다", () => {
    useParseStore.getState().addFiles([file("a")]);
    useParseStore.getState().updateFile("a", { status: "error", error: "파싱 실패" });
    const f = useParseStore.getState().files[0];
    expect(f.status).toBe("error");
    expect(f.error).toBe("파싱 실패");
  });

  it("존재하지 않는 ID를 updateFile해도 다른 파일은 변하지 않는다", () => {
    useParseStore.getState().addFiles([file("a")]);
    useParseStore.getState().updateFile("zzz", { status: "done" });
    expect(useParseStore.getState().files[0].status).toBe("pending");
  });

  it("clearFiles로 모든 파일이 삭제된다", () => {
    useParseStore.getState().addFiles([file("a"), file("b")]);
    useParseStore.getState().clearFiles();
    expect(useParseStore.getState().files).toEqual([]);
  });

  it("fileType 필드가 설정된 파일을 추가할 수 있다", () => {
    useParseStore.getState().addFiles([{ ...file("a"), fileType: "xlsx" }]);
    expect(useParseStore.getState().files[0].fileType).toBe("xlsx");
  });
});
