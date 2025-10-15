import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import ForceGraph2D from "react-force-graph-2d";
import { Card } from "@/components/ui/card";

interface LoreGraphProps {
  campaignId: string;
}

interface GraphNode {
  id: string;
  name: string;
  type: string;
  val: number;
}

interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export default function LoreGraph({ campaignId }: LoreGraphProps) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    loadGraphData();
  }, [campaignId]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const loadGraphData = async () => {
    try {
      // Load lore pages
      const { data: pages, error: pagesError } = await supabase
        .from("lore_pages")
        .select("id, title")
        .eq("campaign_id", campaignId);

      if (pagesError) throw pagesError;

      // Load links
      const { data: loreLinks, error: linksError } = await supabase
        .from("lore_links")
        .select("*")
        .eq("campaign_id", campaignId);

      if (linksError) throw linksError;

      // Build nodes
      const nodeMap = new Map<string, GraphNode>();
      
      pages?.forEach(page => {
        nodeMap.set(page.id, {
          id: page.id,
          name: page.title,
          type: 'LORE',
          val: 10
        });
      });

      // Add entity nodes from links
      loreLinks?.forEach(link => {
        if (link.target_id && !nodeMap.has(link.target_id)) {
          nodeMap.set(link.target_id, {
            id: link.target_id,
            name: link.label,
            type: link.target_type,
            val: 8
          });
        }
      });

      // Build links
      const graphLinks: GraphLink[] = [];
      loreLinks?.forEach(link => {
        if (link.target_id) {
          graphLinks.push({
            source: link.source_page,
            target: link.target_id,
            label: link.label
          });
        }
      });

      setNodes(Array.from(nodeMap.values()));
      setLinks(graphLinks);
    } catch (error) {
      console.error("Error loading graph data:", error);
    }
  };

  const getNodeColor = (node: GraphNode) => {
    const colors: Record<string, string> = {
      LORE: '#8b5cf6',
      NPC: '#ec4899',
      LOCATION: '#10b981',
      FACTION: '#f59e0b',
      QUEST: '#3b82f6',
      ITEM: '#14b8a6',
      NOTE: '#6366f1'
    };
    return colors[node.type] || '#6b7280';
  };

  return (
    <Card ref={containerRef} className="w-full h-full p-4 bg-background">
      {nodes.length > 0 ? (
        <ForceGraph2D
          graphData={{ nodes, links }}
          width={dimensions.width - 32}
          height={dimensions.height - 32}
          nodeLabel="name"
          nodeColor={getNodeColor}
          nodeRelSize={6}
          linkLabel="label"
          linkDirectionalArrowLength={3}
          linkDirectionalArrowRelPos={1}
          linkColor={() => '#94a3b8'}
          backgroundColor="transparent"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No graph data available</p>
        </div>
      )}
    </Card>
  );
}
