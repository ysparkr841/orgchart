"use client";
import { forwardRef, useImperativeHandle, useRef } from "react";
import * as d3 from "d3";

interface NodeMini { id: string; x: number; y: number }
interface LinkMini { sx: number; sy: number; tx: number; ty: number }

export interface MinimapHandle {
  setContent(nodes: NodeMini[], links: LinkMini[], vbX: number, vbY: number, vbW: number, vbH: number): void;
  setViewport(k: number, x: number, y: number, svgW: number, svgH: number): void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const OrgMinimap = forwardRef<MinimapHandle, {}>(function OrgMinimap(_, ref) {
  const svgRef = useRef<SVGSVGElement>(null);
  const vpRef = useRef<SVGRectElement | null>(null);

  useImperativeHandle(ref, () => ({
    setContent(nodes, links, vbX, vbY, vbW, vbH) {
      if (!svgRef.current) return;
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg.attr("viewBox", `${vbX} ${vbY} ${vbW} ${vbH}`);

      const strokeW = Math.max(vbW, vbH) / 40;
      const r = Math.max(vbW, vbH) / 35;

      svg.selectAll<SVGLineElement, LinkMini>("line")
        .data(links).join("line")
        .attr("x1", (l) => l.sx).attr("y1", (l) => l.sy)
        .attr("x2", (l) => l.tx).attr("y2", (l) => l.ty)
        .attr("stroke", "#cbd5e1").attr("stroke-width", strokeW);

      svg.selectAll<SVGCircleElement, NodeMini>("circle")
        .data(nodes).join("circle")
        .attr("cx", (n) => n.x).attr("cy", (n) => n.y)
        .attr("r", r).attr("fill", "#64748b");

      vpRef.current = svg.append("rect")
        .attr("fill", "rgba(59,130,246,0.12)")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", strokeW * 1.5)
        .attr("pointer-events", "none")
        .node();
    },
    setViewport(k, x, y, svgW, svgH) {
      if (!vpRef.current) return;
      d3.select(vpRef.current)
        .attr("x", -x / k).attr("y", -y / k)
        .attr("width", svgW / k).attr("height", svgH / k);
    },
  }));

  return (
    <div
      className="absolute bottom-4 left-4 z-10 border border-slate-200 rounded bg-white/90 shadow-sm overflow-hidden"
      style={{ width: 180, height: 100 }}
    >
      <span className="absolute top-0.5 left-1.5 text-[9px] text-slate-400 pointer-events-none select-none">
        미니맵
      </span>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
});
OrgMinimap.displayName = "OrgMinimap";
