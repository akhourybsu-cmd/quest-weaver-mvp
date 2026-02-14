import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Image as FabricImage, Text } from "fabric";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMapOverlays, type Token, type MapMarker, type AoETemplate } from "@/hooks/useMapOverlays";
import { DrawingToolbar, type DrawingTool } from "./DrawingToolbar";
import { MarkerRenderer } from "./MarkerRenderer";
import { NotePinDialog } from "./NotePinDialog";
import { TerrainMarker } from "./TerrainMarker";
import { GridSnapToggle } from "./GridSnapToggle";
import { MeasurementTool } from "./MeasurementTool";
import { RangeIndicator } from "./RangeIndicator";
import TokenManager from "./TokenManager";
import AoETools from "./AoETools";
import FogOfWarTools from "./FogOfWarTools";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface MapViewerProps {
  mapId: string;
  imageUrl: string;
  width: number;
  height: number;
  gridEnabled: boolean;
  gridSize: number;
  isDM: boolean;
  encounterId?: string;
  campaignId?: string;
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
  campaignId,
}: MapViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(gridEnabled);
  const [activeTool, setActiveTool] = useState<DrawingTool>("select");
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(true);
  const [fogTool, setFogTool] = useState<"reveal" | "hide" | null>(null);
  const [notePinDialog, setNotePinDialog] = useState<{
    open: boolean;
    position?: { x: number; y: number };
    pin?: MapMarker;
  }>({ open: false });

  const { toast } = useToast();

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

  // Responsive canvas sizing via ResizeObserver on the canvas panel container
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: cw, height: ch } = entry.contentRect;
        const aspectRatio = width / height;
        let canvasWidth = cw - 16;
        let canvasHeight = canvasWidth / aspectRatio;

        const maxHeight = ch - 16;
        if (canvasHeight > maxHeight) {
          canvasHeight = maxHeight;
          canvasWidth = canvasHeight * aspectRatio;
        }

        setCanvasSize({
          width: Math.max(300, canvasWidth),
          height: Math.max(200, canvasHeight),
        });
      }
    });

    resizeObserver.observe(canvasContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [width, height]);

  // Initialize canvas ONCE (no size deps)
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: "#1a1a1a",
      selection: isDM,
    });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDM]);

  // Resize canvas without destroying it
  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.setDimensions({ width: canvasSize.width, height: canvasSize.height });
    fabricCanvas.renderAll();
  }, [fabricCanvas, canvasSize]);

  // Handle pan tool and canvas interaction
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (opt: any) => {
      if (activeTool === "pan" || opt.e.button === 1) {
        setIsPanning(true);
        setLastPanPosition({ x: opt.e.clientX, y: opt.e.clientY });
        fabricCanvas.selection = false;
        if (fabricCanvas.upperCanvasEl) fabricCanvas.setCursor("grabbing");
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
        if (fabricCanvas.upperCanvasEl) {
          fabricCanvas.setCursor(activeTool === "pan" ? "grab" : "default");
        }
      }
    };

    const handleCanvasClick = (opt: any) => {
      if (activeTool === "pin" && isDM) {
        const pointer = fabricCanvas.getScenePoint(opt.e);
        setNotePinDialog({ open: true, position: { x: pointer.x, y: pointer.y } });
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
    if (!fabricCanvas || !fabricCanvas.upperCanvasEl) return;

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
      case "measure":
      case "range":
      case "terrain":
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

    FabricImage.fromURL(imageUrl, { crossOrigin: "anonymous" }).then((img) => {
      const scaleX = canvasSize.width / (img.width || 1);
      const scaleY = canvasSize.height / (img.height || 1);
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
  }, [fabricCanvas, imageUrl, canvasSize]);

  // Draw grid
  useEffect(() => {
    if (!fabricCanvas) return;

    const existingGrid = fabricCanvas.getObjects().filter((obj: any) => obj.isGridLine);
    existingGrid.forEach((obj) => fabricCanvas.remove(obj));

    if (!showGrid) {
      fabricCanvas.renderAll();
      return;
    }

    for (let i = 0; i <= canvasSize.width; i += gridSize) {
      const line = new Rect({
        left: i, top: 0, width: 1, height: canvasSize.height,
        fill: "#ffffff", opacity: 0.15, selectable: false, evented: false,
      });
      (line as any).isGridLine = true;
      fabricCanvas.add(line);
    }

    for (let i = 0; i <= canvasSize.height; i += gridSize) {
      const line = new Rect({
        left: 0, top: i, width: canvasSize.width, height: 1,
        fill: "#ffffff", opacity: 0.15, selectable: false, evented: false,
      });
      (line as any).isGridLine = true;
      fabricCanvas.add(line);
    }

    fabricCanvas.renderAll();
  }, [fabricCanvas, showGrid, gridSize, canvasSize]);

  // Render tokens on canvas
  useEffect(() => {
    if (!fabricCanvas) return;

    const existingTokens = fabricCanvas.getObjects().filter((obj: any) => obj.tokenId);
    existingTokens.forEach((obj) => fabricCanvas.remove(obj));

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

      if (isDM) {
        circle.on("modified", async () => {
          const newX = (circle.left || 0) + radius;
          const newY = (circle.top || 0) + radius;
          await updateToken(token.id, { x: newX, y: newY });
        });
      }

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

  // Token handlers
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
    toast({ title: "Edit token", description: "Token editing coming soon!" });
  };

  const handleTokenDuplicate = async (token: Token) => {
    const { error } = await supabase.from("tokens").insert({
      map_id: mapId,
      name: `${token.name} (copy)`,
      x: token.x + gridSize,
      y: token.y + gridSize,
      size: token.size,
      color: token.color,
      is_visible: token.is_visible,
    });
    if (!error) toast({ title: "Token duplicated" });
  };

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

  const handleMarkerClick = (marker: MapMarker) => {
    if (marker.marker_type === "note") {
      setNotePinDialog({ open: true, pin: marker });
    }
  };

  const handleAoEClick = async (template: AoETemplate) => {
    if (isDM) {
      await deleteAoE(template.id);
      toast({ title: "AoE removed" });
    }
  };

  const scaleFeetsPerSquare = 5;

  // ── DM Sidebar ──
  const renderSidebar = () => (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {/* Drawing Tools */}
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

        {/* Grid Snap */}
        <GridSnapToggle enabled={gridSnapEnabled} onToggle={setGridSnapEnabled} />

        {/* Token Manager */}
        {campaignId && (
          <TokenManager
            mapId={mapId}
            campaignId={campaignId}
            encounterId={encounterId}
            gridSize={gridSize}
            gridSnapEnabled={gridSnapEnabled}
          />
        )}

        {/* AoE Tools */}
        <AoETools mapId={mapId} encounterId={encounterId} gridSize={gridSize} />

        {/* Fog of War */}
        <FogOfWarTools mapId={mapId} onToolChange={setFogTool} activeTool={fogTool} />

        {/* Terrain Markers */}
        <TerrainMarker
          mapId={mapId}
          isActive={activeTool === "terrain"}
          onToggle={() => setActiveTool(activeTool === "terrain" ? "select" : "terrain")}
        />

        {/* Measurement */}
        <MeasurementTool
          gridSize={gridSize}
          scaleFeetsPerSquare={scaleFeetsPerSquare}
          isActive={activeTool === "measure"}
          onToggle={() => setActiveTool(activeTool === "measure" ? "select" : "measure")}
        />

        {/* Range Indicator */}
        <RangeIndicator
          gridSize={gridSize}
          scaleFeetsPerSquare={scaleFeetsPerSquare}
          isActive={activeTool === "range"}
          onToggle={() => setActiveTool(activeTool === "range" ? "select" : "range")}
        />
      </div>
    </ScrollArea>
  );

  // ── Canvas Panel ──
  const renderCanvas = () => (
    <div
      ref={canvasContainerRef}
      className="relative w-full h-full min-h-[400px] flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden"
    >
      <canvas ref={canvasRef} />

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

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-muted-foreground">
        {Math.round(zoom * 100)}%{!isDM && " • Scroll to zoom"}
      </div>
    </div>
  );

  // ── Layout ──
  if (!isDM) {
    // Players get canvas only
    return (
      <div className="space-y-4">
        <Card className="p-2 bg-muted/50 overflow-hidden" style={{ height: "calc(100vh - 250px)" }}>
          {renderCanvas()}
        </Card>
        <NotePinDialog
          open={notePinDialog.open}
          onOpenChange={(open) => setNotePinDialog({ ...notePinDialog, open })}
          position={notePinDialog.position}
          pin={notePinDialog.pin}
          onSave={handleSaveNotePin}
        />
      </div>
    );
  }

  // DM: Resizable sidebar + canvas
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </Button>
        <span className="text-xs text-muted-foreground">
          {sidebarCollapsed ? "Show Tools" : "Hide Tools"}
        </span>
      </div>

      <Card className="bg-muted/50 overflow-hidden" style={{ height: "calc(100vh - 280px)" }}>
        {sidebarCollapsed ? (
          // Full canvas when sidebar collapsed
          <div className="h-full p-2">{renderCanvas()}</div>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={25} minSize={18} maxSize={40}>
              <div className="h-full border-r border-border bg-card/50">
                {renderSidebar()}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75}>
              <div className="h-full p-2">{renderCanvas()}</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </Card>

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
