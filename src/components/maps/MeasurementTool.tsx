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

  const handleReset = () => {
    setStartPoint(null);
    setEndPoint(null);
    setDistance(0);
  };

  return (
    <div className="space-y-2">
      <Button
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={onToggle}
        className="w-full"
      >
        <Ruler className="w-4 h-4 mr-2" />
        Measure
      </Button>

      {isActive && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium">Distance:</span>
              <Badge variant="secondary" className="font-mono">
                {distance} ft
              </Badge>
            </div>
            {startPoint && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={handleReset}
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Click two points on the map to measure distance.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
