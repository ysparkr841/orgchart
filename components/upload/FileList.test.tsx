// @vitest-environment jsdom
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileList } from "./FileList";
import type { UploadedFile } from "@/lib/store/parse-store";

function makeFile(overrides: Partial<UploadedFile> = {}): UploadedFile {
  return {
    id: "file-1",
    name: "직원목록.xlsx",
    size: 2048,
    fileType: "xlsx",
    status: "pending",
    ...overrides,
  };
}

describe("FileList", () => {
  test("files가 비어 있으면 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<FileList files={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test("파일 이름이 표시된다", () => {
    render(<FileList files={[makeFile({ name: "조직도.xlsx" })]} />);
    expect(screen.getByText("조직도.xlsx")).toBeInTheDocument();
  });

  test("파일 크기가 KB 단위로 표시된다", () => {
    render(<FileList files={[makeFile({ size: 2048 })]} />);
    expect(screen.getByText("2.0 KB")).toBeInTheDocument();
  });

  test("파일 크기가 1024 미만이면 B 단위로 표시된다", () => {
    render(<FileList files={[makeFile({ size: 512 })]} />);
    expect(screen.getByText("512 B")).toBeInTheDocument();
  });

  test("파일 타입 뱃지가 표시된다", () => {
    render(<FileList files={[makeFile({ fileType: "pdf" })]} />);
    expect(screen.getByText("PDF")).toBeInTheDocument();
  });

  test("pending 상태 뱃지가 표시된다", () => {
    render(<FileList files={[makeFile({ status: "pending" })]} />);
    expect(screen.getByText("대기")).toBeInTheDocument();
  });

  test("done 상태 뱃지가 표시된다", () => {
    render(<FileList files={[makeFile({ status: "done" })]} />);
    expect(screen.getByText("완료")).toBeInTheDocument();
  });

  test("error 상태에서 에러 메시지가 표시된다", () => {
    render(
      <FileList
        files={[makeFile({ status: "error", error: "파싱에 실패했습니다" })]}
      />,
    );
    expect(screen.getByText("파싱에 실패했습니다")).toBeInTheDocument();
  });

  test("onRemove 콜백이 X 버튼 클릭 시 호출된다", () => {
    const onRemove = vi.fn();
    render(
      <FileList
        files={[makeFile({ id: "abc", status: "done" })]}
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /제거/ }));
    expect(onRemove).toHaveBeenCalledWith("abc");
  });

  test("parsing 상태에서는 제거 버튼이 표시되지 않는다", () => {
    render(
      <FileList
        files={[makeFile({ status: "parsing" })]}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /제거/ })).not.toBeInTheDocument();
  });

  test("onRemove가 없으면 제거 버튼이 표시되지 않는다", () => {
    render(<FileList files={[makeFile({ status: "done" })]} />);
    expect(screen.queryByRole("button", { name: /제거/ })).not.toBeInTheDocument();
  });

  test("done + result 있으면 시트 요약이 표시된다", () => {
    render(
      <FileList
        files={[
          makeFile({
            status: "done",
            result: {
              sheets: [
                {
                  sheetName: "직원",
                  headers: ["이름", "직책"],
                  rows: Array(10).fill({}),
                },
              ],
              warnings: [],
            },
          }),
        ]}
      />,
    );
    expect(screen.getByText(/\[직원\]/)).toBeInTheDocument();
    expect(screen.getByText(/10행/)).toBeInTheDocument();
  });

  test("복수 파일이 모두 렌더링된다", () => {
    render(
      <FileList
        files={[
          makeFile({ id: "1", name: "파일A.xlsx" }),
          makeFile({ id: "2", name: "파일B.csv" }),
        ]}
      />,
    );
    expect(screen.getByText("파일A.xlsx")).toBeInTheDocument();
    expect(screen.getByText("파일B.csv")).toBeInTheDocument();
  });
});
