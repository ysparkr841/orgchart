"use client";
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import type { TreeNode } from "@/lib/tree/builder";
import type { TreeLayout } from "@/lib/tree/builder";
import type { MinimapHandle } from "@/components/tree/OrgMinimap";

interface Props {
  roots: TreeNode[];
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  layout?: TreeLayout;
  onMove?: (nodeId: string, newParentId: string | null) => void;
  highlightIds?: Set<string>;
  focusId?: string;
}

interface NodePos { id: string; x: number; y: number }

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

export function useOrgTreeD3({ roots, selectedId, onSelect, layout = "horizontal", onMove, highlightIds, focusId }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodePosRef = useRef<NodePos[]>([]);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
  const fitTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const currentTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const minimapRef = useRef<MinimapHandle>(null);
  const prevRootsRef = useRef<TreeNode[]>([]);
  const prevLayoutRef = useRef<TreeLayout>("horizontal");

  useEffect(() => {
    if (!svgRef.current || roots.length === 0) return;
    const svgEl = svgRef.current;
    const rect = svgEl.getBoundingClientRect();
    const svgW = Math.max(rect.width, 400);
    const svgH = Math.max(rect.height, 300);

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

    const nodeX = (d: d3.HierarchyPointNode<TreeNode>) => (isVertical ? d.x! : d.y!);
    const nodeY = (d: d3.HierarchyPointNode<TreeNode>) => (isVertical ? d.y! : d.x!);

    nodePosRef.current = allNodes
      .filter((d) => d.data.id !== "__root__")
      .map((d) => ({ id: d.data.id, x: nodeX(d), y: nodeY(d) }));

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of allNodes) {
      const nx = nodeX(n), ny = nodeY(n);
      if (nx < minX) minX = nx; if (nx > maxX) maxX = nx;
      if (ny < minY) minY = ny; if (ny > maxY) maxY = ny;
    }

    const pad = 100;
    const vbX = minX - pad;
    const vbY = minY - pad;
    const vbW = maxX - minX + pad * 2 + 170;
    const vbH = maxY - minY + pad * 2 + 44;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const mainG = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 5])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        mainG.attr("transform", event.transform.toString());
        currentTransformRef.current = event.transform;
        const r2 = svgEl.getBoundingClientRect();
        minimapRef.current?.setViewport(event.transform.k, event.transform.x, event.transform.y, r2.width, r2.height);
      });
    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    const shouldFit = roots !== prevRootsRef.current || layout !== prevLayoutRef.current;
    prevRootsRef.current = roots;
    prevLayoutRef.current = layout;

    if (shouldFit || currentTransformRef.current === d3.zoomIdentity) {
      const scale = Math.min(svgW / vbW, svgH / vbH) * 0.85;
      const fit = d3.zoomIdentity
        .translate((svgW - vbW * scale) / 2 - vbX * scale, (svgH - vbH * scale) / 2 - vbY * scale)
        .scale(scale);
      fitTransformRef.current = fit;
      currentTransformRef.current = fit;
      try { zoom.transform(svg, fit); } catch { /* jsdom SVG baseVal 미지원 환경에서 skip */ }
    } else {
      try { zoom.transform(svg, currentTransformRef.current); } catch { /* same */ }
    }

    if (focusId) {
      const target = nodePosRef.current.find((n) => n.id === focusId);
      if (target) {
        const k = currentTransformRef.current.k;
        const panT = d3.zoomIdentity
          .translate(svgW / 2 - target.x * k, svgH / 2 - target.y * k)
          .scale(k);
        currentTransformRef.current = panT;
        try { zoom.transform(svg, panT); } catch { /* jsdom */ }
      }
    }

    svg.append("defs")
      .append("clipPath").attr("id", "org-avatar-clip")
      .attr("clipPathUnits", "objectBoundingBox")
      .append("circle").attr("cx", 0.5).attr("cy", 0.5).attr("r", 0.5);

    mainG.append("g")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1.5)
      .attr("d", (d) => {
        const sx = nodeX(d.source), sy = nodeY(d.source);
        const tx2 = nodeX(d.target), ty2 = nodeY(d.target);
        if (isVertical) {
          const my = (sy + ty2) / 2;
          return `M${sx},${sy}C${sx},${my} ${tx2},${my} ${tx2},${ty2}`;
        }
        const mx = (sx + tx2) / 2;
        return `M${sx},${sy}C${mx},${sy} ${mx},${ty2} ${tx2},${ty2}`;
      });

    const dropHighlight = mainG.append("rect")
      .attr("fill", "#dcfce7").attr("stroke", "#22c55e").attr("stroke-width", 2.5)
      .attr("rx", 8).attr("width", 170).attr("height", 44).attr("x", -75).attr("y", -22)
      .attr("visibility", "hidden").attr("pointer-events", "none");

    const ghostG = mainG.append("g").attr("visibility", "hidden").attr("pointer-events", "none");
    ghostG.append("rect")
      .attr("x", -75).attr("y", -22).attr("width", 170).attr("height", 44)
      .attr("rx", 8).attr("fill", "#3b82f6").attr("opacity", 0.5);
    const ghostText = ghostG.append("text")
      .attr("dy", "0.35em").attr("text-anchor", "middle")
      .attr("font-size", "12px").attr("fill", "#fff");

    const isSearchActive = (highlightIds?.size ?? 0) > 0;

    const nodeG = mainG.append("g")
      .selectAll<SVGGElement, d3.HierarchyPointNode<TreeNode>>("g")
      .data(allNodes)
      .join("g")
      .attr("transform", (d) => `translate(${nodeX(d)},${nodeY(d)})`)
      .style("cursor", onMove ? "grab" : "pointer")
      .style("opacity", (d) => {
        if (!isSearchActive || d.data.id === "__root__") return 1;
        return highlightIds!.has(d.data.id) ? 1 : 0.2;
      });

    nodeG.append("rect")
      .attr("x", -75).attr("y", -22).attr("width", 170).attr("height", 44).attr("rx", 8)
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
      .attr("stroke-width", (d) => (isSearchActive && highlightIds!.has(d.data.id) ? 2 : 1.5));

    const realNodes = nodeG.filter((d) => d.data.id !== "__root__");

    realNodes.append("circle")
      .attr("cx", -50).attr("cy", 0).attr("r", 16)
      .attr("fill", (d) => (d.data.id === selectedId ? "#1d4ed8" : avatarColor(d.data.title)));

    realNodes.filter((d) => !d.data.avatarUrl)
      .append("text")
      .attr("x", -50).attr("y", 0).attr("dy", "0.35em")
      .attr("text-anchor", "middle").attr("font-size", "13px").attr("font-weight", "700")
      .attr("fill", "white").attr("pointer-events", "none")
      .text((d) => d.data.title.charAt(0).toUpperCase());

    realNodes.filter((d) => !!d.data.avatarUrl)
      .append("image")
      .attr("href", (d) => d.data.avatarUrl!)
      .attr("x", -66).attr("y", -16).attr("width", 32).attr("height", 32)
      .attr("clip-path", "url(#org-avatar-clip)")
      .attr("preserveAspectRatio", "xMidYMid slice");

    realNodes.append("text")
      .attr("x", -26)
      .attr("y", (d) => (d.data.name ? -6 : 0))
      .attr("dy", "0.35em").attr("text-anchor", "start")
      .attr("font-size", "12px").attr("font-weight", "600")
      .attr("fill", (d) => (d.data.id === selectedId ? "#fff" : "#1e293b"))
      .attr("pointer-events", "none")
      .text((d) => d.data.title);

    realNodes.filter((d) => !!d.data.name)
      .append("text")
      .attr("x", -26).attr("y", 8).attr("dy", "0.35em")
      .attr("text-anchor", "start").attr("font-size", "10px")
      .attr("fill", (d) => (d.data.id === selectedId ? "#dbeafe" : "#64748b"))
      .attr("pointer-events", "none")
      .text((d) => d.data.name!);

    nodeG.on("click", (_, d) => {
      if (d.data.id !== "__root__") onSelect(d.data);
    });

    const minimapLinks = links.map((l) => ({
      sx: nodeX(l.source), sy: nodeY(l.source),
      tx: nodeX(l.target), ty: nodeY(l.target),
    }));
    const minimapNodes = allNodes
      .filter((d) => d.data.id !== "__root__")
      .map((d) => ({ id: d.data.id, x: nodeX(d), y: nodeY(d) }));
    minimapRef.current?.setContent(minimapNodes, minimapLinks, vbX, vbY, vbW, vbH);
    const ct = currentTransformRef.current;
    minimapRef.current?.setViewport(ct.k, ct.x, ct.y, svgW, svgH);

    if (!onMove) return;

    let draggedId: string | null = null;
    let subtreeIds = new Set<string>();

    function toTree(ex: number, ey: number): [number, number] {
      const t = d3.zoomTransform(svgEl);
      return [(ex - t.x) / t.k, (ey - t.y) / t.k];
    }

    function findNearestTarget(tx: number, ty: number): NodePos | null {
      let nearest: NodePos | null = null;
      let minDist = Infinity;
      for (const np of nodePosRef.current) {
        if (subtreeIds.has(np.id)) continue;
        const dist = Math.hypot(np.x - tx, np.y - ty);
        if (dist < minDist) { minDist = dist; nearest = np; }
      }
      return nearest && minDist < DROP_THRESHOLD ? nearest : null;
    }

    const drag = d3.drag<SVGGElement, d3.HierarchyPointNode<TreeNode>>()
      .filter((_, d) => d.data.id !== "__root__")
      .on("start", function (event, d) {
        draggedId = d.data.id;
        subtreeIds = collectSubtreeIds(d.data);
        ghostText.text(d.data.title);
        ghostG.attr("visibility", "visible")
          .attr("transform", `translate(${nodeX(d)},${nodeY(d)})`);
        d3.select(this).style("opacity", 0.4).style("cursor", "grabbing");
        event.sourceEvent.stopPropagation();
      })
      .on("drag", function (event) {
        const [tx2, ty2] = toTree(event.x, event.y);
        ghostG.attr("transform", `translate(${tx2},${ty2})`);
        const target = findNearestTarget(tx2, ty2);
        if (target) {
          dropHighlight.attr("visibility", "visible").attr("transform", `translate(${target.x},${target.y})`);
        } else {
          dropHighlight.attr("visibility", "hidden");
        }
      })
      .on("end", function (event) {
        const [tx2, ty2] = toTree(event.x, event.y);
        ghostG.attr("visibility", "hidden");
        dropHighlight.attr("visibility", "hidden");
        d3.select(this).style("opacity", 1).style("cursor", "grab");
        if (!draggedId) return;
        const target = findNearestTarget(tx2, ty2);
        if (target) onMove(draggedId, target.id);
        draggedId = null;
        subtreeIds = new Set();
      });

    nodeG.call(drag);
  }, [roots, selectedId, onSelect, layout, onMove, highlightIds, focusId]);

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    zoomBehaviorRef.current.scaleBy(d3.select(svgRef.current), 1.5);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    zoomBehaviorRef.current.scaleBy(d3.select(svgRef.current), 1 / 1.5);
  }, []);

  const handleZoomReset = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    zoomBehaviorRef.current.transform(d3.select(svgRef.current), fitTransformRef.current);
  }, []);

  return { svgRef, minimapRef, handleZoomIn, handleZoomOut, handleZoomReset };
}
