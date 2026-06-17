// @vitest-environment jsdom
import { describe, test, expect, vi, beforeAll } from "vitest";
import { renderHook } from "@testing-library/react";
import { useOrgTreeD3 } from "./useOrgTreeD3";
import type { TreeNode } from "@/lib/tree/builder";

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

describe("useOrgTreeD3", () => {
  test("svgRef, minimapRef를 반환한다", () => {
    const { result } = renderHook(() =>
      useOrgTreeD3({ roots: [], selectedId: null, onSelect: vi.fn() })
    );
    expect(result.current.svgRef).toBeDefined();
    expect(result.current.minimapRef).toBeDefined();
  });

  test("handleZoomIn, handleZoomOut, handleZoomReset 콜백을 반환한다", () => {
    const { result } = renderHook(() =>
      useOrgTreeD3({ roots: [], selectedId: null, onSelect: vi.fn() })
    );
    expect(typeof result.current.handleZoomIn).toBe("function");
    expect(typeof result.current.handleZoomOut).toBe("function");
    expect(typeof result.current.handleZoomReset).toBe("function");
  });

  test("svgRef가 null일 때 handleZoomIn 호출 시 크래시 없음", () => {
    const { result } = renderHook(() =>
      useOrgTreeD3({ roots: [], selectedId: null, onSelect: vi.fn() })
    );
    expect(() => result.current.handleZoomIn()).not.toThrow();
  });

  test("svgRef가 null일 때 handleZoomOut 호출 시 크래시 없음", () => {
    const { result } = renderHook(() =>
      useOrgTreeD3({ roots: [], selectedId: null, onSelect: vi.fn() })
    );
    expect(() => result.current.handleZoomOut()).not.toThrow();
  });

  test("svgRef가 null일 때 handleZoomReset 호출 시 크래시 없음", () => {
    const { result } = renderHook(() =>
      useOrgTreeD3({ roots: [], selectedId: null, onSelect: vi.fn() })
    );
    expect(() => result.current.handleZoomReset()).not.toThrow();
  });

  test("roots가 있어도 크래시 없이 초기화된다", () => {
    const { result } = renderHook(() =>
      useOrgTreeD3({
        roots: [makeNode("ceo", "CEO", [makeNode("cto", "CTO")])],
        selectedId: null,
        onSelect: vi.fn(),
        layout: "horizontal",
      })
    );
    expect(result.current.svgRef).toBeDefined();
  });

  test("vertical 레이아웃으로도 크래시 없이 초기화된다", () => {
    const { result } = renderHook(() =>
      useOrgTreeD3({
        roots: [makeNode("ceo", "CEO", [makeNode("cto", "CTO")])],
        selectedId: null,
        onSelect: vi.fn(),
        layout: "vertical",
      })
    );
    expect(result.current.svgRef).toBeDefined();
  });

  test("highlightIds와 focusId가 있어도 크래시 없이 동작한다", () => {
    const { result } = renderHook(() =>
      useOrgTreeD3({
        roots: [makeNode("ceo", "CEO", [makeNode("cto", "CTO")])],
        selectedId: null,
        onSelect: vi.fn(),
        highlightIds: new Set(["cto"]),
        focusId: "cto",
      })
    );
    expect(result.current.svgRef).toBeDefined();
  });
});
