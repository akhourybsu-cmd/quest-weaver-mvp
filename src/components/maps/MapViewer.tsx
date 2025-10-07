import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Polygon, Image as FabricImage } from "fabric";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ZoomIn, ZoomOut, Maximize, Grid3x3, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Token {
  id: string;
  name: string;
  x: number;
  y: number;
  size: number;
  color: string;
  isVisible: boolean;
  characterId?: string;
}

interface MapViewerProps {
  mapId: string;
  imageUrl: string;
  width: number;
  height: number;
  gridEnabled: boolean;
  gridSize: number;
  isDM: boolean;
  encounterId?: string;
}

const MapViewer = ({
  mapId,
  imageUrl,
  width,
  height,
  gridEnabled,
  gridSize,
  isDM,
  encounterId,
}: MapViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(gridEnabled);
  const { toast } = useToast();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: Math.min(width, 1200),
      height: Math.min(height, 800),
      backgroundColor: "#1a1a1a",
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [width, height]);

  // Load map image
  useEffect(() => {
    if (!fabricCanvas || !imageUrl) return;

    FabricImage.fromURL(imageUrl, {
      crossOrigin: "anonymous",
    }).then((img) => {
      img.set({
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(img);
      fabricCanvas.sendObjectToBack(img);
      fabricCanvas.renderAll();
    });
  }, [fabricCanvas, imageUrl]);

  // Draw grid
  useEffect(() => {
    if (!fabricCanvas || !showGrid) return;

    const gridLines = [];
    const canvasWidth = fabricCanvas.getWidth();
    const canvasHeight = fabricCanvas.getHeight();

    // Vertical lines
    for (let i = 0; i < canvasWidth; i += gridSize) {
      const line = new Rect({
        left: i,
        top: 0,
        width: 1,
        height: canvasHeight,
        fill: "#ffffff",
        opacity: 0.2,
        selectable: false,
        evented: false,
      });
      gridLines.push(line);
      fabricCanvas.add(line);
    }

    // Horizontal lines
    for (let i = 0; i < canvasHeight; i += gridSize) {
      const line = new Rect({
        left: 0,
        top: i,
        width: canvasWidth,
        height: 1,
        fill: "#ffffff",
        opacity: 0.2,
        selectable: false,
        evented: false,
      });
      gridLines.push(line);
      fabricCanvas.add(line);
    }

    fabricCanvas.renderAll();

    return () => {
      gridLines.forEach((line) => fabricCanvas.remove(line));
    };
  }, [fabricCanvas, showGrid, gridSize]);

  // Load tokens from database
  useEffect(() => {
    const loadTokens = async () => {
      const { data, error } = await supabase
        .from("tokens")
        .select("*")
        .eq("map_id", mapId);

      if (error) {
        console.error("Error loading tokens:", error);
        return;
      }

      setTokens(
        data.map((t) => ({
          id: t.id,
          name: t.name,
          x: t.x,
          y: t.y,
          size: t.size,
          color: t.color,
          isVisible: t.is_visible,
          characterId: t.character_id,
        }))
      );
    };

    loadTokens();

    // Subscribe to token changes
    const channel = supabase
      .channel(`tokens:${mapId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tokens",
          filter: `map_id=eq.${mapId}`,
        },
        () => {
          loadTokens();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapId]);

  // Render tokens on canvas
  useEffect(() => {
    if (!fabricCanvas) return;

    // Remove existing token objects
    const existingTokens = fabricCanvas.getObjects().filter((obj: any) => obj.tokenId);
    existingTokens.forEach((obj) => fabricCanvas.remove(obj));

    // Add tokens
    tokens.forEach((token) => {
      if (!isDM && !token.isVisible) return;

      const radius = (gridSize * token.size) / 2;
      const circle = new Circle({
        left: token.x - radius,
        top: token.y - radius,
        radius,
        fill: token.color,
        stroke: "#ffffff",
        strokeWidth: 2,
        opacity: token.isVisible ? 1 : 0.5,
      });

      (circle as any).tokenId = token.id;
      fabricCanvas.add(circle);
    });

    fabricCanvas.renderAll();
  }, [fabricCanvas, tokens, isDM, gridSize]);

  const handleZoom = (direction: "in" | "out" | "reset") => {
    if (!fabricCanvas) return;

    let newZoom = zoom;
    if (direction === "in") newZoom = Math.min(zoom + 0.2, 3);
    else if (direction === "out") newZoom = Math.max(zoom - 0.2, 0.5);
    else newZoom = 1;

    fabricCanvas.setZoom(newZoom);
    setZoom(newZoom);
    fabricCanvas.renderAll();
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => handleZoom("in")}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleZoom("out")}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleZoom("reset")}>
            <Maximize className="w-4 h-4" />
          </Button>
          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            Grid
          </Button>
          <div className="text-sm text-muted-foreground ml-auto">
            Zoom: {Math.round(zoom * 100)}%
          </div>
        </div>
      </Card>

      {/* Canvas */}
      <Card className="p-4 bg-muted/50">
        <div className="overflow-auto">
          <canvas ref={canvasRef} />
        </div>
      </Card>
    </div>
  );
};

export default MapViewer;
