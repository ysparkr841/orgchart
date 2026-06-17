// @vitest-environment jsdom
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrgListView } from "./OrgListView";
import type { TreeNode } from "@/lib/tree/builder";

function makeNode(
  id: string,
  title: string,
  opts: { name?: string; children?: TreeNode[] } = {}
): TreeNode {
  return { id, title, order: 0, children: opts.children ?? [], name: opts.name };
}

const CEO = makeNode("ceo", "대표이사", {
  name: "김철수",
  children: [
    makeNode("cto", "CTO", {
      name: "이영희",
      children: [makeNode("dev", "개발팀장")],
    }),
  ],
});

describe("OrgListView", () => {
  test("노드가 없으면 '노드가 없습니다' 메시지를 표시한다", () => {
    render(<OrgListView roots={[]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText("노드가 없습니다")).toBeInTheDocument();
  });

  test("트리를 재귀적으로 펼쳐 모든 노드 행을 렌더링한다", () => {
    render(<OrgListView roots={[CEO]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText("대표이사")).toBeInTheDocument();
    expect(screen.getByText("CTO")).toBeInTheDocument();
    expect(screen.getByText("개발팀장")).toBeInTheDocument();
  });

  test("name 필드가 있으면 직책 옆에 함께 표시된다", () => {
    render(<OrgListView roots={[CEO]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText("김철수")).toBeInTheDocument();
    expect(screen.getByText("이영희")).toBeInTheDocument();
  });

  test("searchQuery로 title 기준 필터링이 된다", () => {
    render(
      <OrgListView roots={[CEO]} selectedId={null} onSelect={vi.fn()} searchQuery="cto" />
    );
    expect(screen.getByText("CTO")).toBeInTheDocument();
    expect(screen.queryByText("대표이사")).not.toBeInTheDocument();
  });

  test("searchQuery로 name 기준 필터링이 된다", () => {
    render(
      <OrgListView roots={[CEO]} selectedId={null} onSelect={vi.fn()} searchQuery="이영희" />
    );
    expect(screen.getByText("CTO")).toBeInTheDocument();
    expect(screen.queryByText("대표이사")).not.toBeInTheDocument();
  });

  test("검색 결과가 없으면 검색어 포함 안내 메시지를 표시한다", () => {
    render(
      <OrgListView roots={[CEO]} selectedId={null} onSelect={vi.fn()} searchQuery="없는노드" />
    );
    expect(screen.getByText(/"없는노드" 검색 결과 없음/)).toBeInTheDocument();
  });

  test("행 클릭 시 해당 노드로 onSelect가 호출된다", () => {
    const onSelect = vi.fn();
    render(<OrgListView roots={[CEO]} selectedId={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("CTO").closest("tr")!);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "cto" }));
  });

  test("selectedId 행에 bg-blue-100 클래스가 적용된다", () => {
    render(<OrgListView roots={[CEO]} selectedId="cto" onSelect={vi.fn()} />);
    const row = screen.getByText("CTO").closest("tr")!;
    expect(row.className).toContain("bg-blue-100");
  });

  test("자식이 있는 노드는 직속 자식 수를 표시한다", () => {
    render(<OrgListView roots={[CEO]} selectedId={null} onSelect={vi.fn()} />);
    // 대표이사(1명), CTO(1명), 개발팀장(—)
    expect(screen.getAllByText("1명")).toHaveLength(2);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  test("선택된 행에 aria-selected='true'가 설정된다", () => {
    render(<OrgListView roots={[CEO]} selectedId="cto" onSelect={vi.fn()} />);
    const selectedRow = screen.getByText("CTO").closest("tr")!;
    expect(selectedRow).toHaveAttribute("aria-selected", "true");
  });

  test("선택되지 않은 행에 aria-selected='false'가 설정된다", () => {
    render(<OrgListView roots={[CEO]} selectedId="cto" onSelect={vi.fn()} />);
    const unselectedRow = screen.getByText("대표이사").closest("tr")!;
    expect(unselectedRow).toHaveAttribute("aria-selected", "false");
  });

  test("Enter 키 입력 시 해당 노드로 onSelect가 호출된다", () => {
    const onSelect = vi.fn();
    render(<OrgListView roots={[CEO]} selectedId={null} onSelect={onSelect} />);
    const row = screen.getByText("CTO").closest("tr")!;
    fireEvent.keyDown(row, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "cto" }));
  });

  test("테이블에 aria-label='조직도 목록'이 설정된다", () => {
    render(<OrgListView roots={[CEO]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByRole("table", { name: "조직도 목록" })).toBeInTheDocument();
  });
});
