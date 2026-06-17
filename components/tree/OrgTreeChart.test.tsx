// @vitest-environment jsdom
import { describe, test, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrgTreeChart } from "./OrgTreeChart";
import type { TreeNode } from "@/lib/tree/builder";

// D3 zoom/drag는 getBoundingClientRect + viewBox.baseVal에 의존 — jsdom에서 미구현이므로 스텁 처리
beforeAll(() => {
  vi.spyOn(SVGElement.prototype, "getBoundingClientRect").mockReturnValue({
    width: 800, height: 600, top: 0, left: 0,
    right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect);
  Object.defineProperty(SVGSVGElement.prototype, "viewBox", {
    get: () => ({
      baseVal: { x: 0, y: 0, width: 800, height: 600 },
      animVal: { x: 0, y: 0, width: 800, height: 600 },
    }),
    configurable: true,
  });
});

function makeNode(id: string, title: string, children: TreeNode[] = []): TreeNode {
  return { id, title, order: 0, children };
}

describe("OrgTreeChart", () => {
  test("roots가 빈 배열이면 안내 메시지를 표시한다", () => {
    render(<OrgTreeChart roots={[]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText("표시할 트리 데이터가 없습니다")).toBeInTheDocument();
  });

  test("노드가 있으면 SVG 요소를 렌더링한다", () => {
    const { container } = render(
      <OrgTreeChart roots={[makeNode("ceo", "CEO")]} selectedId={null} onSelect={vi.fn()} />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  test("미니맵 컨테이너가 렌더링된다", () => {
    render(
      <OrgTreeChart roots={[makeNode("ceo", "CEO")]} selectedId={null} onSelect={vi.fn()} />
    );
    expect(screen.getByText("미니맵")).toBeInTheDocument();
  });

  test("vertical 레이아웃으로도 크래시 없이 렌더링된다", () => {
    const { container } = render(
      <OrgTreeChart
        roots={[makeNode("ceo", "CEO", [makeNode("cto", "CTO")])]}
        selectedId={null}
        onSelect={vi.fn()}
        layout="vertical"
      />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  test("다중 루트도 크래시 없이 렌더링된다", () => {
    const { container } = render(
      <OrgTreeChart
        roots={[makeNode("a", "팀A"), makeNode("b", "팀B")]}
        selectedId={null}
        onSelect={vi.fn()}
      />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
