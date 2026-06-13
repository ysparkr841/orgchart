"use client";
import type { TreeNode } from "@/lib/tree/builder";

interface FlatRow {
  node: TreeNode;
  depth: number;
}

function flatten(nodes: TreeNode[], depth = 0): FlatRow[] {
  const result: FlatRow[] = [];
  for (const node of nodes) {
    result.push({ node, depth });
    result.push(...flatten(node.children, depth + 1));
  }
  return result;
}

interface Props {
  roots: TreeNode[];
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
}

export function OrgListView({ roots, selectedId, onSelect }: Props) {
  const rows = flatten(roots);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        노드가 없습니다
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-slate-100 z-10">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-slate-600 border-b border-slate-200 w-1/2">
              직책 / 이름
            </th>
            <th className="text-left px-4 py-2 font-medium text-slate-600 border-b border-slate-200">
              하위 인원
            </th>
            <th className="text-left px-4 py-2 font-medium text-slate-600 border-b border-slate-200">
              레벨
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ node, depth }) => {
            const isSelected = node.id === selectedId;
            return (
              <tr
                key={node.id}
                onClick={() => onSelect(node)}
                className={`cursor-pointer border-b border-slate-100 hover:bg-blue-50 transition-colors ${
                  isSelected ? "bg-blue-100" : ""
                }`}
              >
                <td className="px-4 py-2">
                  <div
                    className="flex items-center gap-2"
                    style={{ paddingLeft: depth * 20 }}
                  >
                    {depth > 0 && (
                      <span className="text-slate-300 select-none">└</span>
                    )}
                    <div>
                      <span className="font-medium text-slate-800">
                        {node.title}
                      </span>
                      {node.name && (
                        <span className="ml-2 text-slate-500">{node.name}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {node.children.length > 0 ? `${node.children.length}명` : "—"}
                </td>
                <td className="px-4 py-2 text-slate-400">{depth + 1}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
