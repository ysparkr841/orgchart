import { describe, it, expect, beforeEach } from "vitest";
import { useMappingStore } from "./mapping-store";

beforeEach(() => {
  useMappingStore.setState({ mappings: [] });
});

describe("useMappingStore", () => {
  it("기본 상태는 빈 mappings 배열이다", () => {
    expect(useMappingStore.getState().mappings).toEqual([]);
  });

  it("setMapping으로 새 매핑을 추가한다", () => {
    useMappingStore.getState().setMapping("f1", "Sheet1", { nameColumn: "이름" });
    const m = useMappingStore.getState().mappings;
    expect(m).toHaveLength(1);
    expect(m[0].fileId).toBe("f1");
    expect(m[0].sheetName).toBe("Sheet1");
    expect(m[0].nameColumn).toBe("이름");
    expect(m[0].titleColumn).toBeNull();
    expect(m[0].parentColumn).toBeNull();
  });

  it("동일한 fileId + sheetName이면 기존 매핑을 업데이트한다", () => {
    useMappingStore.getState().setMapping("f1", "Sheet1", { nameColumn: "이름" });
    useMappingStore.getState().setMapping("f1", "Sheet1", { titleColumn: "직위" });
    const m = useMappingStore.getState().mappings;
    expect(m).toHaveLength(1);
    expect(m[0].nameColumn).toBe("이름");
    expect(m[0].titleColumn).toBe("직위");
  });

  it("다른 sheetName이면 별도 매핑으로 추가한다", () => {
    useMappingStore.getState().setMapping("f1", "Sheet1", { nameColumn: "이름" });
    useMappingStore.getState().setMapping("f1", "Sheet2", { nameColumn: "성명" });
    expect(useMappingStore.getState().mappings).toHaveLength(2);
  });

  it("getMapping으로 특정 fileId + sheetName 매핑을 조회한다", () => {
    useMappingStore.getState().setMapping("f1", "Sheet1", { nameColumn: "이름" });
    const m = useMappingStore.getState().getMapping("f1", "Sheet1");
    expect(m).toBeDefined();
    expect(m?.nameColumn).toBe("이름");
  });

  it("존재하지 않는 매핑을 조회하면 undefined를 반환한다", () => {
    const m = useMappingStore.getState().getMapping("none", "Sheet1");
    expect(m).toBeUndefined();
  });

  it("clearMappings으로 모든 매핑이 초기화된다", () => {
    useMappingStore.getState().setMapping("f1", "Sheet1", { nameColumn: "이름" });
    useMappingStore.getState().setMapping("f2", "Sheet1", { nameColumn: "성명" });
    useMappingStore.getState().clearMappings();
    expect(useMappingStore.getState().mappings).toEqual([]);
  });

  it("여러 필드를 한 번에 patch할 수 있다", () => {
    useMappingStore
      .getState()
      .setMapping("f1", "S1", { nameColumn: "이름", titleColumn: "직위", parentColumn: "상위" });
    const m = useMappingStore.getState().getMapping("f1", "S1");
    expect(m?.nameColumn).toBe("이름");
    expect(m?.titleColumn).toBe("직위");
    expect(m?.parentColumn).toBe("상위");
  });
});
