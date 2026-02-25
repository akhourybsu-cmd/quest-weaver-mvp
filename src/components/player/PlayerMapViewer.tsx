import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Image as FabricImage, Text, Line } from "fabric";
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
  const [measureMode, setMeasureMode] = useState(false);

  // Refs for performance (no re-renders on pan/drag)
  const isPanningRef = useRef(false);
  const lastPanRef = useRef({ x: 0, y: 0 });
  const imageRef = useRef<FabricImage | null>(null);
  const prevTokensRef = useRef<string>("");
  const measureStartRef = useRef<{ x: number; y: number } | null>(null);

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

  // Responsive container sizing (debounced)
  useEffect(() => {
    if (!containerRef.current) return;

    let debounceTimer: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver((entries) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        for (const entry of entries) {
          const { width: containerWidth } = entry.contentRect;
          const canvasWidth = Math.max(400, containerWidth - 32);
          const canvasHeight = Math.min(500, canvasWidth * 0.75);
          setContainerSize({ width: canvasWidth, height: canvasHeight });
        }
      }, 100);
    });

    resizeObserver.observe(containerRef.current);
    return () => {
      clearTimeout(debounceTimer);
      resizeObserver.disconnect();
    };
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

    // Zoom with mouse wheel
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

    // Grid overlay via afterRender (zero object cost)
    canvas.on("after:render", () => {
      if (!showGrid || !mapData) return;
      const ctx = canvas.getTopContext();
      if (!ctx) return;
      const gridSize = mapData.grid_size || 50;
      const vpt = canvas.viewportTransform;
      if (!vpt) return;

      ctx.save();
      ctx.setTransform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1 / vpt[0];

      const w = containerSize.width / vpt[0] + Math.abs(vpt[4] / vpt[0]);
      const h = containerSize.height / vpt[3] + Math.abs(vpt[5] / vpt[3]);

      for (let x = 0; x <= w + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h + gridSize);
        ctx.stroke();
      }
      for (let y = 0; y <= h + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w + gridSize, y);
        ctx.stroke();
      }
      ctx.restore();
    });

    setFabricCanvas(canvas);
    imageRef.current = null;

    return () => {
      canvas.dispose();
    };
  }, [mapData]);

  // Resize canvas without remounting
  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.setDimensions({ width: containerSize.width, height: containerSize.height });

    // Rescale cached image
    if (imageRef.current && mapData?.image_url) {
      const img = imageRef.current;
      const scaleX = containerSize.width / (img.width || 1);
      const scaleY = containerSize.height / (img.height || 1);
      const scale = Math.min(scaleX, scaleY);
      img.set({ scaleX: scale, scaleY: scale });
    }

    fabricCanvas.renderAll();
  }, [fabricCanvas, containerSize]);

  // Pan handling with refs (no re-renders)
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (opt: any) => {
      if (opt.e.button === 1 || opt.e.shiftKey) {
        isPanningRef.current = true;
        lastPanRef.current = { x: opt.e.clientX, y: opt.e.clientY };
        fabricCanvas.setCursor("grabbing");
      }
    };

    const handleMouseMove = (opt: any) => {
      if (isPanningRef.current) {
        const deltaX = opt.e.clientX - lastPanRef.current.x;
        const deltaY = opt.e.clientY - lastPanRef.current.y;

        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          vpt[4] += deltaX;
          vpt[5] += deltaY;
          fabricCanvas.setViewportTransform(vpt);
        }

        lastPanRef.current = { x: opt.e.clientX, y: opt.e.clientY };
      }
    };

    const handleMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
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
  }, [fabricCanvas]);

  // Measurement tool click handler
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMeasureClick = (opt: any) => {
      if (!measureMode) return;
      // Don't measure while panning
      if (opt.e.shiftKey || opt.e.button === 1) return;

      const pointer = fabricCanvas.getScenePoint(opt.e);
      const gridSize = mapData?.grid_size || 50;
      const feetPerSquare = mapData?.scale_feet_per_square || 5;

      // Remove old measurement objects
      const old = fabricCanvas.getObjects().filter((o: any) => o.isMeasurement);
      old.forEach((o) => fabricCanvas.remove(o));

      if (!measureStartRef.current) {
        // First click: set start
        measureStartRef.current = { x: pointer.x, y: pointer.y };

        const dot = new Circle({
          left: pointer.x - 4,
          top: pointer.y - 4,
          radius: 4,
          fill: "#FFD700",
          selectable: false,
          evented: false,
        });
        (dot as any).isMeasurement = true;
        fabricCanvas.add(dot);
        fabricCanvas.renderAll();
      } else {
        // Second click: draw line + label
        const start = measureStartRef.current;
        const end = { x: pointer.x, y: pointer.y };

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const pixelDist = Math.sqrt(dx * dx + dy * dy);
        const feet = Math.round((pixelDist / gridSize) * feetPerSquare);

        const line = new Line([start.x, start.y, end.x, end.y], {
          stroke: "#FFD700",
          strokeWidth: 2,
          strokeDashArray: [6, 4],
          selectable: false,
          evented: false,
        });
        (line as any).isMeasurement = true;

        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const label = new Text(`${feet} ft`, {
          left: midX,
          top: midY - 14,
          fontSize: 13,
          fill: "#FFD700",
          fontWeight: "bold",
          originX: "center",
          selectable: false,
          evented: false,
        });
        (label as any).isMeasurement = true;

        fabricCanvas.add(line, label);
        fabricCanvas.renderAll();
        measureStartRef.current = null;
      }
    };

    fabricCanvas.on("mouse:down", handleMeasureClick);
    return () => {
      fabricCanvas.off("mouse:down", handleMeasureClick);
    };
  }, [fabricCanvas, measureMode, mapData]);

  // Load map image (cached)
  useEffect(() => {
    if (!fabricCanvas || !mapData?.image_url) return;
    if (imageRef.current) return; // already loaded

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

      (img as any).isBackgroundImage = true;
      imageRef.current = img;
      fabricCanvas.add(img);
      fabricCanvas.sendObjectToBack(img);
      fabricCanvas.renderAll();
    });
  }, [fabricCanvas, mapData]);

  // Render tokens (with diffing)
  useEffect(() => {
    if (!fabricCanvas || !mapData) return;

    const tokenKey = JSON.stringify(tokens.map((t) => ({ id: t.id, x: t.x, y: t.y, color: t.color, size: t.size, name: t.name })));
    if (tokenKey === prevTokensRef.current) return;
    prevTokensRef.current = tokenKey;

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

  // Force grid redraw when toggled
  useEffect(() => {
    if (fabricCanvas) fabricCanvas.renderAll();
  }, [showGrid, fabricCanvas]);

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

  const toggleMeasure = useCallback(() => {
    setMeasureMode((prev) => {
      const next = !prev;
      if (!next && fabricCanvas) {
        // Clear measurement objects when turning off
        const old = fabricCanvas.getObjects().filter((o: any) => o.isMeasurement);
        old.forEach((o) => fabricCanvas.remove(o));
        fabricCanvas.renderAll();
        measureStartRef.current = null;
      }
      return next;
    });
  }, [fabricCanvas]);

  if (!mapData) return null;

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
            onClick={toggleMeasure}
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
          <span>{measureMode ? "Click two points to measure distance" : "Your token is highlighted in gold"}</span>
          <span>Hold Shift + drag or middle-click to pan</span>
        </div>
      </CardContent>
    </Card>
  );
}
