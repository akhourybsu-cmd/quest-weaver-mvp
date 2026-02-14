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
  const [rangeFeet, setRangeFeet] = useState<number>(30);

  return (
    <div className="space-y-2">
      <Button
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={onToggle}
        className="w-full"
      >
        <Target className="w-4 h-4 mr-2" />
        Range Indicator
      </Button>

      {isActive && (
        <Card>
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

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium">Radius:</span>
              <Badge variant="secondary" className="font-mono">
                {rangeFeet} ft
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              Click the map to place a range circle. Radius = {Math.round(rangeFeet / scaleFeetsPerSquare)} squares.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
