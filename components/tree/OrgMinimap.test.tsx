// @vitest-environment jsdom
import { describe, test, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { createRef } from "react";
import { OrgMinimap, type MinimapHandle } from "./OrgMinimap";

describe("OrgMinimap", () => {
  test("'미니맵' 레이블이 렌더링된다", () => {
    render(<OrgMinimap />);
    expect(screen.getByText("미니맵")).toBeInTheDocument();
  });

  test("SVG 요소가 렌더링된다", () => {
    const { container } = render(<OrgMinimap />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  test("setContent 호출 시 SVG에 노드/링크 요소가 추가된다", () => {
    const ref = createRef<MinimapHandle>();
    const { container } = render(<OrgMinimap ref={ref} />);
    act(() => {
      ref.current!.setContent(
        [{ id: "n1", x: 0, y: 0 }, { id: "n2", x: 100, y: 100 }],
        [{ sx: 0, sy: 0, tx: 100, ty: 100 }],
        -50, -50, 300, 200
      );
    });
    // setContent 후 circle 2개, line 1개가 SVG에 추가됨
    expect(container.querySelectorAll("circle")).toHaveLength(2);
    expect(container.querySelectorAll("line")).toHaveLength(1);
  });

  test("setViewport 호출 시 크래시 없이 뷰포트 rect가 갱신된다", () => {
    const ref = createRef<MinimapHandle>();
    const { container } = render(<OrgMinimap ref={ref} />);
    act(() => {
      ref.current!.setContent(
        [{ id: "n1", x: 0, y: 0 }],
        [],
        0, 0, 400, 300
      );
    });
    expect(() => {
      act(() => {
        ref.current!.setViewport(1.5, -100, -50, 800, 600);
      });
    }).not.toThrow();
    // 뷰포트 rect가 SVG 내에 존재
    expect(container.querySelectorAll("rect")).toHaveLength(1);
  });
});
