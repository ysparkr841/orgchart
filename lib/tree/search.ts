import type { TreeNode } from "./builder";

export function searchNodes(nodes: TreeNode[], query: string): Set<string> {
  const q = query.trim().toLowerCase();
  const result = new Set<string>();
  if (!q) return result;

  function traverse(node: TreeNode) {
    if (
      node.title.toLowerCase().includes(q) ||
      (node.name && node.name.toLowerCase().includes(q))
    ) {
      result.add(node.id);
    }
    node.children.forEach(traverse);
  }
  nodes.forEach(traverse);
  return result;
}
