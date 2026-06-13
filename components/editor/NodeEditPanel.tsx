"use client";
import { useState } from "react";
import type { TreeNode } from "@/lib/tree/builder";
import { useEditorStore } from "@/lib/store/editor-store";
import { flattenTree } from "@/lib/tree/builder";

interface Props {
  node: TreeNode;
  onClose: () => void;
}

export function NodeEditPanel({ node, onClose }: Props) {
  const [title, setTitle] = useState(node.title);
  const [name, setName] = useState(node.name ?? "");
  const { roots, updateNode, deleteNode, addNode, moveNode } = useEditorStore();

  const allNodes = flattenTree(roots).filter((n) => n.id !== node.id);

  function handleSaveEdit() {
    updateNode(node.id, { title, name: name || undefined });
  }

  function handleDelete() {
    deleteNode(node.id);
    onClose();
  }

  function handleAddChild() {
    const newNode: TreeNode = {
      id: `node-${Date.now()}`,
      title: "새 노드",
      order: node.children.length,
      children: [],
    };
    addNode(node.id, newNode);
  }

  function handleMove(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    moveNode(node.id, val === "__root__" ? null : val);
  }

  // 현재 부모 id 찾기
  const parentId = findParentId(roots, node.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 text-sm">노드 편집</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-xs"
        >
          ✕
        </button>
      </div>

      {/* 타이틀 편집 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">직위/부서</label>
        <input
          className="border border-slate-200 rounded px-2 py-1 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">이름 (선택)</label>
        <input
          className="border border-slate-200 rounded px-2 py-1 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <button
        onClick={handleSaveEdit}
        className="bg-blue-600 text-white text-sm py-1 rounded hover:bg-blue-700"
      >
        변경 저장
      </button>

      {/* 부모 변경 */}
      <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
        <label className="text-xs text-slate-500">부모 노드 변경</label>
        <select
          className="border border-slate-200 rounded px-2 py-1 text-sm"
          value={parentId ?? "__root__"}
          onChange={handleMove}
        >
          <option value="__root__">(루트로 이동)</option>
          {allNodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.title}
            </option>
          ))}
        </select>
      </div>

      {/* 자식 추가 */}
      <div className="border-t border-slate-100 pt-3">
        <button
          onClick={handleAddChild}
          className="w-full border border-dashed border-slate-300 text-slate-500 text-sm py-1.5 rounded hover:bg-slate-50"
        >
          + 자식 노드 추가
        </button>
      </div>

      {/* 삭제 */}
      <div className="border-t border-slate-100 pt-3">
        <button
          onClick={handleDelete}
          className="w-full text-red-500 text-sm py-1.5 rounded hover:bg-red-50 border border-red-200"
        >
          노드 삭제 (하위 포함)
        </button>
      </div>
    </div>
  );
}

function findParentId(roots: TreeNode[], targetId: string): string | null {
  function dfs(
    nodes: TreeNode[],
    parent: string | null,
  ): string | null | undefined {
    for (const n of nodes) {
      if (n.id === targetId) return parent;
      const found = dfs(n.children, n.id);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  return dfs(roots, null) ?? null;
}
