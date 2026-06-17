"use client";
import { OrgMinimap } from "./OrgMinimap";
import { ZoomControls } from "./ZoomControls";
import { useOrgTreeD3 } from "@/hooks/useOrgTreeD3";
import type { TreeNode, TreeLayout } from "@/lib/tree/builder";
export type { TreeLayout } from "@/lib/tree/builder";

interface Props {
  roots: TreeNode[];
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  layout?: TreeLayout;
  onMove?: (nodeId: string, newParentId: string | null) => void;
  highlightIds?: Set<string>;
  focusId?: string;
}

export function OrgTreeChart(props: Props) {
  const { svgRef, minimapRef, handleZoomIn, handleZoomOut, handleZoomReset } = useOrgTreeD3(props);

  if (props.roots.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        표시할 트리 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="relative w-full h-full border border-slate-200 rounded-lg bg-white overflow-hidden" style={{ minHeight: 400 }}>
      <svg ref={svgRef} className="w-full h-full" />
      <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onZoomReset={handleZoomReset} />
      <OrgMinimap ref={minimapRef} />
    </div>
  );
}
