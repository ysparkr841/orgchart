"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { TreeNode } from "@/lib/tree/builder";

interface Props {
  roots: TreeNode[];
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
}

export function OrgTreeChart({ roots, selectedId, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || roots.length === 0) return;

    // 다중 루트는 가상 루트로 감쌈
    const virtualRoot: TreeNode =
      roots.length === 1
        ? roots[0]
        : { id: "__root__", title: "", order: 0, children: roots };

    const root = d3.hierarchy(virtualRoot, (d) => d.children);
    const treeLayout = d3.tree<TreeNode>().nodeSize([40, 200]);
    treeLayout(root);

    const allNodes = root.descendants();
    const links = root.links();

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of allNodes) {
      if (n.x! < minX) minX = n.x!;
      if (n.x! > maxX) maxX = n.x!;
      if (n.y! < minY) minY = n.y!;
      if (n.y! > maxY) maxY = n.y!;
    }

    const pad = 80;
    const vbX = minY - pad;
    const vbY = minX - pad;
    const vbW = maxY - minY + pad * 2 + 120;
    const vbH = maxX - minX + pad * 2;

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
        const sx = d.source.y!;
        const sy = d.source.x!;
        const tx = d.target.y!;
        const ty = d.target.x!;
        const mx = (sx + tx) / 2;
        return `M${sx},${sy}C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
      });

    const nodeG = svg
      .append("g")
      .selectAll("g")
      .data(allNodes)
      .join("g")
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .style("cursor", "pointer")
      .on("click", (_, d) => {
        if (d.data.id !== "__root__") onSelect(d.data);
      });

    nodeG
      .append("rect")
      .attr("x", -60)
      .attr("y", -14)
      .attr("width", 120)
      .attr("height", 28)
      .attr("rx", 6)
      .attr("fill", (d) =>
        d.data.id === selectedId ? "#3b82f6" : "#f1f5f9",
      )
      .attr("stroke", (d) =>
        d.data.id === selectedId ? "#2563eb" : "#cbd5e1",
      )
      .attr("stroke-width", 1.5);

    nodeG
      .append("text")
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", (d) => (d.data.id === selectedId ? "#fff" : "#1e293b"))
      .text((d) => (d.data.id === "__root__" ? "" : d.data.title));
  }, [roots, selectedId, onSelect]);

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
