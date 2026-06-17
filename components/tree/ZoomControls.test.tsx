// @vitest-environment jsdom
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ZoomControls } from "./ZoomControls";

describe("ZoomControls", () => {
  function setup() {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onZoomReset = vi.fn();
    render(<ZoomControls onZoomIn={onZoomIn} onZoomOut={onZoomOut} onZoomReset={onZoomReset} />);
    return { onZoomIn, onZoomOut, onZoomReset };
  }

  test("확대 버튼이 렌더링된다", () => {
    setup();
    expect(screen.getByTitle("확대")).toBeInTheDocument();
  });

  test("전체 보기 버튼이 렌더링된다", () => {
    setup();
    expect(screen.getByTitle("전체 보기")).toBeInTheDocument();
  });

  test("축소 버튼이 렌더링된다", () => {
    setup();
    expect(screen.getByTitle("축소")).toBeInTheDocument();
  });

  test("확대 버튼 클릭 시 onZoomIn이 호출된다", () => {
    const { onZoomIn } = setup();
    fireEvent.click(screen.getByTitle("확대"));
    expect(onZoomIn).toHaveBeenCalledTimes(1);
  });

  test("축소 버튼 클릭 시 onZoomOut이 호출된다", () => {
    const { onZoomOut } = setup();
    fireEvent.click(screen.getByTitle("축소"));
    expect(onZoomOut).toHaveBeenCalledTimes(1);
  });

  test("전체 보기 버튼 클릭 시 onZoomReset이 호출된다", () => {
    const { onZoomReset } = setup();
    fireEvent.click(screen.getByTitle("전체 보기"));
    expect(onZoomReset).toHaveBeenCalledTimes(1);
  });

  test("버튼 3개가 모두 존재한다", () => {
    const { container } = render(
      <ZoomControls onZoomIn={vi.fn()} onZoomOut={vi.fn()} onZoomReset={vi.fn()} />
    );
    expect(container.querySelectorAll("button")).toHaveLength(3);
  });
});
