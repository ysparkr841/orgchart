"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { TreeNode } from "@/lib/tree/builder";

interface Props {
  roots: TreeNode[];
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
}

const AVATAR_PALETTE = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6",
];

function avatarColor(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export function OrgTreeChart({ roots, selectedId, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || roots.length === 0) return;

    const virtualRoot: TreeNode =
      roots.length === 1
        ? roots[0]
        : { id: "__root__", title: "", order: 0, children: roots };

    const root = d3.hierarchy(virtualRoot, (d) => d.children);
    const treeLayout = d3.tree<TreeNode>().nodeSize([60, 220]);
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

    const pad = 100;
    const vbX = minY - pad;
    const vbY = minX - pad;
    const vbW = maxY - minY + pad * 2 + 170;
    const vbH = maxX - minX + pad * 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `${vbX} ${vbY} ${vbW} ${vbH}`);

    // 원형 클립패스 — objectBoundingBox 사용 시 모든 이미지에 공통 적용 가능
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "org-avatar-clip")
      .attr("clipPathUnits", "objectBoundingBox")
      .append("circle")
      .attr("cx", 0.5)
      .attr("cy", 0.5)
      .attr("r", 0.5);

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

    // 노드 배경 rect
    nodeG
      .append("rect")
      .attr("x", -75)
      .attr("y", -22)
      .attr("width", 170)
      .attr("height", 44)
      .attr("rx", 8)
      .attr("fill", (d) =>
        d.data.id === selectedId ? "#3b82f6" : "#f1f5f9",
      )
      .attr("stroke", (d) =>
        d.data.id === selectedId ? "#2563eb" : "#cbd5e1",
      )
      .attr("stroke-width", 1.5);

    // 아바타 배경 원 (실제 노드만)
    const realNodes = nodeG.filter((d) => d.data.id !== "__root__");

    realNodes
      .append("circle")
      .attr("cx", -50)
      .attr("cy", 0)
      .attr("r", 16)
      .attr("fill", (d) =>
        d.data.id === selectedId
          ? "#1d4ed8"
          : avatarColor(d.data.title),
      );

    // 아바타 URL 없는 경우: 이니셜 텍스트
    realNodes
      .filter((d) => !d.data.avatarUrl)
      .append("text")
      .attr("x", -50)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("font-size", "13px")
      .attr("font-weight", "700")
      .attr("fill", "white")
      .attr("pointer-events", "none")
      .text((d) => d.data.title.charAt(0).toUpperCase());

    // 아바타 URL 있는 경우: 원형 이미지
    realNodes
      .filter((d) => !!d.data.avatarUrl)
      .append("image")
      .attr("href", (d) => d.data.avatarUrl!)
      .attr("x", -66)
      .attr("y", -16)
      .attr("width", 32)
      .attr("height", 32)
      .attr("clip-path", "url(#org-avatar-clip)")
      .attr("preserveAspectRatio", "xMidYMid slice");

    // 직위/부서 타이틀
    realNodes
      .append("text")
      .attr("x", -26)
      .attr("y", (d) => (d.data.name ? -6 : 0))
      .attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("fill", (d) => (d.data.id === selectedId ? "#fff" : "#1e293b"))
      .attr("pointer-events", "none")
      .text((d) => d.data.title);

    // 이름 (있을 때만)
    realNodes
      .filter((d) => !!d.data.name)
      .append("text")
      .attr("x", -26)
      .attr("y", 8)
      .attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .attr("font-size", "10px")
      .attr("fill", (d) => (d.data.id === selectedId ? "#dbeafe" : "#64748b"))
      .attr("pointer-events", "none")
      .text((d) => d.data.name!);
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
