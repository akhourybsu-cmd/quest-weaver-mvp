import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Image as FabricImage, Text } from "fabric";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMapOverlays, type Token, type MapMarker, type AoETemplate } from "@/hooks/useMapOverlays";
import { DrawingToolbar, type DrawingTool } from "./DrawingToolbar";
import { MarkerRenderer } from "./MarkerRenderer";
import { TokenContextMenu } from "./TokenContextMenu";
import { NotePinDialog } from "./NotePinDialog";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(gridEnabled);
  const [activeTool, setActiveTool] = useState<DrawingTool>("select");
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [notePinDialog, setNotePinDialog] = useState<{
    open: boolean;
    position?: { x: number; y: number };
    pin?: MapMarker;
  }>({ open: false });

  const { toast } = useToast();

  // Use the centralized overlay hook
  const {
    markers,
    aoeTemplates,
    fogRegions,
    tokens,
    updateToken,
    deleteToken,
    addMarker,
    deleteAoE,
  } = useMapOverlays({ mapId, isDM, encounterId });

  // Responsive container sizing with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: containerWidth, height: containerHeight } = entry.contentRect;
        // Calculate optimal canvas size maintaining aspect ratio
        const aspectRatio = width / height;
        let canvasWidth = containerWidth - 32; // padding
        let canvasHeight = canvasWidth / aspectRatio;

        // Constrain height
        const maxHeight = Math.min(containerHeight - 32, window.innerHeight - 250);
        if (canvasHeight > maxHeight) {
          canvasHeight = maxHeight;
          canvasWidth = canvasHeight * aspectRatio;
        }

        setContainerSize({
          width: Math.max(400, canvasWidth),
          height: Math.max(300, canvasHeight),
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [width, height]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: containerSize.width,
      height: containerSize.height,
      backgroundColor: "#1a1a1a",
      selection: isDM,
    });

    // Enable pan with mouse wheel + ctrl or middle mouse button
    canvas.on("mouse:wheel", (opt) => {
      const delta = opt.e.deltaY;
      let newZoom = canvas.getZoom() * (0.999 ** delta);
      
      // Clamp zoom
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
  }, [containerSize.width, containerSize.height, isDM]);

  // Handle pan tool and canvas interaction
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (opt: any) => {
      if (activeTool === "pan" || opt.e.button === 1) {
        setIsPanning(true);
        setLastPanPosition({ x: opt.e.clientX, y: opt.e.clientY });
        fabricCanvas.selection = false;
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
        fabricCanvas.selection = isDM && activeTool === "select";
        fabricCanvas.setCursor(activeTool === "pan" ? "grab" : "default");
      }
    };

    const handleCanvasClick = (opt: any) => {
      // Handle pin tool clicks
      if (activeTool === "pin" && isDM) {
        const pointer = fabricCanvas.getScenePoint(opt.e);
        setNotePinDialog({
          open: true,
          position: { x: pointer.x, y: pointer.y },
        });
      }
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);
    fabricCanvas.on("mouse:down", handleCanvasClick);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
      fabricCanvas.off("mouse:down", handleCanvasClick);
    };
  }, [fabricCanvas, activeTool, isPanning, lastPanPosition, isDM]);

  // Update cursor based on tool
  useEffect(() => {
    if (!fabricCanvas) return;
    
    switch (activeTool) {
      case "pan":
        fabricCanvas.setCursor("grab");
        fabricCanvas.selection = false;
        break;
      case "select":
        fabricCanvas.setCursor("default");
        fabricCanvas.selection = isDM;
        break;
      case "pin":
        fabricCanvas.setCursor("crosshair");
        fabricCanvas.selection = false;
        break;
      default:
        fabricCanvas.setCursor("crosshair");
        fabricCanvas.selection = false;
    }
  }, [fabricCanvas, activeTool, isDM]);

  // Load map image
  useEffect(() => {
    if (!fabricCanvas || !imageUrl) return;

    FabricImage.fromURL(imageUrl, {
      crossOrigin: "anonymous",
    }).then((img) => {
      // Scale image to fit canvas while maintaining aspect ratio
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
      
      // Remove existing background image
      const existingBg = fabricCanvas.getObjects().find((obj: any) => obj.isBackgroundImage);
      if (existingBg) {
        fabricCanvas.remove(existingBg);
      }
      
      (img as any).isBackgroundImage = true;
      fabricCanvas.add(img);
      fabricCanvas.sendObjectToBack(img);
      fabricCanvas.renderAll();
    });
  }, [fabricCanvas, imageUrl, containerSize]);

  // Draw grid
  useEffect(() => {
    if (!fabricCanvas) return;

    // Remove existing grid lines
    const existingGrid = fabricCanvas.getObjects().filter((obj: any) => obj.isGridLine);
    existingGrid.forEach((obj) => fabricCanvas.remove(obj));

    if (!showGrid) {
      fabricCanvas.renderAll();
      return;
    }

    const gridLines: any[] = [];
    const canvasWidth = containerSize.width;
    const canvasHeight = containerSize.height;

    // Vertical lines
    for (let i = 0; i <= canvasWidth; i += gridSize) {
      const line = new Rect({
        left: i,
        top: 0,
        width: 1,
        height: canvasHeight,
        fill: "#ffffff",
        opacity: 0.15,
        selectable: false,
        evented: false,
      });
      (line as any).isGridLine = true;
      gridLines.push(line);
      fabricCanvas.add(line);
    }

    // Horizontal lines
    for (let i = 0; i <= canvasHeight; i += gridSize) {
      const line = new Rect({
        left: 0,
        top: i,
        width: canvasWidth,
        height: 1,
        fill: "#ffffff",
        opacity: 0.15,
        selectable: false,
        evented: false,
      });
      (line as any).isGridLine = true;
      gridLines.push(line);
      fabricCanvas.add(line);
    }

    fabricCanvas.renderAll();
  }, [fabricCanvas, showGrid, gridSize, containerSize]);

  // Render tokens on canvas
  useEffect(() => {
    if (!fabricCanvas) return;

    // Remove existing token objects
    const existingTokens = fabricCanvas.getObjects().filter((obj: any) => obj.tokenId);
    existingTokens.forEach((obj) => fabricCanvas.remove(obj));

    // Add tokens
    tokens.forEach((token) => {
      if (!isDM && !token.is_visible) return;

      const radius = (gridSize * token.size) / 2;
      const circle = new Circle({
        left: token.x - radius,
        top: token.y - radius,
        radius,
        fill: token.color,
        stroke: "#ffffff",
        strokeWidth: 2,
        opacity: token.is_visible ? 1 : 0.5,
        selectable: isDM,
        evented: isDM,
      });

      (circle as any).tokenId = token.id;
      (circle as any).tokenData = token;
      
      // Enable dragging for DM
      if (isDM) {
        circle.on("modified", async () => {
          const newX = (circle.left || 0) + radius;
          const newY = (circle.top || 0) + radius;
          await updateToken(token.id, { x: newX, y: newY });
        });
      }

      fabricCanvas.add(circle);

      // Add token name label
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
  }, [fabricCanvas, tokens, isDM, gridSize, updateToken]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (!fabricCanvas) return;
    const newZoom = Math.min(zoom * 1.2, 4);
    fabricCanvas.setZoom(newZoom);
    setZoom(newZoom);
  }, [fabricCanvas, zoom]);

  const handleZoomOut = useCallback(() => {
    if (!fabricCanvas) return;
    const newZoom = Math.max(zoom / 1.2, 0.25);
    fabricCanvas.setZoom(newZoom);
    setZoom(newZoom);
  }, [fabricCanvas, zoom]);

  const handleFitToView = useCallback(() => {
    if (!fabricCanvas) return;
    fabricCanvas.setZoom(1);
    fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoom(1);
  }, [fabricCanvas]);

  // Token context menu handlers
  const handleTokenToggleVisibility = async (token: Token) => {
    await updateToken(token.id, { is_visible: !token.is_visible });
    toast({
      title: token.is_visible ? "Token hidden" : "Token visible",
      description: `${token.name} is now ${token.is_visible ? "hidden from" : "visible to"} players.`,
    });
  };

  const handleTokenDelete = async (token: Token) => {
    await deleteToken(token.id);
    toast({ title: "Token deleted" });
  };

  const handleTokenEdit = (token: Token) => {
    // TODO: Open token edit dialog
    toast({ title: "Edit token", description: "Token editing coming soon!" });
  };

  const handleTokenDuplicate = async (token: Token) => {
    // Create a new token at a slightly offset position
    const { error } = await supabase.from("tokens").insert({
      map_id: mapId,
      name: `${token.name} (copy)`,
      x: token.x + gridSize,
      y: token.y + gridSize,
      size: token.size,
      color: token.color,
      is_visible: token.is_visible,
    });
    if (!error) {
      toast({ title: "Token duplicated" });
    }
  };

  // Note pin save handler
  const handleSaveNotePin = async (data: {
    label: string;
    metadata: { description: string };
    dm_only: boolean;
    x: number;
    y: number;
  }) => {
    await addMarker({
      map_id: mapId,
      marker_type: "note",
      shape: "circle",
      x: data.x,
      y: data.y,
      color: "#ef4444",
      opacity: 0.9,
      label: data.label,
      dm_only: data.dm_only,
      metadata: data.metadata,
      rotation: 0,
    });
    toast({ title: "Note pin added" });
  };

  // Marker click handler
  const handleMarkerClick = (marker: MapMarker) => {
    if (marker.marker_type === "note") {
      setNotePinDialog({ open: true, pin: marker });
    }
  };

  // AoE click handler (delete on click for DM)
  const handleAoEClick = async (template: AoETemplate) => {
    if (isDM) {
      await deleteAoE(template.id);
      toast({ title: "AoE removed" });
    }
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <Card className="p-4 bg-muted/50 relative">
        {/* DM Toolbar */}
        {isDM && (
          <div className="absolute top-4 left-4 z-20">
            <DrawingToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitToView={handleFitToView}
              showGrid={showGrid}
              onToggleGrid={() => setShowGrid(!showGrid)}
              zoom={zoom}
            />
          </div>
        )}

        {/* Canvas Container */}
        <div 
          className="overflow-hidden rounded-lg"
          style={{ 
            width: containerSize.width,
            height: containerSize.height,
            maxHeight: "calc(100vh - 200px)",
          }}
        >
          <canvas ref={canvasRef} />
        </div>

        {/* Render overlays */}
        <MarkerRenderer
          canvas={fabricCanvas}
          markers={markers}
          aoeTemplates={aoeTemplates}
          fogRegions={fogRegions}
          isDM={isDM}
          gridSize={gridSize}
          onMarkerClick={handleMarkerClick}
          onAoEClick={handleAoEClick}
        />

        {/* Zoom indicator for players */}
        {!isDM && (
          <div className="absolute bottom-4 right-4 bg-card/90 px-3 py-1 rounded-full text-sm text-muted-foreground">
            {Math.round(zoom * 100)}% • Scroll to zoom
          </div>
        )}
      </Card>

      {/* Note Pin Dialog */}
      <NotePinDialog
        open={notePinDialog.open}
        onOpenChange={(open) => setNotePinDialog({ ...notePinDialog, open })}
        position={notePinDialog.position}
        pin={notePinDialog.pin}
        onSave={handleSaveNotePin}
      />
    </div>
  );
};

export default MapViewer;
