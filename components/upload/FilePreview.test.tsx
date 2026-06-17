// @vitest-environment jsdom
import { describe, test, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilePreview } from "./FilePreview";
import type { SheetResult } from "@/lib/parser/excel";

function makeSheet(
  sheetName: string,
  headers: string[],
  rowCount: number,
): SheetResult {
  return {
    sheetName,
    headers,
    rows: Array.from({ length: rowCount }, (_, i) =>
      Object.fromEntries(headers.map((h) => [h, `${h}-${i}`])),
    ),
  };
}

describe("FilePreview", () => {
  test("sheets가 비어 있으면 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<FilePreview sheets={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test("초기 상태에서 미리보기 토글 버튼이 표시된다", () => {
    render(<FilePreview sheets={[makeSheet("Sheet1", ["이름", "직책"], 2)]} />);
    expect(screen.getByText(/미리보기/)).toBeInTheDocument();
  });

  test("버튼 클릭 시 헤더가 렌더링된다", () => {
    render(<FilePreview sheets={[makeSheet("Sheet1", ["이름", "직책"], 2)]} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("이름")).toBeInTheDocument();
    expect(screen.getByText("직책")).toBeInTheDocument();
  });

  test("열린 상태에서 다시 클릭 시 테이블이 사라진다", () => {
    render(<FilePreview sheets={[makeSheet("Sheet1", ["이름"], 1)]} />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(screen.getByRole("table")).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  test("복수 시트일 때 탭 버튼이 시트 이름으로 표시된다", () => {
    render(
      <FilePreview
        sheets={[
          makeSheet("직원목록", ["이름"], 1),
          makeSheet("부서정보", ["부서"], 1),
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /미리보기/ }));
    expect(screen.getByRole("button", { name: "직원목록" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "부서정보" })).toBeInTheDocument();
  });

  test("탭 클릭 시 해당 시트 헤더로 전환된다", () => {
    render(
      <FilePreview
        sheets={[
          makeSheet("Sheet1", ["이름"], 1),
          makeSheet("Sheet2", ["직책"], 1),
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /미리보기/ }));
    fireEvent.click(screen.getByRole("button", { name: "Sheet2" }));
    expect(screen.getByText("직책")).toBeInTheDocument();
  });

  test("헤더가 없으면 안내 메시지가 표시된다", () => {
    render(<FilePreview sheets={[makeSheet("Sheet1", [], 0)]} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("헤더가 없습니다.")).toBeInTheDocument();
  });

  test("rows가 없으면 '데이터 없음'이 표시된다", () => {
    render(<FilePreview sheets={[makeSheet("Sheet1", ["이름"], 0)]} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("데이터 없음")).toBeInTheDocument();
  });

  test("rows가 5개 초과 시 나머지 행 수 안내가 표시된다", () => {
    render(<FilePreview sheets={[makeSheet("Sheet1", ["이름"], 8)]} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/외 3행 더 있음/)).toBeInTheDocument();
  });

  test("rows가 5개 이하면 나머지 행 수 안내가 없다", () => {
    render(<FilePreview sheets={[makeSheet("Sheet1", ["이름"], 5)]} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText(/더 있음/)).not.toBeInTheDocument();
  });
});
