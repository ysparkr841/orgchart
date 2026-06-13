"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { TreeNode } from "@/lib/tree/builder";

export type TreeLayout = "horizontal" | "vertical";

interface Props {
  roots: TreeNode[];
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  layout?: TreeLayout;
  onMove?: (nodeId: string, newParentId: string | null) => void;
}

interface NodePos {
  id: string;
  x: number;
  y: number;
}

const DROP_THRESHOLD = 70;

function collectSubtreeIds(node: TreeNode): Set<string> {
  const ids = new Set([node.id]);
  node.children.forEach((c) => collectSubtreeIds(c).forEach((id) => ids.add(id)));
  return ids;
}

export function OrgTreeChart({ roots, selectedId, onSelect, layout = "horizontal", onMove }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodePosRef = useRef<NodePos[]>([]);

  useEffect(() => {
    if (!svgRef.current || roots.length === 0) return;

    const virtualRoot: TreeNode =
      roots.length === 1
        ? roots[0]
        : { id: "__root__", title: "", order: 0, children: roots };

    const hierarchy = d3.hierarchy(virtualRoot, (d) => d.children);
    const isVertical = layout === "vertical";
    const treeLayout = isVertical
      ? d3.tree<TreeNode>().nodeSize([100, 120])
      : d3.tree<TreeNode>().nodeSize([40, 200]);
    const root = treeLayout(hierarchy);

    const allNodes = root.descendants();
    const links = root.links();

    nodePosRef.current = allNodes
      .filter((d) => d.data.id !== "__root__")
      .map((d) => ({ id: d.data.id, x: d.y!, y: d.x! }));

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of allNodes) {
      if (n.x! < minX) minX = n.x!;
      if (n.x! > maxX) maxX = n.x!;
      if (n.y! < minY) minY = n.y!;
      if (n.y! > maxY) maxY = n.y!;
    }

    const pad = 80;
    const vbX = isVertical ? minX - pad : minY - pad;
    const vbY = isVertical ? minY - pad : minX - pad;
    const vbW = isVertical ? maxX - minX + pad * 2 : maxY - minY + pad * 2 + 120;
    const vbH = isVertical ? maxY - minY + pad * 2 + 50 : maxX - minX + pad * 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `${vbX} ${vbY} ${vbW} ${vbH}`);

    svg
      .append("g")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1.5)
      .attr("d", (d) => {
        if (isVertical) {
          const sx = d.source.x!, sy = d.source.y!;
          const tx = d.target.x!, ty = d.target.y!;
          const my = (sy + ty) / 2;
          return `M${sx},${sy}C${sx},${my} ${tx},${my} ${tx},${ty}`;
        } else {
          const sx = d.source.y!, sy = d.source.x!;
          const tx = d.target.y!, ty = d.target.x!;
          const mx = (sx + tx) / 2;
          return `M${sx},${sy}C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
        }
      });

    const dropHighlight = svg
      .append("rect")
      .attr("fill", "#dcfce7")
      .attr("stroke", "#22c55e")
      .attr("stroke-width", 2.5)
      .attr("rx", 6)
      .attr("width", 120)
      .attr("height", 28)
      .attr("x", -60)
      .attr("y", -14)
      .attr("visibility", "hidden")
      .attr("pointer-events", "none");

    const ghostG = svg
      .append("g")
      .attr("visibility", "hidden")
      .attr("pointer-events", "none");
    ghostG
      .append("rect")
      .attr("x", -60).attr("y", -14).attr("width", 120).attr("height", 28)
      .attr("rx", 6).attr("fill", "#3b82f6").attr("opacity", 0.5);
    const ghostText = ghostG
      .append("text")
      .attr("dy", "0.35em").attr("text-anchor", "middle")
      .attr("font-size", "12px").attr("fill", "#fff");

    const nodeG = svg
      .append("g")
      .selectAll<SVGGElement, d3.HierarchyPointNode<TreeNode>>("g")
      .data(allNodes)
      .join("g")
      .attr("transform", (d) =>
        isVertical
          ? `translate(${d.x},${d.y})`
          : `translate(${d.y},${d.x})`,
      )
      .style("cursor", onMove ? "grab" : "pointer");

    nodeG
      .append("rect")
      .attr("x", -60).attr("y", -14).attr("width", 120).attr("height", 28)
      .attr("rx", 6)
      .attr("fill", (d) => d.data.id === selectedId ? "#3b82f6" : "#f1f5f9")
      .attr("stroke", (d) => d.data.id === selectedId ? "#2563eb" : "#cbd5e1")
      .attr("stroke-width", 1.5);

    nodeG
      .append("text")
      .attr("dy", "0.35em").attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", (d) => d.data.id === selectedId ? "#fff" : "#1e293b")
      .text((d) => d.data.id === "__root__" ? "" : d.data.title);

    nodeG.on("click", (_, d) => {
      if (d.data.id !== "__root__") onSelect(d.data);
    });

    if (!onMove) return;

    let draggedId: string | null = null;
    let subtreeIds = new Set<string>();

    function findNearestTarget(ex: number, ey: number): NodePos | null {
      let nearest: NodePos | null = null;
      let minDist = Infinity;
      for (const np of nodePosRef.current) {
        if (subtreeIds.has(np.id)) continue;
        const dist = Math.hypot(np.x - ex, np.y - ey);
        if (dist < minDist) { minDist = dist; nearest = np; }
      }
      return nearest && minDist < DROP_THRESHOLD ? nearest : null;
    }

    const drag = d3
      .drag<SVGGElement, d3.HierarchyPointNode<TreeNode>>()
      .filter((_, d) => d.data.id !== "__root__")
      .on("start", function (_, d) {
        draggedId = d.data.id;
        subtreeIds = collectSubtreeIds(d.data);
        ghostText.text(d.data.title);
        ghostG.attr("visibility", "visible")
          .attr("transform", isVertical ? `translate(${d.x},${d.y})` : `translate(${d.y},${d.x})`);
        d3.select(this).style("opacity", 0.4).style("cursor", "grabbing");
      })
      .on("drag", function (event) {
        ghostG.attr("transform", `translate(${event.x},${event.y})`);
        const target = findNearestTarget(event.x, event.y);
        if (target) {
          dropHighlight.attr("visibility", "visible")
            .attr("transform", `translate(${target.x},${target.y})`);
        } else {
          dropHighlight.attr("visibility", "hidden");
        }
      })
      .on("end", function (event) {
        ghostG.attr("visibility", "hidden");
        dropHighlight.attr("visibility", "hidden");
        d3.select(this).style("opacity", 1).style("cursor", "grab");
        if (!draggedId) return;
        const target = findNearestTarget(event.x, event.y);
        if (target) onMove(draggedId, target.id);
        draggedId = null;
        subtreeIds = new Set();
      });

    nodeG.call(drag);
  }, [roots, selectedId, onSelect, layout, onMove]);

  if (roots.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        표시할 트리 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="overflow-auto w-full h-full border border-slate-200 rounded-lg bg-white">
      <svg ref={svgRef} className="w-full" style={{ minHeight: 400 }} />
    </div>
  );
}
