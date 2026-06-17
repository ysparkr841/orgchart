// @vitest-environment jsdom
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileDropZone } from "./FileDropZone";

vi.mock("@/lib/parser/fileType", () => ({
  detectFileType: (name: string) => (name.endsWith(".xlsx") ? "excel" : "unknown"),
  ACCEPTED_MIME_TYPES: [],
  ACCEPTED_EXTENSIONS: ".xlsx",
}));

describe("FileDropZone", () => {
  const onFilesSelected = vi.fn();

  beforeEach(() => {
    onFilesSelected.mockReset();
  });

  test("업로드 안내 텍스트가 표시된다", () => {
    render(<FileDropZone onFilesSelected={onFilesSelected} />);
    expect(screen.getByText(/파일을 끌어다 놓거나/)).toBeInTheDocument();
  });

  test("role=button이 렌더링된다", () => {
    render(<FileDropZone onFilesSelected={onFilesSelected} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  test("dragOver 시 파란 테두리 스타일이 적용된다", () => {
    render(<FileDropZone onFilesSelected={onFilesSelected} />);
    const zone = screen.getByRole("button");
    fireEvent.dragOver(zone);
    expect(zone.className).toContain("border-blue-500");
  });

  test("dragLeave 시 기본 스타일로 복원된다", () => {
    render(<FileDropZone onFilesSelected={onFilesSelected} />);
    const zone = screen.getByRole("button");
    fireEvent.dragOver(zone);
    fireEvent.dragLeave(zone);
    expect(zone.className).not.toContain("border-blue-500");
  });

  test("지원 파일 input 변경 시 onFilesSelected가 호출된다", () => {
    const { container } = render(<FileDropZone onFilesSelected={onFilesSelected} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([""], "test.xlsx");

    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  test("미지원 파일만 있으면 onFilesSelected가 호출되지 않는다", () => {
    const { container } = render(<FileDropZone onFilesSelected={onFilesSelected} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [new File([""], "test.xyz")] } });

    expect(onFilesSelected).not.toHaveBeenCalled();
  });

  test("disabled 상태에서 input 변경 시 onFilesSelected가 호출되지 않는다", () => {
    const { container } = render(<FileDropZone onFilesSelected={onFilesSelected} disabled />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [new File([""], "test.xlsx")] } });

    expect(onFilesSelected).not.toHaveBeenCalled();
  });

  test("disabled 상태일 때 cursor-not-allowed 클래스가 적용된다", () => {
    render(<FileDropZone onFilesSelected={onFilesSelected} disabled />);
    expect(screen.getByRole("button").className).toContain("cursor-not-allowed");
  });

  test("Enter 키 입력 시 에러 없이 실행된다", () => {
    render(<FileDropZone onFilesSelected={onFilesSelected} />);
    expect(() => fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" })).not.toThrow();
  });
});
