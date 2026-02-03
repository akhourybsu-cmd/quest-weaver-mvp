import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Image as FabricImage, Text } from "fabric";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZoomIn, ZoomOut, Maximize, Grid3x3, Map, Ruler } from "lucide-react";
import { useMapOverlays } from "@/hooks/useMapOverlays";
import { MarkerRenderer } from "@/components/maps/MarkerRenderer";

interface PlayerMapViewerProps {
  mapId: string;
  characterId: string;
}

export function PlayerMapViewer({ mapId, characterId }: PlayerMapViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [mapData, setMapData] = useState<any>(null);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 450 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [measureMode, setMeasureMode] = useState(false);

  // Use centralized overlay hook (isDM: false for player view)
  const {
    markers,
    aoeTemplates,
    fogRegions,
    tokens,
  } = useMapOverlays({ mapId, isDM: false });

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

  // Responsive container sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: containerWidth } = entry.contentRect;
        const canvasWidth = Math.max(400, containerWidth - 32);
        const canvasHeight = Math.min(500, canvasWidth * 0.75);
        setContainerSize({ width: canvasWidth, height: canvasHeight });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !mapData) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: containerSize.width,
      height: containerSize.height,
      backgroundColor: "#1a1a1a",
      selection: false,
    });

    // Enable zoom with mouse wheel
    canvas.on("mouse:wheel", (opt) => {
      const delta = opt.e.deltaY;
      let newZoom = canvas.getZoom() * (0.999 ** delta);
      newZoom = Math.min(Math.max(0.25, newZoom), 4);
      
      const pointer = canvas.getScenePoint(opt.e);
      canvas.zoomToPoint(pointer, newZoom);
      setZoom(newZoom);
      
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [mapData, containerSize]);

  // Pan handling
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (opt: any) => {
      if (opt.e.button === 1 || opt.e.shiftKey) {
        setIsPanning(true);
        setLastPanPosition({ x: opt.e.clientX, y: opt.e.clientY });
        fabricCanvas.setCursor("grabbing");
      }
    };

    const handleMouseMove = (opt: any) => {
      if (isPanning) {
        const deltaX = opt.e.clientX - lastPanPosition.x;
        const deltaY = opt.e.clientY - lastPanPosition.y;
        
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          vpt[4] += deltaX;
          vpt[5] += deltaY;
          fabricCanvas.setViewportTransform(vpt);
        }
        
        setLastPanPosition({ x: opt.e.clientX, y: opt.e.clientY });
      }
    };

    const handleMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
        fabricCanvas.setCursor("default");
      }
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
    };
  }, [fabricCanvas, isPanning, lastPanPosition]);

  // Load map image
  useEffect(() => {
    if (!fabricCanvas || !mapData?.image_url) return;

    FabricImage.fromURL(mapData.image_url, {
      crossOrigin: "anonymous",
    }).then((img) => {
      const scaleX = containerSize.width / (img.width || 1);
      const scaleY = containerSize.height / (img.height || 1);
      const scale = Math.min(scaleX, scaleY);

      img.set({
        left: 0,
        top: 0,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
      });

      const existingBg = fabricCanvas.getObjects().find((obj: any) => obj.isBackgroundImage);
      if (existingBg) fabricCanvas.remove(existingBg);

      (img as any).isBackgroundImage = true;
      fabricCanvas.add(img);
      fabricCanvas.sendObjectToBack(img);
      fabricCanvas.renderAll();
    });
  }, [fabricCanvas, mapData, containerSize]);

  // Draw grid
  useEffect(() => {
    if (!fabricCanvas || !mapData) return;

    const existingGrid = fabricCanvas.getObjects().filter((obj: any) => obj.isGridLine);
    existingGrid.forEach((obj) => fabricCanvas.remove(obj));

    if (!showGrid) {
      fabricCanvas.renderAll();
      return;
    }

    const gridSize = mapData.grid_size || 50;

    for (let i = 0; i <= containerSize.width; i += gridSize) {
      const line = new Rect({
        left: i,
        top: 0,
        width: 1,
        height: containerSize.height,
        fill: "#ffffff",
        opacity: 0.15,
        selectable: false,
        evented: false,
      });
      (line as any).isGridLine = true;
      fabricCanvas.add(line);
    }

    for (let i = 0; i <= containerSize.height; i += gridSize) {
      const line = new Rect({
        left: 0,
        top: i,
        width: containerSize.width,
        height: 1,
        fill: "#ffffff",
        opacity: 0.15,
        selectable: false,
        evented: false,
      });
      (line as any).isGridLine = true;
      fabricCanvas.add(line);
    }

    fabricCanvas.renderAll();
  }, [fabricCanvas, showGrid, mapData, containerSize]);

  // Render tokens
  useEffect(() => {
    if (!fabricCanvas || !mapData) return;

    const gridSize = mapData.grid_size || 50;
    const existingTokens = fabricCanvas.getObjects().filter((obj: any) => obj.tokenId);
    existingTokens.forEach((obj) => fabricCanvas.remove(obj));

    tokens.forEach((token) => {
      const radius = (gridSize * token.size) / 2;
      const isMyToken = token.character_id === characterId;
      
      const circle = new Circle({
        left: token.x - radius,
        top: token.y - radius,
        radius,
        fill: token.color,
        stroke: isMyToken ? "#FFD700" : "#ffffff",
        strokeWidth: isMyToken ? 4 : 2,
        opacity: 1,
        selectable: false,
        evented: false,
      });

      (circle as any).tokenId = token.id;
      fabricCanvas.add(circle);

      // Token name label
      if (token.name) {
        const label = new Text(token.name, {
          left: token.x,
          top: token.y - radius - 15,
          fontSize: 11,
          fill: "#fff",
          fontWeight: "bold",
          textAlign: "center",
          originX: "center",
          selectable: false,
          evented: false,
        });
        (label as any).tokenId = token.id + "-label";
        fabricCanvas.add(label);
      }
    });

    fabricCanvas.renderAll();
  }, [fabricCanvas, tokens, characterId, mapData]);

  const handleZoom = useCallback((direction: "in" | "out" | "reset") => {
    if (!fabricCanvas) return;

    let newZoom = zoom;
    if (direction === "in") newZoom = Math.min(zoom * 1.2, 4);
    else if (direction === "out") newZoom = Math.max(zoom / 1.2, 0.25);
    else {
      newZoom = 1;
      fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    }

    fabricCanvas.setZoom(newZoom);
    setZoom(newZoom);
  }, [fabricCanvas, zoom]);

  if (!mapData) {
    return null;
  }

  return (
    <Card ref={containerRef}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Map className="w-5 h-5" />
          Battle Map
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
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
          <Button
            variant={measureMode ? "default" : "outline"}
            size="sm"
            onClick={() => setMeasureMode(!measureMode)}
          >
            <Ruler className="w-4 h-4 mr-2" />
            Measure
          </Button>
          <div className="text-sm text-muted-foreground ml-auto">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Canvas */}
        <div 
          className="bg-muted/50 rounded-lg overflow-hidden"
          style={{ width: containerSize.width, height: containerSize.height }}
        >
          <canvas ref={canvasRef} />
        </div>

        {/* Overlay renderer */}
        <MarkerRenderer
          canvas={fabricCanvas}
          markers={markers}
          aoeTemplates={aoeTemplates}
          fogRegions={fogRegions}
          isDM={false}
          gridSize={mapData?.grid_size || 50}
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Your token is highlighted in gold</span>
          <span>Hold Shift + drag or middle-click to pan</span>
        </div>
      </CardContent>
    </Card>
  );
}
