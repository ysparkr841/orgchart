// @vitest-environment jsdom
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColumnMappingForm } from "./ColumnMappingForm";
import { useMappingStore } from "@/lib/store/mapping-store";

vi.mock("@/lib/parser/excel", () => ({
  guessNameColumn: () => "이름",
  guessTitleColumn: () => "직책",
  guessParentColumn: () => null,
}));

const defaultProps = {
  fileId: "file-1",
  fileName: "직원목록.xlsx",
  sheetName: "Sheet1",
  headers: ["이름", "직책", "상위부서"],
};

describe("ColumnMappingForm", () => {
  beforeEach(() => {
    useMappingStore.getState().clearMappings();
  });

  test("파일명과 시트명이 표시된다", () => {
    render(<ColumnMappingForm {...defaultProps} />);
    expect(screen.getByText("직원목록.xlsx")).toBeInTheDocument();
    expect(screen.getByText(/Sheet1/)).toBeInTheDocument();
  });

  test("헤더 수가 표시된다", () => {
    render(<ColumnMappingForm {...defaultProps} />);
    expect(screen.getByText(/헤더 3개/)).toBeInTheDocument();
  });

  test("컬럼 레이블이 모두 표시된다", () => {
    render(<ColumnMappingForm {...defaultProps} />);
    expect(screen.getByText("이름 컬럼 *")).toBeInTheDocument();
    expect(screen.getByText("직위/부서 컬럼")).toBeInTheDocument();
    expect(screen.getByText("상위부서 컬럼")).toBeInTheDocument();
  });

  test("셀렉트 3개가 렌더링된다", () => {
    render(<ColumnMappingForm {...defaultProps} />);
    expect(screen.getAllByRole("combobox")).toHaveLength(3);
  });

  test("헤더 항목이 각 셀렉트의 옵션으로 포함된다", () => {
    render(<ColumnMappingForm {...defaultProps} />);
    const [nameSelect] = screen.getAllByRole("combobox");
    const values = Array.from(nameSelect.querySelectorAll("option")).map(
      (o) => (o as HTMLOptionElement).value,
    );
    expect(values).toContain("이름");
    expect(values).toContain("직책");
    expect(values).toContain("상위부서");
  });

  test("이름 셀렉트 변경 시 스토어가 업데이트된다", () => {
    render(<ColumnMappingForm {...defaultProps} />);
    const [nameSelect] = screen.getAllByRole("combobox");
    fireEvent.change(nameSelect, { target: { value: "직책" } });

    const mapping = useMappingStore.getState().getMapping("file-1", "Sheet1");
    expect(mapping?.nameColumn).toBe("직책");
  });

  test("'선택 안 함' 선택 시 null로 업데이트된다", () => {
    render(<ColumnMappingForm {...defaultProps} />);
    const [nameSelect] = screen.getAllByRole("combobox");
    fireEvent.change(nameSelect, { target: { value: "__none__" } });

    const mapping = useMappingStore.getState().getMapping("file-1", "Sheet1");
    expect(mapping?.nameColumn).toBeNull();
  });
});
