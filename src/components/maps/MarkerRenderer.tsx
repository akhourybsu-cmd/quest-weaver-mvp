import { useEffect, useRef } from "react";
import { Circle, Rect, Polygon, Text } from "fabric";
import type { Canvas as FabricCanvas } from "fabric";
import type { MapMarker, AoETemplate, FogRegion } from "@/hooks/useMapOverlays";

interface MarkerRendererProps {
  canvas: FabricCanvas | null;
  markers: MapMarker[];
  aoeTemplates: AoETemplate[];
  fogRegions: FogRegion[];
  isDM: boolean;
  gridSize: number;
  onMarkerClick?: (marker: MapMarker) => void;
  onAoEClick?: (template: AoETemplate) => void;
}

// Color map for terrain types
const TERRAIN_COLORS: Record<string, string> = {
  difficult: "#8b7355",
  water: "#3b82f6",
  fire: "#ef4444",
  hazard: "#a855f7",
};

// Shape map for AoE
const AOE_COLORS: Record<string, string> = {
  circle: "#ef4444",
  cone: "#f97316",
  line: "#eab308",
  cube: "#22c55e",
};

export function MarkerRenderer({
  canvas,
  markers,
  aoeTemplates,
  fogRegions,
  isDM,
  gridSize,
  onMarkerClick,
  onAoEClick,
}: MarkerRendererProps) {
  const renderedIdsRef = useRef<Set<string>>(new Set());

  // Render all overlays when data changes
  useEffect(() => {
    if (!canvas) return;

    // Clear previously rendered overlay objects
    const existingOverlays = canvas.getObjects().filter(
      (obj: any) => obj.overlayId || obj.aoeId || obj.fogId || obj.markerId
    );
    existingOverlays.forEach((obj) => canvas.remove(obj));
    renderedIdsRef.current.clear();

    // Render fog regions (bottom layer)
    fogRegions.forEach((fog) => {
      if (!fog.polygon_points || fog.polygon_points.length < 3) return;
      
      // For DM: show hidden fog as semi-transparent black
      // For players: only show revealed areas (we filter in hook)
      if (!isDM && !fog.is_revealed) return;

      const points = fog.polygon_points.map((p) => ({ x: p.x, y: p.y }));
      
      const polygon = new Polygon(points, {
        fill: fog.is_revealed ? "transparent" : "rgba(0, 0, 0, 0.8)",
        stroke: isDM ? "#666" : "transparent",
        strokeWidth: isDM ? 1 : 0,
        selectable: false,
        evented: false,
        opacity: isDM && fog.is_revealed ? 0.3 : 1,
      });
      
      (polygon as any).fogId = fog.id;
      canvas.add(polygon);
      canvas.sendObjectToBack(polygon);
    });

    // Render AoE templates (middle layer)
    aoeTemplates.forEach((aoe) => {
      const color = aoe.color || AOE_COLORS[aoe.shape] || "#ef4444";
      let fabricObject: any;

      switch (aoe.shape) {
        case "circle":
          fabricObject = new Circle({
            left: aoe.x - (aoe.radius || 40),
            top: aoe.y - (aoe.radius || 40),
            radius: aoe.radius || 40,
            fill: color,
            opacity: aoe.opacity ?? 0.4,
            stroke: color,
            strokeWidth: 2,
            selectable: isDM,
            evented: isDM,
          });
          break;

        case "cone":
          // Approximate cone as triangle
          const coneLength = aoe.length || 60;
          const coneWidth = coneLength * 0.6;
          const points = [
            { x: aoe.x, y: aoe.y },
            { x: aoe.x - coneWidth / 2, y: aoe.y + coneLength },
            { x: aoe.x + coneWidth / 2, y: aoe.y + coneLength },
          ];
          fabricObject = new Polygon(points, {
            fill: color,
            opacity: aoe.opacity ?? 0.4,
            stroke: color,
            strokeWidth: 2,
            selectable: isDM,
            evented: isDM,
            angle: aoe.rotation || 0,
          });
          break;

        case "line":
          const lineLength = aoe.length || 60;
          const lineWidth = aoe.width || 10;
          fabricObject = new Rect({
            left: aoe.x - lineWidth / 2,
            top: aoe.y,
            width: lineWidth,
            height: lineLength,
            fill: color,
            opacity: aoe.opacity ?? 0.4,
            stroke: color,
            strokeWidth: 2,
            selectable: isDM,
            evented: isDM,
            angle: aoe.rotation || 0,
          });
          break;

        case "cube":
          const cubeSize = aoe.radius || 40;
          fabricObject = new Rect({
            left: aoe.x - cubeSize,
            top: aoe.y - cubeSize,
            width: cubeSize * 2,
            height: cubeSize * 2,
            fill: color,
            opacity: aoe.opacity ?? 0.4,
            stroke: color,
            strokeWidth: 2,
            selectable: isDM,
            evented: isDM,
          });
          break;

        default:
          return;
      }

      (fabricObject as any).aoeId = aoe.id;
      
      // Add click handler for DM
      if (isDM && onAoEClick) {
        fabricObject.on("mousedown", () => onAoEClick(aoe));
      }

      canvas.add(fabricObject);

      // Add label if present
      if (aoe.label) {
        const label = new Text(aoe.label, {
          left: aoe.x,
          top: aoe.y - 15,
          fontSize: 12,
          fill: "#fff",
          fontWeight: "bold",
          textAlign: "center",
          originX: "center",
          selectable: false,
          evented: false,
        });
        (label as any).aoeId = aoe.id + "-label";
        canvas.add(label);
      }
    });

    // Render markers (top layer)
    markers.forEach((marker) => {
      const color = marker.color || TERRAIN_COLORS[marker.marker_type] || "#ffffff";
      
      // Create marker shape
      let fabricObject: any;
      
      if (marker.shape === "circle" || marker.marker_type === "terrain") {
        fabricObject = new Circle({
          left: marker.x - 15,
          top: marker.y - 15,
          radius: 15,
          fill: color,
          opacity: marker.opacity ?? 0.7,
          stroke: "#fff",
          strokeWidth: 2,
          selectable: isDM,
          evented: isDM,
        });
      } else if (marker.marker_type === "note" || marker.marker_type === "pin") {
        // Pin style marker
        fabricObject = new Circle({
          left: marker.x - 12,
          top: marker.y - 12,
          radius: 12,
          fill: "#ef4444",
          opacity: marker.opacity ?? 0.9,
          stroke: "#fff",
          strokeWidth: 2,
          selectable: isDM,
          evented: isDM,
        });
      } else {
        fabricObject = new Rect({
          left: marker.x - (marker.width || 30) / 2,
          top: marker.y - (marker.height || 30) / 2,
          width: marker.width || 30,
          height: marker.height || 30,
          fill: color,
          opacity: marker.opacity ?? 0.7,
          stroke: "#fff",
          strokeWidth: 2,
          angle: marker.rotation || 0,
          selectable: isDM,
          evented: isDM,
        });
      }

      (fabricObject as any).markerId = marker.id;
      
      // Add click handler for DM
      if (isDM && onMarkerClick) {
        fabricObject.on("mousedown", () => onMarkerClick(marker));
      }

      canvas.add(fabricObject);

      // Add label if present
      if (marker.label) {
        const label = new Text(marker.label, {
          left: marker.x,
          top: marker.y + 20,
          fontSize: 11,
          fill: "#fff",
          fontWeight: "bold",
          textAlign: "center",
          originX: "center",
          selectable: false,
          evented: false,
        });
        (label as any).markerId = marker.id + "-label";
        canvas.add(label);
      }

      renderedIdsRef.current.add(marker.id);
    });

    canvas.renderAll();
  }, [canvas, markers, aoeTemplates, fogRegions, isDM, onMarkerClick, onAoEClick]);

  return null;
}
