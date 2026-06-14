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
  highlightIds?: Set<string>;
}

interface NodePos {
  id: string;
  x: number;
  y: number;
}

const DROP_THRESHOLD = 70;

const AVATAR_PALETTE = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6",
];

function avatarColor(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function collectSubtreeIds(node: TreeNode): Set<string> {
  const ids = new Set([node.id]);
  node.children.forEach((c) => collectSubtreeIds(c).forEach((id) => ids.add(id)));
  return ids;
}

export function OrgTreeChart({ roots, selectedId, onSelect, layout = "horizontal", onMove, highlightIds }: Props) {
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
      ? d3.tree<TreeNode>().nodeSize([120, 140])
      : d3.tree<TreeNode>().nodeSize([60, 220]);
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

    const pad = 100;
    const vbX = isVertical ? minX - pad : minY - pad;
    const vbY = isVertical ? minY - pad : minX - pad;
    const vbW = isVertical ? maxX - minX + pad * 2 : maxY - minY + pad * 2 + 170;
    const vbH = isVertical ? maxY - minY + pad * 2 + 44 : maxX - minX + pad * 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `${vbX} ${vbY} ${vbW} ${vbH}`);

    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "org-avatar-clip")
      .attr("clipPathUnits", "objectBoundingBox")
      .append("circle")
      .attr("cx", 0.5).attr("cy", 0.5).attr("r", 0.5);

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
      .attr("rx", 8)
      .attr("width", 170).attr("height", 44)
      .attr("x", -75).attr("y", -22)
      .attr("visibility", "hidden")
      .attr("pointer-events", "none");

    const ghostG = svg
      .append("g")
      .attr("visibility", "hidden")
      .attr("pointer-events", "none");
    ghostG
      .append("rect")
      .attr("x", -75).attr("y", -22).attr("width", 170).attr("height", 44)
      .attr("rx", 8).attr("fill", "#3b82f6").attr("opacity", 0.5);
    const ghostText = ghostG
      .append("text")
      .attr("dy", "0.35em").attr("text-anchor", "middle")
      .attr("font-size", "12px").attr("fill", "#fff");

    const isSearchActive = (highlightIds?.size ?? 0) > 0;

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
      .style("cursor", onMove ? "grab" : "pointer")
      .style("opacity", (d) => {
        if (!isSearchActive || d.data.id === "__root__") return 1;
        return highlightIds!.has(d.data.id) ? 1 : 0.2;
      });

    nodeG
      .append("rect")
      .attr("x", -75).attr("y", -22)
      .attr("width", 170).attr("height", 44)
      .attr("rx", 8)
      .attr("fill", (d) => {
        if (d.data.id === selectedId) return "#3b82f6";
        if (isSearchActive && highlightIds!.has(d.data.id)) return "#fef3c7";
        if (d.data.color) return d.data.color;
        return "#f1f5f9";
      })
      .attr("stroke", (d) => {
        if (d.data.id === selectedId) return "#2563eb";
        if (isSearchActive && highlightIds!.has(d.data.id)) return "#f59e0b";
        if (d.data.color) return d.data.color;
        return "#cbd5e1";
      })
      .attr("stroke-width", (d) =>
        isSearchActive && highlightIds!.has(d.data.id) ? 2 : 1.5,
      );

    const realNodes = nodeG.filter((d) => d.data.id !== "__root__");

    realNodes
      .append("circle")
      .attr("cx", -50).attr("cy", 0).attr("r", 16)
      .attr("fill", (d) =>
        d.data.id === selectedId ? "#1d4ed8" : avatarColor(d.data.title),
      );

    realNodes
      .filter((d) => !d.data.avatarUrl)
      .append("text")
      .attr("x", -50).attr("y", 0).attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("font-size", "13px").attr("font-weight", "700")
      .attr("fill", "white").attr("pointer-events", "none")
      .text((d) => d.data.title.charAt(0).toUpperCase());

    realNodes
      .filter((d) => !!d.data.avatarUrl)
      .append("image")
      .attr("href", (d) => d.data.avatarUrl!)
      .attr("x", -66).attr("y", -16).attr("width", 32).attr("height", 32)
      .attr("clip-path", "url(#org-avatar-clip)")
      .attr("preserveAspectRatio", "xMidYMid slice");

    realNodes
      .append("text")
      .attr("x", -26)
      .attr("y", (d) => (d.data.name ? -6 : 0))
      .attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .attr("font-size", "12px").attr("font-weight", "600")
      .attr("fill", (d) => (d.data.id === selectedId ? "#fff" : "#1e293b"))
      .attr("pointer-events", "none")
      .text((d) => d.data.title);

    realNodes
      .filter((d) => !!d.data.name)
      .append("text")
      .attr("x", -26).attr("y", 8).attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .attr("font-size", "10px")
      .attr("fill", (d) => (d.data.id === selectedId ? "#dbeafe" : "#64748b"))
      .attr("pointer-events", "none")
      .text((d) => d.data.name!);

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
  }, [roots, selectedId, onSelect, layout, onMove, highlightIds]);

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
