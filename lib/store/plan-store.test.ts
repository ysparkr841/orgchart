import { describe, it, expect, beforeEach } from "vitest";
import { usePlanStore } from "./plan-store";

beforeEach(() => {
  usePlanStore.setState({ plan: "free" });
});

describe("usePlanStore", () => {
  it("기본값은 free 플랜이다", () => {
    expect(usePlanStore.getState().plan).toBe("free");
  });

  it("isFree()는 free 플랜일 때 true를 반환한다", () => {
    expect(usePlanStore.getState().isFree()).toBe(true);
  });

  it("setPlan('pro')으로 pro 플랜으로 변경된다", () => {
    usePlanStore.getState().setPlan("pro");
    expect(usePlanStore.getState().plan).toBe("pro");
  });

  it("pro 플랜일 때 isFree()는 false를 반환한다", () => {
    usePlanStore.getState().setPlan("pro");
    expect(usePlanStore.getState().isFree()).toBe(false);
  });

  it("free로 다시 전환할 수 있다", () => {
    usePlanStore.getState().setPlan("pro");
    usePlanStore.getState().setPlan("free");
    expect(usePlanStore.getState().plan).toBe("free");
    expect(usePlanStore.getState().isFree()).toBe(true);
  });
});
