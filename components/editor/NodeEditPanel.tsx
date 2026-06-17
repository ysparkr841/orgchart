"use client";
import { useState } from "react";
import type { TreeNode } from "@/lib/tree/builder";
import { useEditorStore } from "@/lib/store/editor-store";
import { flattenTree } from "@/lib/tree/builder";

interface Props {
  node: TreeNode;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { label: "기본", value: "" },
  { label: "파랑", value: "#dbeafe" },
  { label: "초록", value: "#dcfce7" },
  { label: "노랑", value: "#fef9c3" },
  { label: "주황", value: "#ffedd5" },
  { label: "빨강", value: "#fee2e2" },
  { label: "보라", value: "#ede9fe" },
  { label: "핑크", value: "#fce7f3" },
];

export function NodeEditPanel({ node, onClose }: Props) {
  const [title, setTitle] = useState(node.title);
  const [name, setName] = useState(node.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(node.avatarUrl ?? "");
  const [color, setColor] = useState(node.color ?? "");
  const { roots, updateNode, deleteNode, addNode, moveNode } = useEditorStore();

  const allNodes = flattenTree(roots).filter((n) => n.id !== node.id);

  function handleSaveEdit() {
    updateNode(node.id, {
      title,
      name: name || undefined,
      avatarUrl: avatarUrl || undefined,
      color: color || undefined,
    });
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
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="text-slate-400 hover:text-slate-600 text-xs"
        >
          ✕
        </button>
      </div>

      {/* 타이틀 편집 */}
      <div className="flex flex-col gap-1">
        <label htmlFor="node-title" className="text-xs text-slate-500">직위/부서</label>
        <input
          id="node-title"
          className="border border-slate-200 rounded px-2 py-1 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="node-name" className="text-xs text-slate-500">이름 (선택)</label>
        <input
          id="node-name"
          className="border border-slate-200 rounded px-2 py-1 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="node-avatar" className="text-xs text-slate-500">프로필 사진 URL (선택)</label>
        <input
          id="node-avatar"
          className="border border-slate-200 rounded px-2 py-1 text-sm"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://..."
        />
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="프로필 미리보기"
            className="w-10 h-10 rounded-full object-cover border border-slate-200 mt-1"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </div>
      {/* 노드 색상 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">노드 색상</label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              title={preset.label}
              aria-label={preset.label}
              aria-pressed={color === preset.value}
              onClick={() => setColor(preset.value)}
              className={`w-6 h-6 rounded border-2 transition-all ${
                color === preset.value
                  ? "border-blue-500 scale-110"
                  : "border-slate-300 hover:border-slate-400"
              }`}
              style={{
                background: preset.value || "#f1f5f9",
              }}
            />
          ))}
          <input
            type="color"
            value={color || "#f1f5f9"}
            onChange={(e) => setColor(e.target.value)}
            title="직접 선택"
            aria-label="직접 색상 선택"
            className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSaveEdit}
        className="bg-blue-600 text-white text-sm py-1 rounded hover:bg-blue-700"
      >
        변경 저장
      </button>

      {/* 부모 변경 */}
      <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
        <label htmlFor="node-parent" className="text-xs text-slate-500">부모 노드 변경</label>
        <select
          id="node-parent"
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
          type="button"
          onClick={handleAddChild}
          className="w-full border border-dashed border-slate-300 text-slate-500 text-sm py-1.5 rounded hover:bg-slate-50"
        >
          + 자식 노드 추가
        </button>
      </div>

      {/* 삭제 */}
      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
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
