import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Image as FabricImage } from "fabric";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZoomIn, ZoomOut, Maximize, Grid3x3, Map } from "lucide-react";

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

interface PlayerMapViewerProps {
  mapId: string;
  characterId: string;
}

export function PlayerMapViewer({ mapId, characterId }: PlayerMapViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [mapData, setMapData] = useState<any>(null);

  useEffect(() => {
    fetchMapData();
  }, [mapId]);

  const fetchMapData = async () => {
    const { data } = await supabase
      .from("maps")
      .select("*")
      .eq("id", mapId)
      .single();

    if (data) {
      setMapData(data);
      setShowGrid(data.grid_enabled || true);
    }
  };

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !mapData) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: Math.min(mapData.width, 800),
      height: Math.min(mapData.height, 600),
      backgroundColor: "#1a1a1a",
      selection: false, // Disable selection for player view
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [mapData]);

  // Load map image
  useEffect(() => {
    if (!fabricCanvas || !mapData?.image_url) return;

    FabricImage.fromURL(mapData.image_url, {
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
  }, [fabricCanvas, mapData]);

  // Draw grid
  useEffect(() => {
    if (!fabricCanvas || !showGrid || !mapData) return;

    const gridSize = mapData.grid_size || 50;
    const gridLines = [];
    const canvasWidth = fabricCanvas.getWidth();
    const canvasHeight = fabricCanvas.getHeight();

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
  }, [fabricCanvas, showGrid, mapData]);

  // Load tokens
  useEffect(() => {
    if (!mapId) return;

    const loadTokens = async () => {
      const { data } = await supabase
        .from("tokens")
        .select("*")
        .eq("map_id", mapId);

      if (data) {
        setTokens(
          data
            .filter((t) => t.is_visible) // Only show visible tokens to players
            .map((t) => ({
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
      }
    };

    loadTokens();

    const channel = supabase
      .channel(`player-tokens:${mapId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tokens",
          filter: `map_id=eq.${mapId}`,
        },
        () => loadTokens()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapId]);

  // Render tokens
  useEffect(() => {
    if (!fabricCanvas || !mapData) return;

    const gridSize = mapData.grid_size || 50;
    const existingTokens = fabricCanvas.getObjects().filter((obj: any) => obj.tokenId);
    existingTokens.forEach((obj) => fabricCanvas.remove(obj));

    tokens.forEach((token) => {
      const radius = (gridSize * token.size) / 2;
      const circle = new Circle({
        left: token.x - radius,
        top: token.y - radius,
        radius,
        fill: token.color,
        stroke: token.characterId === characterId ? "#FFD700" : "#ffffff",
        strokeWidth: token.characterId === characterId ? 4 : 2,
        opacity: 1,
        selectable: false,
        evented: false,
      });

      (circle as any).tokenId = token.id;
      fabricCanvas.add(circle);
    });

    fabricCanvas.renderAll();
  }, [fabricCanvas, tokens, characterId, mapData]);

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

  if (!mapData) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Map className="w-5 h-5" />
          Battle Map
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="bg-muted/50 rounded-lg p-2 overflow-auto">
          <canvas ref={canvasRef} />
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Your token is highlighted in gold
        </p>
      </CardContent>
    </Card>
  );
}
