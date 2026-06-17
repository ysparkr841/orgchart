// @vitest-environment jsdom
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NodeEditPanel } from "./NodeEditPanel";
import { useEditorStore } from "@/lib/store/editor-store";
import type { TreeNode } from "@/lib/tree/builder";

function makeNode(id: string, title: string, children: TreeNode[] = []): TreeNode {
  return { id, title, order: 0, children };
}

describe("NodeEditPanel", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
    useEditorStore.setState({
      roots: [makeNode("ceo", "CEO", [makeNode("cto", "CTO")])],
      projectId: "proj-1",
      isDirty: false,
    });
  });

  function getCEO(): TreeNode {
    return useEditorStore.getState().roots[0];
  }

  test("노드 타이틀이 입력창에 표시된다", () => {
    render(<NodeEditPanel node={getCEO()} onClose={onClose} />);
    expect(screen.getByDisplayValue("CEO")).toBeInTheDocument();
  });

  test("닫기 버튼 클릭 시 onClose가 호출된다", () => {
    render(<NodeEditPanel node={getCEO()} onClose={onClose} />);
    fireEvent.click(screen.getByText("✕"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("타이틀 수정 후 '변경 저장' 클릭 시 스토어가 업데이트된다", () => {
    const ceo = getCEO();
    render(<NodeEditPanel node={ceo} onClose={onClose} />);
    fireEvent.change(screen.getByDisplayValue("CEO"), { target: { value: "대표이사" } });
    fireEvent.click(screen.getByText("변경 저장"));

    expect(useEditorStore.getState().roots[0].title).toBe("대표이사");
  });

  test("'노드 삭제' 클릭 시 노드가 제거되고 onClose가 호출된다", () => {
    render(<NodeEditPanel node={getCEO()} onClose={onClose} />);
    fireEvent.click(screen.getByText(/노드 삭제/));

    expect(useEditorStore.getState().roots).toHaveLength(0);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("'자식 노드 추가' 클릭 시 자식 수가 증가한다", () => {
    render(<NodeEditPanel node={getCEO()} onClose={onClose} />);
    const before = getCEO().children.length;
    fireEvent.click(screen.getByText(/자식 노드 추가/));

    expect(useEditorStore.getState().roots[0].children.length).toBeGreaterThan(before);
  });

  test("색상 프리셋 버튼이 표시된다", () => {
    render(<NodeEditPanel node={getCEO()} onClose={onClose} />);
    expect(screen.getByTitle("기본")).toBeInTheDocument();
    expect(screen.getByTitle("파랑")).toBeInTheDocument();
  });

  test("닫기 버튼에 aria-label='닫기'가 설정된다", () => {
    render(<NodeEditPanel node={getCEO()} onClose={onClose} />);
    expect(screen.getByRole("button", { name: "닫기" })).toBeInTheDocument();
  });

  test("색상 프리셋 버튼에 aria-pressed가 올바르게 설정된다", () => {
    render(<NodeEditPanel node={getCEO()} onClose={onClose} />);
    const defaultBtn = screen.getByRole("button", { name: "기본" });
    expect(defaultBtn).toHaveAttribute("aria-pressed", "true");
    const blueBtn = screen.getByRole("button", { name: "파랑" });
    expect(blueBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("직위/부서 label이 input과 연결된다", () => {
    render(<NodeEditPanel node={getCEO()} onClose={onClose} />);
    expect(screen.getByLabelText("직위/부서")).toBeInTheDocument();
  });

  test("부모 변경 셀렉트에 '루트로 이동' 옵션이 표시된다", () => {
    render(<NodeEditPanel node={getCEO()} onClose={onClose} />);
    expect(screen.getByText("(루트로 이동)")).toBeInTheDocument();
  });
});
