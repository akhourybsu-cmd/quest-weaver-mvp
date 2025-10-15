import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Circle, Square, Eraser, Paintbrush } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdvancedFogToolsProps {
  onRevealArea: (shape: 'circle' | 'square', size: number, x: number, y: number) => void;
  onHideArea: (shape: 'circle' | 'square', size: number, x: number, y: number) => void;
  isActive: boolean;
  onToggle: () => void;
}

export function AdvancedFogTools({
  onRevealArea,
  onHideArea,
  isActive,
  onToggle,
}: AdvancedFogToolsProps) {
  const [brushMode, setBrushMode] = useState<'reveal' | 'hide'>('reveal');
  const [brushShape, setBrushShape] = useState<'circle' | 'square'>('circle');
  const [brushSize, setBrushSize] = useState<number>(100);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive) return;
    setIsDrawing(true);
    handleDraw(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive || !isDrawing) return;
    handleDraw(e);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleDraw = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (brushMode === 'reveal') {
      onRevealArea(brushShape, brushSize, x, y);
    } else {
      onHideArea(brushShape, brushSize, x, y);
    }
  };

  return (
    <>
      {/* Drawing Overlay */}
      {isActive && (
        <div
          className="absolute inset-0 z-40"
          style={{ 
            cursor: brushMode === 'reveal' ? 'crosshair' : 'not-allowed',
            pointerEvents: isActive ? 'auto' : 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      )}

      {/* Control Panel */}
      <div className="absolute bottom-4 left-4 z-50 space-y-2">
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          onClick={onToggle}
          className="shadow-lg"
        >
          {brushMode === 'reveal' ? (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Fog Tools
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Fog Tools
            </>
          )}
        </Button>

        {isActive && (
          <Card className="shadow-lg w-64">
            <CardContent className="p-3 space-y-3">
              {/* Mode Selection */}
              <div className="space-y-2">
                <Label className="text-xs">Mode</Label>
                <div className="flex gap-1">
                  <Button
                    variant={brushMode === 'reveal' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setBrushMode('reveal')}
                  >
                    <Paintbrush className="w-3 h-3 mr-1" />
                    Reveal
                  </Button>
                  <Button
                    variant={brushMode === 'hide' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setBrushMode('hide')}
                  >
                    <Eraser className="w-3 h-3 mr-1" />
                    Hide
                  </Button>
                </div>
              </div>

              {/* Shape Selection */}
              <div className="space-y-2">
                <Label className="text-xs">Brush Shape</Label>
                <div className="flex gap-1">
                  <Button
                    variant={brushShape === 'circle' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setBrushShape('circle')}
                  >
                    <Circle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={brushShape === 'square' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setBrushShape('square')}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Brush Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Brush Size</Label>
                  <span className="text-xs text-muted-foreground">{brushSize}px</span>
                </div>
                <Slider
                  value={[brushSize]}
                  onValueChange={(v) => setBrushSize(v[0])}
                  min={20}
                  max={300}
                  step={10}
                  className="w-full"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {isDrawing ? 'Drawing...' : 'Click and drag to paint'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
