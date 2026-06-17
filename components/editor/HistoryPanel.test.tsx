// @vitest-environment jsdom
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HistoryPanel } from "./HistoryPanel";

const SNAPSHOTS = [
  { id: "s1", createdAt: "2024-01-15T10:30:00Z", nodeCount: 5 },
  { id: "s2", createdAt: "2024-01-14T09:00:00Z", nodeCount: 3 },
];

function stubFetch(responses: { ok: boolean; json: unknown }[]) {
  let call = 0;
  return vi.fn().mockImplementation(() => {
    const response = responses[call++];
    return Promise.resolve({ ok: response.ok, json: async () => response.json });
  });
}

describe("HistoryPanel", () => {
  const onRestore = vi.fn();

  beforeEach(() => {
    onRestore.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("스냅샷 목록을 불러와 첫 항목을 '최신 저장'으로 표시한다", async () => {
    vi.stubGlobal("fetch", stubFetch([{ ok: true, json: { snapshots: SNAPSHOTS } }]));
    render(<HistoryPanel projectId="p1" onRestore={onRestore} />);
    await waitFor(() => expect(screen.getByText("최신 저장")).toBeInTheDocument());
    expect(screen.getByText("3개 노드")).toBeInTheDocument();
  });

  test("스냅샷이 없으면 안내 메시지를 표시한다", async () => {
    vi.stubGlobal("fetch", stubFetch([{ ok: true, json: { snapshots: [] } }]));
    render(<HistoryPanel projectId="p1" onRestore={onRestore} />);
    await waitFor(() =>
      expect(screen.getByText(/저장 이력이 없습니다/)).toBeInTheDocument()
    );
  });

  test("fetch 실패 시 오류 메시지를 표시한다", async () => {
    vi.stubGlobal("fetch", stubFetch([{ ok: false, json: {} }]));
    render(<HistoryPanel projectId="p1" onRestore={onRestore} />);
    await waitFor(() =>
      expect(screen.getByText("이력 조회 실패")).toBeInTheDocument()
    );
  });

  test("첫 번째 스냅샷(최신)에는 복원 버튼이 없다", async () => {
    vi.stubGlobal("fetch", stubFetch([{ ok: true, json: { snapshots: SNAPSHOTS } }]));
    render(<HistoryPanel projectId="p1" onRestore={onRestore} />);
    await waitFor(() => screen.getByText("최신 저장"));
    // 복원 버튼은 두 번째 이후 항목에만 존재
    expect(screen.getAllByText("복원")).toHaveLength(1);
  });

  test("복원 버튼 클릭 시 POST → GET tree → onRestore 호출 흐름이 실행된다", async () => {
    const nodes = [{ id: "n1" }];
    vi.stubGlobal(
      "fetch",
      stubFetch([
        { ok: true, json: { snapshots: SNAPSHOTS } },   // 초기 GET snapshots
        { ok: true, json: {} },                          // POST restore
        { ok: true, json: { nodes } },                  // GET tree
        { ok: true, json: { snapshots: SNAPSHOTS } },   // 복원 후 재조회
      ])
    );
    render(<HistoryPanel projectId="p1" onRestore={onRestore} />);
    await waitFor(() => screen.getByText("복원"));
    fireEvent.click(screen.getByText("복원"));
    await waitFor(() => expect(onRestore).toHaveBeenCalledWith(nodes));
  });

  test("새로고침 버튼 클릭 시 fetch가 재호출된다", async () => {
    const fetchMock = stubFetch([
      { ok: true, json: { snapshots: SNAPSHOTS } },
      { ok: true, json: { snapshots: SNAPSHOTS } },
    ]);
    vi.stubGlobal("fetch", fetchMock);
    render(<HistoryPanel projectId="p1" onRestore={onRestore} />);
    await waitFor(() => screen.getByText("최신 저장"));
    fireEvent.click(screen.getByTitle("새로 고침"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
