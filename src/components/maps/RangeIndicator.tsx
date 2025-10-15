import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Target, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RangeIndicatorProps {
  gridSize: number;
  scaleFeetsPerSquare: number;
  isActive: boolean;
  onToggle: () => void;
}

export function RangeIndicator({
  gridSize,
  scaleFeetsPerSquare,
  isActive,
  onToggle,
}: RangeIndicatorProps) {
  const [centerPoint, setCenterPoint] = useState<{ x: number; y: number } | null>(null);
  const [rangeFeet, setRangeFeet] = useState<number>(30);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCenterPoint({ x, y });
  };

  const handleClear = () => {
    setCenterPoint(null);
  };

  const radiusInPixels = (rangeFeet / scaleFeetsPerSquare) * gridSize;

  return (
    <>
      {/* Range Overlay */}
      {isActive && (
        <div
          className="absolute inset-0 z-40 cursor-crosshair"
          onClick={handleCanvasClick}
          style={{ pointerEvents: isActive ? 'auto' : 'none' }}
        >
          {centerPoint && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Range Circle */}
              <circle
                cx={centerPoint.x}
                cy={centerPoint.y}
                r={radiusInPixels}
                fill="hsl(var(--primary) / 0.2)"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              
              {/* Center Point */}
              <circle
                cx={centerPoint.x}
                cy={centerPoint.y}
                r="6"
                fill="hsl(var(--primary))"
                stroke="white"
                strokeWidth="2"
              />
              
              {/* Range Label */}
              <text
                x={centerPoint.x}
                y={centerPoint.y - radiusInPixels - 10}
                fill="white"
                stroke="black"
                strokeWidth="3"
                paintOrder="stroke"
                fontSize="14"
                fontWeight="bold"
                textAnchor="middle"
              >
                {rangeFeet} ft range
              </text>
            </svg>
          )}
        </div>
      )}

      {/* Control Panel */}
      <div className="absolute top-16 left-4 z-50 space-y-2">
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          onClick={onToggle}
          className="shadow-lg"
        >
          <Target className="w-4 h-4 mr-2" />
          Range
        </Button>

        {isActive && (
          <Card className="shadow-lg">
            <CardContent className="p-3 space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Range (feet)</Label>
                <Input
                  type="number"
                  min="5"
                  step="5"
                  value={rangeFeet}
                  onChange={(e) => setRangeFeet(Math.max(5, parseInt(e.target.value) || 5))}
                  className="h-8"
                />
              </div>
              
              {centerPoint && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">Active:</span>
                    <Badge variant="secondary" className="font-mono">
                      {rangeFeet} ft
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={handleClear}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </>
              )}
              
              <p className="text-xs text-muted-foreground">
                Click map to place range indicator
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
