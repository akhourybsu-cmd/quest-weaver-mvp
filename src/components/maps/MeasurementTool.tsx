import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ruler, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MeasurementToolProps {
  gridSize: number;
  scaleFeetsPerSquare: number;
  isActive: boolean;
  onToggle: () => void;
  distance: number;
  hasStart: boolean;
  onReset: () => void;
}

export function MeasurementTool({
  gridSize,
  scaleFeetsPerSquare,
  isActive,
  onToggle,
  distance,
  hasStart,
  onReset,
}: MeasurementToolProps) {
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
            {hasStart && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={onReset}
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
