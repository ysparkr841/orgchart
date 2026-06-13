import { describe, expect, it } from "vitest";

// 초기 셋업 스모크 테스트 — 테스트 러너가 정상 동작하는지 확인
describe("setup smoke test", () => {
  it("runs the test runner", () => {
    expect(1 + 1).toBe(2);
  });
});
