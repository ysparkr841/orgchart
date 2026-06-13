export interface RawNode {
  id: string;
  title: string;
  name?: string;
  avatarUrl?: string;
  parentId?: string | null;
  order?: number;
  meta?: Record<string, unknown>;
}

export interface TreeNode {
  id: string;
  title: string;
  name?: string;
  avatarUrl?: string;
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
    avatarUrl: raw.avatarUrl,
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

/**
 * DB 저장 전 부모가 자식보다 먼저 오도록 위상 정렬한다.
 * 순환 참조가 있으면 해당 노드는 미방문 상태로 남아 뒤에 추가된다.
 */
export function topologicalSort(nodes: RawNode[]): RawNode[] {
  const map = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const result: RawNode[] = [];

  function visit(id: string, stack: Set<string>): void {
    if (visited.has(id) || stack.has(id)) return;
    stack.add(id);
    const node = map.get(id);
    if (!node) return;
    if (node.parentId && map.has(node.parentId)) {
      visit(node.parentId, stack);
    }
    stack.delete(id);
    visited.add(id);
    result.push(node);
  }

  for (const node of nodes) visit(node.id, new Set());
  return result;
}

/** 트리를 RawNode 배열로 펼친다 (parentId 포함) */
export function treeToRawNodes(roots: TreeNode[]): RawNode[] {
  const result: RawNode[] = [];
  function walk(node: TreeNode, parentId: string | null): void {
    result.push({
      id: node.id,
      title: node.title,
      name: node.name,
      avatarUrl: node.avatarUrl,
      parentId,
      order: node.order,
      meta: node.meta,
    });
    node.children.forEach((c) => walk(c, node.id));
  }
  roots.forEach((r) => walk(r, null));
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
