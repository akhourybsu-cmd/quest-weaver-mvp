import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MousePointer2,
  Pencil,
  Circle,
  Square,
  Minus,
  Type,
  Ruler,
  Target,
  Mountain,
  MapPin,
  Eraser,
  Maximize,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Eye,
  EyeOff,
} from "lucide-react";

export type DrawingTool =
  | "select"
  | "pan"
  | "draw"
  | "circle"
  | "rectangle"
  | "line"
  | "text"
  | "measure"
  | "range"
  | "terrain"
  | "pin"
  | "eraser";

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  zoom: number;
}

const TOOLS: { id: DrawingTool; icon: any; label: string; shortcut?: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select & Move", shortcut: "V" },
  { id: "pan", icon: MousePointer2, label: "Pan View", shortcut: "H" },
  { id: "draw", icon: Pencil, label: "Freehand Draw", shortcut: "P" },
  { id: "circle", icon: Circle, label: "Circle/Sphere", shortcut: "C" },
  { id: "rectangle", icon: Square, label: "Rectangle/Cube", shortcut: "R" },
  { id: "line", icon: Minus, label: "Line", shortcut: "L" },
  { id: "text", icon: Type, label: "Text Label", shortcut: "T" },
  { id: "measure", icon: Ruler, label: "Measure Distance", shortcut: "M" },
  { id: "range", icon: Target, label: "Range Indicator" },
  { id: "terrain", icon: Mountain, label: "Terrain Marker" },
  { id: "pin", icon: MapPin, label: "Note Pin", shortcut: "N" },
  { id: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
];

export function DrawingToolbar({
  activeTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onFitToView,
  showGrid,
  onToggleGrid,
  zoom,
}: DrawingToolbarProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Card className="p-2 bg-card/95 backdrop-blur-sm shadow-lg">
        <div className="flex flex-col gap-1">
          {/* Drawing Tools */}
          <div className="flex flex-wrap gap-1 pb-2 border-b border-border">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTool === tool.id ? "default" : "ghost"}
                      size="icon"
                      className="w-9 h-9"
                      onClick={() => onToolChange(tool.id)}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>
                      {tool.label}
                      {tool.shortcut && (
                        <span className="ml-2 text-muted-foreground">
                          ({tool.shortcut})
                        </span>
                      )}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* View Controls */}
          <div className="flex flex-wrap gap-1 pt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9" onClick={onZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Zoom In</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9" onClick={onZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Zoom Out</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9" onClick={onFitToView}>
                  <Maximize className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Fit to View</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showGrid ? "default" : "ghost"}
                  size="icon"
                  className="w-9 h-9"
                  onClick={onToggleGrid}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Toggle Grid</TooltipContent>
            </Tooltip>
          </div>

          {/* Zoom Level Display */}
          <div className="text-xs text-center text-muted-foreground pt-1 border-t border-border">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}
