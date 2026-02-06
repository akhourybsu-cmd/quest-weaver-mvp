import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import ForceGraph2D from "react-force-graph-2d";
import { Card } from "@/components/ui/card";

interface NoteGraphProps {
  campaignId: string;
  onNoteSelect: (noteId: string) => void;
}

interface GraphNode {
  id: string;
  name: string;
  type: string;
  folder: string | null;
  val: number;
}

interface GraphLink {
  source: string;
  target: string;
  label: string;
}

const FOLDER_COLORS: Record<string, string> = {
  "Session Prep": "#f59e0b",
  "World Notes": "#10b981",
  "Plot Threads": "#8b5cf6",
  "Random Ideas": "#ec4899",
};

const TYPE_COLORS: Record<string, string> = {
  NOTE: "#6366f1",
  NPC: "#ec4899",
  LOCATION: "#10b981",
  QUEST: "#3b82f6",
  CHARACTER: "#f59e0b",
};

const TYPE_LABELS: Record<string, string> = {
  NOTE: "Note",
  NPC: "NPC",
  LOCATION: "Location",
  QUEST: "Quest",
  CHARACTER: "Character",
};

export default function NoteGraph({ campaignId, onNoteSelect }: NoteGraphProps) {
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => { loadGraphData(); }, [campaignId]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.offsetWidth, height: Math.max(400, containerRef.current.offsetHeight) });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const loadGraphData = async () => {
    try {
      const { data: notes, error: notesError } = await supabase
        .from("session_notes")
        .select("id, title, folder")
        .eq("campaign_id", campaignId)
        .is("deleted_at", null);
      if (notesError) throw notesError;

      const noteIds = notes?.map(n => n.id) || [];
      if (noteIds.length === 0) { setGraphData({ nodes: [], links: [] }); return; }

      const { data: noteLinks, error: linksError } = await supabase
        .from("note_links")
        .select("*")
        .in("note_id", noteIds);
      if (linksError) throw linksError;

      const nodeMap = new Map<string, GraphNode>();
      notes?.forEach(note => {
        nodeMap.set(note.id, { id: note.id, name: note.title, type: "NOTE", folder: note.folder, val: 10 });
      });

      const graphLinks: GraphLink[] = [];
      noteLinks?.forEach(link => {
        if (link.link_id) {
          if (!nodeMap.has(link.link_id)) {
            nodeMap.set(link.link_id, { id: link.link_id, name: link.label, type: link.link_type, folder: null, val: 7 });
          }
          graphLinks.push({ source: link.note_id, target: link.link_id, label: link.label });
        }
      });

      setGraphData({ nodes: Array.from(nodeMap.values()), links: graphLinks });
    } catch (error) {
      console.error("Error loading note graph:", error);
    }
  };

  const getNodeColor = useCallback((node: GraphNode) => {
    if (node.type === "NOTE" && node.folder) return FOLDER_COLORS[node.folder] || "#6366f1";
    return TYPE_COLORS[node.type] || "#6b7280";
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (node.type === "NOTE") onNoteSelect(node.id);
  }, [onNoteSelect]);

  // Compute which types are actually present in the graph
  const presentTypes = new Set(graphData.nodes.map(n => n.type));

  return (
    <Card ref={containerRef} className="relative w-full min-h-[400px] h-[500px] p-4 bg-background">
      {graphData.nodes.length > 0 ? (
        <>
          <ForceGraph2D
            graphData={graphData}
            width={dimensions.width - 32}
            height={dimensions.height - 32}
            nodeLabel="name"
            nodeColor={(node: any) => getNodeColor(node as GraphNode)}
            nodeRelSize={6}
            linkLabel="label"
            linkDirectionalArrowLength={3}
            linkDirectionalArrowRelPos={1}
            linkColor={() => "hsl(var(--muted-foreground) / 0.3)"}
            backgroundColor="transparent"
            onNodeClick={(node: any) => handleNodeClick(node as GraphNode)}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const n = node as GraphNode;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              const color = getNodeColor(n);
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, n.val / 2, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillStyle = color;
              ctx.fillText(n.name, node.x!, node.y! + n.val / 2 + 2);
            }}
          />

          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1 bg-background/80 backdrop-blur-sm rounded-md px-3 py-2 border text-xs">
            {Object.entries(TYPE_COLORS)
              .filter(([type]) => presentTypes.has(type))
              .map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-muted-foreground">{TYPE_LABELS[type] || type}</span>
                </div>
              ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <p className="text-muted-foreground text-sm font-medium">No connections yet</p>
          <p className="text-muted-foreground text-xs text-center max-w-xs">
            Link notes with <code className="px-1 py-0.5 rounded bg-muted text-xs">[[Note Title]]</code> or
            use <code className="px-1 py-0.5 rounded bg-muted text-xs">@mention</code> to connect campaign entities.
            Connected notes will appear here as a knowledge graph.
          </p>
        </div>
      )}
    </Card>
  );
}
