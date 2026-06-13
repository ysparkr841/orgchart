import { create } from "zustand";
import type { TreeNode } from "@/lib/tree/builder";

function removeById(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, children: removeById(n.children, id) }));
}

function patchById(
  nodes: TreeNode[],
  id: string,
  patch: Partial<Pick<TreeNode, "title" | "name" | "avatarUrl">>,
): TreeNode[] {
  return nodes.map((n) =>
    n.id === id
      ? { ...n, ...patch }
      : { ...n, children: patchById(n.children, id, patch) },
  );
}

function insertChild(
  nodes: TreeNode[],
  parentId: string | null,
  child: TreeNode,
): TreeNode[] {
  if (parentId === null) return [...nodes, child];
  return nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...n.children, child] }
      : { ...n, children: insertChild(n.children, parentId, child) },
  );
}

function relocate(
  nodes: TreeNode[],
  nodeId: string,
  newParentId: string | null,
): TreeNode[] {
  let target: TreeNode | null = null;
  function extract(ns: TreeNode[]): TreeNode[] {
    return ns
      .filter((n) => {
        if (n.id === nodeId) {
          target = n;
          return false;
        }
        return true;
      })
      .map((n) => ({ ...n, children: extract(n.children) }));
  }
  const without = extract(nodes);
  if (!target) return nodes;
  return insertChild(without, newParentId, target);
}

interface EditorState {
  roots: TreeNode[];
  projectId: string | null;
  isDirty: boolean;
  setRoots: (roots: TreeNode[], projectId?: string) => void;
  addNode: (parentId: string | null, node: TreeNode) => void;
  deleteNode: (id: string) => void;
  updateNode: (id: string, patch: Partial<Pick<TreeNode, "title" | "name" | "avatarUrl">>) => void;
  moveNode: (nodeId: string, newParentId: string | null) => void;
  markSaved: (projectId: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  roots: [],
  projectId: null,
  isDirty: false,
  setRoots: (roots, projectId) =>
    set({ roots, projectId: projectId ?? null, isDirty: false }),
  addNode: (parentId, node) =>
    set((s) => ({ roots: insertChild(s.roots, parentId, node), isDirty: true })),
  deleteNode: (id) =>
    set((s) => ({ roots: removeById(s.roots, id), isDirty: true })),
  updateNode: (id, patch) =>
    set((s) => ({ roots: patchById(s.roots, id, patch), isDirty: true })),
  moveNode: (nodeId, newParentId) =>
    set((s) => ({ roots: relocate(s.roots, nodeId, newParentId), isDirty: true })),
  markSaved: (projectId) => set({ projectId, isDirty: false }),
}));
