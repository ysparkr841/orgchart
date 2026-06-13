export interface RawNode {
  id: string;
  title: string;
  name?: string;
  parentId?: string | null;
  order?: number;
  meta?: Record<string, unknown>;
}

export interface TreeNode {
  id: string;
  title: string;
  name?: string;
  order: number;
  meta?: Record<string, unknown>;
  children: TreeNode[];
}

export interface BuildResult {
  roots: TreeNode[];
  /** 부모 참조가 존재하지 않는 고아 노드 목록 */
  orphans: RawNode[];
}

function toTreeNode(raw: RawNode): TreeNode {
  return {
    id: raw.id,
    title: raw.title,
    name: raw.name,
    order: raw.order ?? 0,
    meta: raw.meta,
    children: [],
  };
}

/**
 * RawNode 배열을 트리로 조립한다.
 * - parentId가 null/undefined인 노드가 루트
 * - 존재하지 않는 parentId를 참조하면 orphans에 담고 루트로 올린다
 */
export function buildTree(nodes: RawNode[]): BuildResult {
  const map = new Map<string, TreeNode>();
  for (const raw of nodes) {
    map.set(raw.id, toTreeNode(raw));
  }

  const roots: TreeNode[] = [];
  const orphans: RawNode[] = [];

  for (const raw of nodes) {
    const node = map.get(raw.id)!;
    if (!raw.parentId) {
      roots.push(node);
    } else {
      const parent = map.get(raw.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        orphans.push(raw);
        roots.push(node);
      }
    }
  }

  sortChildren(roots);
  return { roots, orphans };
}

function sortChildren(nodes: TreeNode[]): void {
  nodes.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  for (const n of nodes) sortChildren(n.children);
}

/** 트리를 BFS 순서 flat 배열로 펼친다 */
export function flattenTree(roots: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  const queue = [...roots];
  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    queue.push(...node.children);
  }
  return result;
}

/** 특정 노드의 depth를 반환한다 (루트 = 0) */
export function getDepth(roots: TreeNode[], targetId: string): number {
  function dfs(nodes: TreeNode[], depth: number): number {
    for (const n of nodes) {
      if (n.id === targetId) return depth;
      const found = dfs(n.children, depth + 1);
      if (found !== -1) return found;
    }
    return -1;
  }
  return dfs(roots, 0);
}
