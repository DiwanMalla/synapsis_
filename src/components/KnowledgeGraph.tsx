"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Loader2, RefreshCw, ZoomIn, ZoomOut, Crosshair } from "lucide-react";
import { getGraphData } from "@/lib/actions";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface GraphNode {
  id: string;
  content: string;
  val: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export default function KnowledgeGraph() {
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);

  const loadGraphData = useCallback(async () => {
    setIsLoading(true);
    const result = await getGraphData();
    if (result.success && result.nodes && result.edges) {
      const links = result.edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        value: edge.value,
      }));
      setGraphData({ nodes: result.nodes, links });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadGraphData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadGraphData]);

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = useCallback((node: any) => {
    if (typeof node.id === "string") {
      setSelectedNode((prev) => (prev === node.id ? null : node.id));
    }
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleZoomIn = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 1.3, 300);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 0.7, 300);
    }
  };

  const handleCenter = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 60);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-6 h-6 text-purple-500/60 animate-spin" />
            <div className="absolute inset-0 blur-lg bg-purple-500/20 rounded-full" />
          </div>
          <p className="text-[11px] text-zinc-600 font-mono">
            Building knowledge graph...
          </p>
        </div>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center px-8 max-w-xs">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-zinc-700"
            >
              <circle cx="12" cy="12" r="2" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="19" cy="8" r="1.5" />
              <circle cx="7" cy="18" r="1.5" />
              <circle cx="17" cy="18" r="1.5" />
              <line x1="12" y1="10" x2="6" y2="8.5" strokeOpacity="0.3" />
              <line x1="12" y1="10" x2="18" y2="8.5" strokeOpacity="0.3" />
              <line x1="12" y1="14" x2="8" y2="17" strokeOpacity="0.3" />
              <line x1="12" y1="14" x2="16" y2="17" strokeOpacity="0.3" />
            </svg>
          </div>
          <p className="text-xs text-zinc-500 mb-1">Your graph is empty</p>
          <p className="text-[10px] text-zinc-700 leading-relaxed">
            Add thoughts and they&apos;ll appear as connected nodes based on
            semantic similarity
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full relative">
      {/* Controls */}
      <div className="absolute top-4 right-5 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => void loadGraphData()}
          className="p-2 rounded-lg glass-panel text-zinc-500 hover:text-purple-400 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <div className="section-divider w-full my-0.5" />
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg glass-panel text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg glass-panel text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleCenter}
          className="p-2 rounded-lg glass-panel text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Fit to view"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Selected node tooltip */}
      {selectedNode && (
        <div className="absolute bottom-5 left-5 right-5 z-10 animate-fade-in-up">
          <div className="glass-panel rounded-xl px-4 py-3 max-w-md">
            <p className="text-[13px] text-zinc-300 leading-relaxed">
              {graphData.nodes.find((n) => n.id === selectedNode)?.content}
            </p>
            <p className="text-[10px] text-zinc-600 mt-1.5 font-mono">
              Click node again or background to dismiss
            </p>
          </div>
        </div>
      )}

      {/* Stats badge */}
      <div className="absolute bottom-5 right-5 z-10">
        <div className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-3">
          <span className="text-[10px] text-zinc-600 font-mono">
            {graphData.nodes.length} nodes
          </span>
          <span className="text-[10px] text-zinc-700">·</span>
          <span className="text-[10px] text-zinc-600 font-mono">
            {graphData.links.length} edges
          </span>
        </div>
      </div>

      {/* Force Graph */}
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeLabel="content"
        linkColor={() => "rgba(168, 85, 247, 0.5)"}
        linkWidth={(link) => {
          const value = typeof link.value === "number" ? link.value : 0.5;
          return value * 4;
        }}
        backgroundColor="rgba(0,0,0,0)"
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        warmupTicks={100}
        cooldownTicks={50}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        d3VelocityDecay={0.2}
        d3AlphaDecay={0.01}
        linkDistance={60}
        chargeStrength={-100}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = (node as GraphNode).content || "";
          const isSelected = selectedNode === (node as GraphNode).id;
          const fontSize = 10 / globalScale;
          const nodeRadius = isSelected ? 6 : 4;

          // Glow
          if (isSelected) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = "rgba(168, 85, 247, 0.4)";
          }

          // Node circle
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, nodeRadius, 0, 2 * Math.PI);
          ctx.fillStyle = isSelected
            ? "rgba(168, 85, 247, 0.9)"
            : "rgba(124, 58, 237, 0.6)";
          ctx.fill();

          // Outer ring
          ctx.strokeStyle = isSelected
            ? "rgba(168, 85, 247, 0.3)"
            : "rgba(124, 58, 237, 0.15)";
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, nodeRadius + 3, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.shadowBlur = 0;

          // Label (only at a certain zoom level)
          if (globalScale > 0.8) {
            const truncated =
              label.length > 30 ? label.substring(0, 30) + "..." : label;
            ctx.font = `${fontSize}px 'Geist', sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = isSelected
              ? "rgba(255,255,255,0.9)"
              : "rgba(255,255,255,0.4)";
            ctx.fillText(truncated, node.x!, node.y! + nodeRadius + fontSize);
          }
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, 8, 0, 2 * Math.PI);
          ctx.fill();
        }}
      />
    </div>
  );
}
