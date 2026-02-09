"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Maximize2 } from "lucide-react";
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

  const loadGraphData = useCallback(async () => {
    setIsLoading(true);
    const result = await getGraphData();
    if (result.success && result.nodes && result.edges) {
      // Transform edges to links for react-force-graph
      const links = result.edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        value: edge.value,
      }));
      setGraphData({
        nodes: result.nodes,
        links,
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadGraphData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadGraphData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = useCallback((node: any) => {
    if (typeof node.id === "string") {
      setSelectedNode(node.id);
    }
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (isLoading) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/50 h-125 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-sm text-zinc-500">Building knowledge graph...</p>
        </div>
      </Card>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/50 h-125 flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-zinc-400 mb-2">No notes to visualize yet</p>
          <p className="text-sm text-zinc-600">
            Add some thoughts and they will appear as connected nodes
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <CardContent className="p-0 relative">
        {/* Controls */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadGraphData()}
            className="border-zinc-700 bg-zinc-900/80 backdrop-blur text-zinc-300 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-zinc-700 bg-zinc-900/80 backdrop-blur text-zinc-300 hover:text-white"
          >
            <Maximize2 className="w-4 h-4 mr-1" />
            Reset View
          </Button>
        </div>

        {/* Selected node info */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-10 max-w-xs">
            <Card className="border-zinc-700 bg-zinc-900/95 backdrop-blur">
              <CardContent className="p-3">
                <p className="text-sm text-zinc-300">
                  {graphData.nodes.find((n) => n.id === selectedNode)?.content}
                </p>
                <p className="text-xs text-zinc-500 mt-2">
                  Click background to reset
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Graph Stats */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-zinc-900/80 backdrop-blur rounded-lg px-3 py-2 border border-zinc-800">
            <p className="text-xs text-zinc-500">
              {graphData.nodes.length} nodes · {graphData.links.length}{" "}
              connections
            </p>
          </div>
        </div>

        {/* Force Graph */}
        <div className="h-125">
          <ForceGraph2D
            graphData={graphData}
            nodeLabel="content"
            nodeAutoColorBy="id"
            linkColor={() => "rgba(99, 102, 241, 0.3)"}
            backgroundColor="rgba(0,0,0,0)"
            onNodeClick={handleNodeClick}
            onBackgroundClick={handleBackgroundClick}
            warmupTicks={100}
            cooldownTicks={50}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            d3VelocityDecay={0.3}
            d3AlphaDecay={0.02}
          />
        </div>
      </CardContent>
    </Card>
  );
}
