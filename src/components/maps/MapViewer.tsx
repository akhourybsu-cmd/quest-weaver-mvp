import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Line as FabricLine, IText, Image as FabricImage, Text, PencilBrush } from "fabric";
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
import { FloatingTokenContextMenu } from "./FloatingTokenContextMenu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(true);
  const [fogTool, setFogTool] = useState<"reveal" | "hide" | null>(null);
  const [notePinDialog, setNotePinDialog] = useState<{
    open: boolean;
    position?: { x: number; y: number };
    pin?: MapMarker;
  }>({ open: false });

  // Drawing tool options
  const [drawColor, setDrawColor] = useState("#ff0000");
  const [drawStrokeWidth, setDrawStrokeWidth] = useState(3);

  // Measurement state (lifted from MeasurementTool)
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
  const [measureDistance, setMeasureDistance] = useState(0);

  // Range indicator state
  const [rangeFeet, setRangeFeet] = useState(30);

  // Terrain marker state
  const [selectedTerrainType, setSelectedTerrainType] = useState<'difficult' | 'water' | 'fire' | 'hazard'>('difficult');

  // Token context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    token: Token | null;
  }>({ visible: false, x: 0, y: 0, token: null });

  // Shape drawing state
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
  const activeShapeRef = useRef<any>(null);

  // Pan state as refs to avoid re-render churn
  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef({ x: 0, y: 0 });

  // Image cache ref
  const imageRef = useRef<any>(null);
  const imageUrlRef = useRef<string>("");

  // Resize debounce ref
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Previous tokens ref for diffing
  const prevTokensRef = useRef<Token[]>([]);

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

  // Get viewport center for placing new objects
  const getViewportCenter = useCallback(() => {
    if (!fabricCanvas) return { x: 300, y: 200 };
    const vpt = fabricCanvas.viewportTransform;
    if (!vpt) return { x: 300, y: 200 };
    const cx = (canvasSize.width / 2 - vpt[4]) / vpt[0];
    const cy = (canvasSize.height / 2 - vpt[5]) / vpt[3];
    return { x: Math.round(cx), y: Math.round(cy) };
  }, [fabricCanvas, canvasSize]);

  // Responsive canvas sizing via ResizeObserver with debounce
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
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
      }, 100);
    });

    resizeObserver.observe(canvasContainerRef.current);
    return () => {
      resizeObserver.disconnect();
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, [width, height]);

  // Initialize canvas ONCE
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

    // Update cached image scale on resize
    if (imageRef.current) {
      const scaleX = canvasSize.width / (imageRef.current._originalElement?.naturalWidth || imageRef.current.width || 1);
      const scaleY = canvasSize.height / (imageRef.current._originalElement?.naturalHeight || imageRef.current.height || 1);
      const scale = Math.min(scaleX, scaleY);
      imageRef.current.set({ scaleX: scale, scaleY: scale });
    }

    fabricCanvas.renderAll();
  }, [fabricCanvas, canvasSize]);

  // Unified mouse event handler
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (opt: any) => {
      const tool = activeTool;
      const e = opt.e;

      // Pan (pan tool or middle-click)
      if (tool === "pan" || e.button === 1) {
        isPanningRef.current = true;
        lastPanPosRef.current = { x: e.clientX, y: e.clientY };
        fabricCanvas.selection = false;
        fabricCanvas.setCursor("grabbing");
        return;
      }

      const pointer = fabricCanvas.getScenePoint(e);

      // Tool-specific mouse down
      switch (tool) {
        case "pin":
          if (isDM) {
            setNotePinDialog({ open: true, position: { x: pointer.x, y: pointer.y } });
          }
          break;

        case "measure": {
          if (!measureStart) {
            setMeasureStart({ x: pointer.x, y: pointer.y });
          } else {
            setMeasureEnd({ x: pointer.x, y: pointer.y });
            const dx = pointer.x - measureStart.x;
            const dy = pointer.y - measureStart.y;
            const pixelDistance = Math.sqrt(dx * dx + dy * dy);
            const squares = pixelDistance / gridSize;
            setMeasureDistance(Math.round(squares * 5));

            // Draw measurement line on canvas
            clearMeasurementObjects();
            const line = new FabricLine([measureStart.x, measureStart.y, pointer.x, pointer.y], {
              stroke: "#ffdd44",
              strokeWidth: 2,
              strokeDashArray: [6, 4],
              selectable: false,
              evented: false,
            });
            (line as any).isMeasurement = true;
            fabricCanvas.add(line);

            const midX = (measureStart.x + pointer.x) / 2;
            const midY = (measureStart.y + pointer.y) / 2;
            const label = new Text(`${Math.round(squares * 5)} ft`, {
              left: midX,
              top: midY - 14,
              fontSize: 13,
              fill: "#ffdd44",
              fontWeight: "bold",
              originX: "center",
              selectable: false,
              evented: false,
            });
            (label as any).isMeasurement = true;
            fabricCanvas.add(label);
            fabricCanvas.renderAll();
          }
          break;
        }

        case "range": {
          // Place range circle at click
          const radiusPixels = (rangeFeet / 5) * gridSize;
          const rangeCircle = new Circle({
            left: pointer.x - radiusPixels,
            top: pointer.y - radiusPixels,
            radius: radiusPixels,
            fill: "rgba(59, 130, 246, 0.15)",
            stroke: "#3b82f6",
            strokeWidth: 2,
            strokeDashArray: [8, 4],
            selectable: false,
            evented: false,
          });
          (rangeCircle as any).isRangeIndicator = true;
          fabricCanvas.add(rangeCircle);

          const rangeLabel = new Text(`${rangeFeet} ft`, {
            left: pointer.x,
            top: pointer.y,
            fontSize: 12,
            fill: "#3b82f6",
            fontWeight: "bold",
            originX: "center",
            originY: "center",
            selectable: false,
            evented: false,
          });
          (rangeLabel as any).isRangeIndicator = true;
          fabricCanvas.add(rangeLabel);
          fabricCanvas.renderAll();
          break;
        }

        case "terrain": {
          if (!isDM) break;
          const terrainColors: Record<string, string> = {
            difficult: "#8b7355",
            water: "#3b82f6",
            fire: "#ef4444",
            hazard: "#a855f7",
          };
          addMarker({
            map_id: mapId,
            marker_type: "terrain",
            shape: "circle",
            x: pointer.x,
            y: pointer.y,
            color: terrainColors[selectedTerrainType] || "#8b7355",
            opacity: 0.7,
            label: selectedTerrainType,
            dm_only: false,
            metadata: { terrain_type: selectedTerrainType },
            rotation: 0,
          });
          toast({ title: "Terrain marker placed" });
          break;
        }

        case "circle":
        case "rectangle":
        case "line": {
          shapeStartRef.current = { x: pointer.x, y: pointer.y };
          let shape: any;
          if (tool === "circle") {
            shape = new Circle({
              left: pointer.x,
              top: pointer.y,
              radius: 0,
              fill: "transparent",
              stroke: drawColor,
              strokeWidth: drawStrokeWidth,
              selectable: true,
              evented: true,
            });
          } else if (tool === "rectangle") {
            shape = new Rect({
              left: pointer.x,
              top: pointer.y,
              width: 0,
              height: 0,
              fill: "transparent",
              stroke: drawColor,
              strokeWidth: drawStrokeWidth,
              selectable: true,
              evented: true,
            });
          } else {
            shape = new FabricLine([pointer.x, pointer.y, pointer.x, pointer.y], {
              stroke: drawColor,
              strokeWidth: drawStrokeWidth,
              selectable: true,
              evented: true,
            });
          }
          (shape as any).isUserDrawing = true;
          activeShapeRef.current = shape;
          fabricCanvas.add(shape);
          break;
        }

        case "text": {
          const itext = new IText("Text", {
            left: pointer.x,
            top: pointer.y,
            fontSize: 18,
            fill: drawColor,
            fontWeight: "normal",
            selectable: true,
            evented: true,
          });
          (itext as any).isUserDrawing = true;
          fabricCanvas.add(itext);
          fabricCanvas.setActiveObject(itext);
          itext.enterEditing();
          fabricCanvas.renderAll();
          break;
        }

        case "eraser": {
          const target = fabricCanvas.findTarget(e);
          if (target && (target as any).isUserDrawing) {
            fabricCanvas.remove(target);
            fabricCanvas.renderAll();
          }
          break;
        }

        default:
          break;
      }
    };

    const handleMouseMove = (opt: any) => {
      const e = opt.e;

      // Pan
      if (isPanningRef.current) {
        const dx = e.clientX - lastPanPosRef.current.x;
        const dy = e.clientY - lastPanPosRef.current.y;
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          vpt[4] += dx;
          vpt[5] += dy;
          fabricCanvas.setViewportTransform(vpt);
        }
        lastPanPosRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // Shape preview during drag
      if (shapeStartRef.current && activeShapeRef.current) {
        const pointer = fabricCanvas.getScenePoint(e);
        const start = shapeStartRef.current;
        const shape = activeShapeRef.current;

        if (activeTool === "circle") {
          const dx = pointer.x - start.x;
          const dy = pointer.y - start.y;
          const radius = Math.sqrt(dx * dx + dy * dy) / 2;
          const cx = (start.x + pointer.x) / 2;
          const cy = (start.y + pointer.y) / 2;
          shape.set({ left: cx - radius, top: cy - radius, radius });
        } else if (activeTool === "rectangle") {
          const left = Math.min(start.x, pointer.x);
          const top = Math.min(start.y, pointer.y);
          shape.set({
            left,
            top,
            width: Math.abs(pointer.x - start.x),
            height: Math.abs(pointer.y - start.y),
          });
        } else if (activeTool === "line") {
          shape.set({ x2: pointer.x, y2: pointer.y });
        }
        fabricCanvas.renderAll();
      }
    };

    const handleMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        fabricCanvas.selection = isDM && activeTool === "select";
        fabricCanvas.setCursor(activeTool === "pan" ? "grab" : "default");
      }

      // Finalize shape
      if (shapeStartRef.current && activeShapeRef.current) {
        shapeStartRef.current = null;
        activeShapeRef.current = null;
      }
    };

    // Right-click for token context menu
    const handleContextMenu = (opt: any) => {
      if (!isDM) return;
      const target = opt.target;
      if (target && (target as any).tokenData) {
        opt.e.preventDefault();
        opt.e.stopPropagation();
        const canvasEl = fabricCanvas.upperCanvasEl || fabricCanvas.lowerCanvasEl;
        const rect = canvasEl.getBoundingClientRect();
        setContextMenu({
          visible: true,
          x: opt.e.clientX - rect.left,
          y: opt.e.clientY - rect.top,
          token: (target as any).tokenData,
        });
      }
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);
    fabricCanvas.on("mouse:down:before", handleContextMenu);

    // Prevent browser right-click on canvas
    const canvasEl = fabricCanvas.upperCanvasEl;
    const preventContextMenu = (e: MouseEvent) => {
      if (isDM) e.preventDefault();
    };
    canvasEl?.addEventListener("contextmenu", preventContextMenu);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
      fabricCanvas.off("mouse:down:before", handleContextMenu);
      canvasEl?.removeEventListener("contextmenu", preventContextMenu);
    };
  }, [fabricCanvas, activeTool, isDM, measureStart, gridSize, rangeFeet, selectedTerrainType, drawColor, drawStrokeWidth, mapId, addMarker, toast]);

  // Enable/disable Fabric drawing mode for freehand
  useEffect(() => {
    if (!fabricCanvas) return;
    if (activeTool === "draw") {
      fabricCanvas.isDrawingMode = true;
      const brush = new PencilBrush(fabricCanvas);
      brush.color = drawColor;
      brush.width = drawStrokeWidth;
      fabricCanvas.freeDrawingBrush = brush;

      // Tag new paths as user drawings
      const onPathCreated = (opt: any) => {
        if (opt.path) {
          (opt.path as any).isUserDrawing = true;
        }
      };
      fabricCanvas.on("path:created", onPathCreated);
      return () => {
        fabricCanvas.off("path:created", onPathCreated);
      };
    } else {
      fabricCanvas.isDrawingMode = false;
    }
  }, [fabricCanvas, activeTool, drawColor, drawStrokeWidth]);

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
      case "eraser":
        fabricCanvas.setCursor("not-allowed");
        fabricCanvas.selection = false;
        break;
      case "draw":
        // Fabric handles cursor in drawing mode
        fabricCanvas.selection = false;
        break;
      default:
        fabricCanvas.setCursor("crosshair");
        fabricCanvas.selection = false;
    }
  }, [fabricCanvas, activeTool, isDM]);

  // Load map image (with caching)
  useEffect(() => {
    if (!fabricCanvas || !imageUrl) return;

    // If same URL, just rescale
    if (imageUrlRef.current === imageUrl && imageRef.current) {
      const img = imageRef.current;
      const scaleX = canvasSize.width / (img._originalElement?.naturalWidth || img.width || 1);
      const scaleY = canvasSize.height / (img._originalElement?.naturalHeight || img.height || 1);
      const scale = Math.min(scaleX, scaleY);
      img.set({ scaleX: scale, scaleY: scale });
      fabricCanvas.renderAll();
      return;
    }

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
      imageRef.current = img;
      imageUrlRef.current = imageUrl;
      fabricCanvas.add(img);
      fabricCanvas.sendObjectToBack(img);
      fabricCanvas.renderAll();
    });
  }, [fabricCanvas, imageUrl, canvasSize]);

  // Draw grid using afterRender for zero-object-cost
  useEffect(() => {
    if (!fabricCanvas) return;

    const drawGrid = (opt: any) => {
      if (!showGrid) return;
      const ctx = opt.ctx as CanvasRenderingContext2D;
      const vpt = fabricCanvas.viewportTransform;
      if (!vpt) return;

      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;

      // Calculate visible area in scene coordinates
      const left = -vpt[4] / vpt[0];
      const top = -vpt[5] / vpt[3];
      const right = left + canvasSize.width / vpt[0];
      const bottom = top + canvasSize.height / vpt[3];

      const startX = Math.floor(left / gridSize) * gridSize;
      const startY = Math.floor(top / gridSize) * gridSize;

      ctx.beginPath();
      for (let x = startX; x <= right; x += gridSize) {
        const screenX = x * vpt[0] + vpt[4];
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvasSize.height);
      }
      for (let y = startY; y <= bottom; y += gridSize) {
        const screenY = y * vpt[3] + vpt[5];
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvasSize.width, screenY);
      }
      ctx.stroke();
      ctx.restore();
    };

    fabricCanvas.on("after:render", drawGrid);

    // Remove old grid objects if any
    const existingGrid = fabricCanvas.getObjects().filter((obj: any) => obj.isGridLine);
    existingGrid.forEach((obj) => fabricCanvas.remove(obj));

    fabricCanvas.renderAll();

    return () => {
      fabricCanvas.off("after:render", drawGrid);
    };
  }, [fabricCanvas, showGrid, gridSize, canvasSize]);

  // Render tokens on canvas with diffing
  useEffect(() => {
    if (!fabricCanvas) return;

    const prevTokens = prevTokensRef.current;
    const prevMap = new Map(prevTokens.map(t => [t.id, t]));
    const currMap = new Map(tokens.map(t => [t.id, t]));

    // Remove tokens that no longer exist
    const toRemove = prevTokens.filter(t => !currMap.has(t.id));
    toRemove.forEach(t => {
      const objs = fabricCanvas.getObjects().filter((obj: any) => 
        obj.tokenId === t.id || obj.tokenId === t.id + "-label"
      );
      objs.forEach(obj => fabricCanvas.remove(obj));
    });

    // Update or add tokens
    tokens.forEach((token) => {
      if (!isDM && !token.is_visible) return;

      const prev = prevMap.get(token.id);
      const radius = (gridSize * token.size) / 2;

      // Check if token already exists on canvas
      const existingCircle = fabricCanvas.getObjects().find(
        (obj: any) => obj.tokenId === token.id && !String(obj.tokenId).endsWith("-label")
      );

      if (existingCircle && prev) {
        // Update position if changed
        if (prev.x !== token.x || prev.y !== token.y || prev.color !== token.color || prev.is_visible !== token.is_visible) {
          existingCircle.set({
            left: token.x - radius,
            top: token.y - radius,
            fill: token.color,
            opacity: token.is_visible ? 1 : 0.5,
          });
          (existingCircle as any).tokenData = token;

          // Update label
          const existingLabel = fabricCanvas.getObjects().find(
            (obj: any) => obj.tokenId === token.id + "-label"
          );
          if (existingLabel && token.name) {
            existingLabel.set({
              left: token.x,
              top: token.y - radius - 15,
            });
          }
        }
      } else {
        // Remove any stale objects for this token
        const stale = fabricCanvas.getObjects().filter((obj: any) =>
          obj.tokenId === token.id || obj.tokenId === token.id + "-label"
        );
        stale.forEach(obj => fabricCanvas.remove(obj));

        // Create new circle
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
            let newX = (circle.left || 0) + radius;
            let newY = (circle.top || 0) + radius;

            // Grid snap
            if (gridSnapEnabled) {
              newX = Math.round(newX / gridSize) * gridSize;
              newY = Math.round(newY / gridSize) * gridSize;
              circle.set({
                left: newX - radius,
                top: newY - radius,
              });
              fabricCanvas.renderAll();
            }

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
      }
    });

    // Remove invisible tokens for players
    if (!isDM) {
      tokens.filter(t => !t.is_visible).forEach(t => {
        const objs = fabricCanvas.getObjects().filter((obj: any) =>
          obj.tokenId === t.id || obj.tokenId === t.id + "-label"
        );
        objs.forEach(obj => fabricCanvas.remove(obj));
      });
    }

    prevTokensRef.current = [...tokens];
    fabricCanvas.renderAll();
  }, [fabricCanvas, tokens, isDM, gridSize, gridSnapEnabled, updateToken]);

  // Helper to clear measurement objects
  const clearMeasurementObjects = useCallback(() => {
    if (!fabricCanvas) return;
    const objs = fabricCanvas.getObjects().filter((obj: any) => obj.isMeasurement);
    objs.forEach(obj => fabricCanvas.remove(obj));
  }, [fabricCanvas]);

  // Clear measurement when tool changes away
  useEffect(() => {
    if (activeTool !== "measure") {
      setMeasureStart(null);
      setMeasureEnd(null);
      setMeasureDistance(0);
      clearMeasurementObjects();
    }
  }, [activeTool, clearMeasurementObjects]);

  // Clear range indicators when tool changes
  useEffect(() => {
    if (activeTool !== "range" && fabricCanvas) {
      const objs = fabricCanvas.getObjects().filter((obj: any) => obj.isRangeIndicator);
      objs.forEach(obj => fabricCanvas.remove(obj));
      fabricCanvas.renderAll();
    }
  }, [activeTool, fabricCanvas]);

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
    const center = getViewportCenter();
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

  const handleMeasureReset = useCallback(() => {
    setMeasureStart(null);
    setMeasureEnd(null);
    setMeasureDistance(0);
    clearMeasurementObjects();
  }, [clearMeasurementObjects]);

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
          drawColor={drawColor}
          onDrawColorChange={setDrawColor}
          strokeWidth={drawStrokeWidth}
          onStrokeWidthChange={setDrawStrokeWidth}
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
            getViewportCenter={getViewportCenter}
          />
        )}

        {/* AoE Tools */}
        <AoETools
          mapId={mapId}
          encounterId={encounterId}
          gridSize={gridSize}
          getViewportCenter={getViewportCenter}
        />

        {/* Fog of War */}
        <FogOfWarTools mapId={mapId} onToolChange={setFogTool} activeTool={fogTool} />

        {/* Terrain Markers */}
        <TerrainMarker
          mapId={mapId}
          isActive={activeTool === "terrain"}
          onToggle={() => setActiveTool(activeTool === "terrain" ? "select" : "terrain")}
          selectedType={selectedTerrainType}
          onTypeChange={setSelectedTerrainType}
        />

        {/* Measurement */}
        <MeasurementTool
          gridSize={gridSize}
          scaleFeetsPerSquare={scaleFeetsPerSquare}
          isActive={activeTool === "measure"}
          onToggle={() => setActiveTool(activeTool === "measure" ? "select" : "measure")}
          distance={measureDistance}
          hasStart={!!measureStart}
          onReset={handleMeasureReset}
        />

        {/* Range Indicator */}
        <RangeIndicator
          gridSize={gridSize}
          scaleFeetsPerSquare={scaleFeetsPerSquare}
          isActive={activeTool === "range"}
          onToggle={() => setActiveTool(activeTool === "range" ? "select" : "range")}
          rangeFeet={rangeFeet}
          onRangeFeetChange={setRangeFeet}
        />
      </div>
    </ScrollArea>
  );

  // ── Canvas Panel ──
  const renderCanvas = () => (
    <div
      ref={canvasContainerRef}
      className="relative w-full h-full min-h-[400px] flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden"
      onClick={() => setContextMenu({ visible: false, x: 0, y: 0, token: null })}
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

      {/* Token context menu */}
      {contextMenu.visible && contextMenu.token && (
        <FloatingTokenContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          token={contextMenu.token}
          onToggleVisibility={(t) => { handleTokenToggleVisibility(t); setContextMenu({ ...contextMenu, visible: false }); }}
          onDelete={(t) => { handleTokenDelete(t); setContextMenu({ ...contextMenu, visible: false }); }}
          onEdit={(t) => { handleTokenEdit(t); setContextMenu({ ...contextMenu, visible: false }); }}
          onDuplicate={(t) => { handleTokenDuplicate(t); setContextMenu({ ...contextMenu, visible: false }); }}
          onClose={() => setContextMenu({ ...contextMenu, visible: false })}
        />
      )}

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-muted-foreground">
        {Math.round(zoom * 100)}%{!isDM && " • Scroll to zoom"}
      </div>
    </div>
  );

  // ── Layout ──
  if (!isDM) {
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
