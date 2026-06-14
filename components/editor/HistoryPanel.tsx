"use client";
import { useState, useEffect, useCallback } from "react";

interface SnapshotMeta {
  id: string;
  createdAt: string;
  nodeCount: number;
}

interface Props {
  projectId: string;
  onRestore: (nodes: unknown[]) => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function HistoryPanel({ projectId, onRestore }: Props) {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/history/${projectId}`);
      if (!res.ok) throw new Error("이력 조회 실패");
      const data = (await res.json()) as { snapshots: SnapshotMeta[] };
      setSnapshots(data.snapshots);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchSnapshots();
  }, [fetchSnapshots]);

  async function handleRestore(snapshotId: string) {
    setRestoring(snapshotId);
    setError(null);
    try {
      const res = await fetch(`/api/history/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshotId }),
      });
      if (!res.ok) throw new Error("복원 실패");
      // 복원 후 최신 트리 데이터 가져오기
      const treeRes = await fetch(`/api/tree/${projectId}`);
      if (!treeRes.ok) throw new Error("트리 조회 실패");
      const treeData = (await treeRes.json()) as { nodes: unknown[] };
      onRestore(treeData.nodes);
      await fetchSnapshots();
    } catch (e) {
      setError(e instanceof Error ? e.message : "복원 실패");
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700">변경 이력</h2>
        <button
          onClick={() => void fetchSnapshots()}
          disabled={loading}
          className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-40"
          title="새로 고침"
        >
          ↺
        </button>
      </div>

      {error && (
        <p className="px-4 py-2 text-xs text-red-500">{error}</p>
      )}

      {loading ? (
        <p className="px-4 py-4 text-xs text-slate-400">불러오는 중…</p>
      ) : snapshots.length === 0 ? (
        <p className="px-4 py-4 text-xs text-slate-400">
          저장 이력이 없습니다. 조직도를 저장하면 이력이 쌓입니다.
        </p>
      ) : (
        <ul className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {snapshots.map((s, i) => (
            <li key={s.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50">
              <div>
                <p className="text-xs font-medium text-slate-700">
                  {i === 0 ? "최신 저장" : formatDate(s.createdAt)}
                </p>
                {i !== 0 && (
                  <p className="text-xs text-slate-400">{s.nodeCount}개 노드</p>
                )}
                {i === 0 && (
                  <p className="text-xs text-slate-400">{formatDate(s.createdAt)} · {s.nodeCount}개 노드</p>
                )}
              </div>
              {i !== 0 && (
                <button
                  onClick={() => void handleRestore(s.id)}
                  disabled={restoring !== null}
                  className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {restoring === s.id ? "복원 중…" : "복원"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
