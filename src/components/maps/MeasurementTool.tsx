import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ruler, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Point {
  x: number;
  y: number;
}

interface MeasurementToolProps {
  gridSize: number;
  scaleFeetsPerSquare: number;
  isActive: boolean;
  onToggle: () => void;
}

export function MeasurementTool({
  gridSize,
  scaleFeetsPerSquare,
  isActive,
  onToggle,
}: MeasurementToolProps) {
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [distance, setDistance] = useState<number>(0);

  const calculateDistance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    const squares = pixelDistance / gridSize;
    return Math.round(squares * scaleFeetsPerSquare);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!startPoint) {
      setStartPoint({ x, y });
      setEndPoint(null);
      setDistance(0);
    } else {
      const end = { x, y };
      setEndPoint(end);
      setDistance(calculateDistance(startPoint, end));
    }
  };

  const handleReset = () => {
    setStartPoint(null);
    setEndPoint(null);
    setDistance(0);
  };

  return (
    <>
      {/* Measurement Overlay */}
      {isActive && (
        <div
          className="absolute inset-0 z-50 cursor-crosshair"
          onClick={handleCanvasClick}
          style={{ pointerEvents: isActive ? 'auto' : 'none' }}
        >
          {startPoint && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Start Point */}
              <circle
                cx={startPoint.x}
                cy={startPoint.y}
                r="6"
                fill="hsl(var(--primary))"
                stroke="white"
                strokeWidth="2"
              />
              
              {/* Line and End Point */}
              {endPoint && (
                <>
                  <line
                    x1={startPoint.x}
                    y1={startPoint.y}
                    x2={endPoint.x}
                    y2={endPoint.y}
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                  />
                  <circle
                    cx={endPoint.x}
                    cy={endPoint.y}
                    r="6"
                    fill="hsl(var(--primary))"
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* Distance Label */}
                  <text
                    x={(startPoint.x + endPoint.x) / 2}
                    y={(startPoint.y + endPoint.y) / 2 - 10}
                    fill="white"
                    stroke="black"
                    strokeWidth="3"
                    paintOrder="stroke"
                    fontSize="16"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {distance} ft
                  </text>
                </>
              )}
            </svg>
          )}
        </div>
      )}

      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-50 space-y-2">
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          onClick={onToggle}
          className="shadow-lg"
        >
          <Ruler className="w-4 h-4 mr-2" />
          Measure
        </Button>

        {isActive && startPoint && (
          <Card className="shadow-lg">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium">Distance:</span>
                <Badge variant="secondary" className="font-mono">
                  {distance} ft
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={handleReset}
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
              <p className="text-xs text-muted-foreground">
                Click to set {!endPoint ? 'end point' : 'new start point'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
