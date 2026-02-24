import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Circle, Triangle, Minus, Square, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AoEToolsProps {
  mapId: string;
  encounterId?: string;
  gridSize: number;
  getViewportCenter?: () => { x: number; y: number };
}

interface AoETemplate {
  id: string;
  shape: string;
  label: string;
  radius?: number;
}

const AOE_SHAPES = [
  { value: "circle", label: "Circle/Sphere", icon: Circle, color: "#ef4444" },
  { value: "cone", label: "Cone", icon: Triangle, color: "#f97316" },
  { value: "line", label: "Line", icon: Minus, color: "#eab308" },
  { value: "cube", label: "Cube", icon: Square, color: "#22c55e" },
];

const AoETools = ({ mapId, encounterId, gridSize, getViewportCenter }: AoEToolsProps) => {
  const [shape, setShape] = useState("circle");
  const [radius, setRadius] = useState("20");
  const [label, setLabel] = useState("");
  const [templates, setTemplates] = useState<AoETemplate[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, [mapId]);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from("aoe_templates")
      .select("id, shape, label, radius")
      .eq("map_id", mapId);

    if (data) {
      setTemplates(data);
    }
  };

  const handlePlace = async () => {
    const radiusInPixels = (parseInt(radius) / 5) * gridSize;
    const shapeData = AOE_SHAPES.find(s => s.value === shape);
    const center = getViewportCenter ? getViewportCenter() : { x: 300, y: 200 };

    const { error } = await supabase.from("aoe_templates").insert({
      map_id: mapId,
      encounter_id: encounterId,
      shape,
      x: center.x,
      y: center.y,
      radius: radiusInPixels,
      length: shape === "line" || shape === "cone" ? radiusInPixels * 2 : null,
      width: shape === "line" ? gridSize / 2 : null,
      color: shapeData?.color || "#ef4444",
      opacity: 0.4,
      label: label || `${radius}ft ${shape}`,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "AoE placed",
      description: `${shape} template added at viewport center. Drag to reposition.`,
    });

    setLabel("");
    loadTemplates();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("aoe_templates").delete().eq("id", id);
    if (!error) {
      setTemplates(templates.filter(t => t.id !== id));
      toast({ title: "AoE removed" });
    }
  };

  const handleClearAll = async () => {
    const { error } = await supabase
      .from("aoe_templates")
      .delete()
      .eq("map_id", mapId);

    if (!error) {
      setTemplates([]);
      toast({ title: "All AoE templates cleared" });
    }
  };

  const selectedShape = AOE_SHAPES.find(s => s.value === shape);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AoE Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="aoe-shape">Shape</Label>
          <Select value={shape} onValueChange={setShape}>
            <SelectTrigger id="aoe-shape">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AOE_SHAPES.map((s) => {
                const Icon = s.icon;
                return (
                  <SelectItem key={s.value} value={s.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" style={{ color: s.color }} />
                      <span>{s.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aoe-radius">
            {shape === "line" ? "Length" : shape === "cone" ? "Length" : "Radius"} (feet)
          </Label>
          <Input
            id="aoe-radius"
            type="number"
            min="5"
            step="5"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="aoe-label">Label (optional)</Label>
          <Input
            id="aoe-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Fireball, Spirit Guardians"
          />
        </div>

        <Button onClick={handlePlace} className="w-full">
          <Sparkles className="w-4 h-4 mr-2" />
          Place Template
        </Button>

        {templates.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active ({templates.length})</span>
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
            <ScrollArea className="h-24">
              <div className="space-y-1">
                {templates.map((t) => {
                  const shapeInfo = AOE_SHAPES.find(s => s.value === t.shape);
                  const Icon = shapeInfo?.icon || Circle;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 bg-secondary rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: shapeInfo?.color }} />
                        <span className="text-sm">{t.label}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Templates appear at viewport center. Drag to reposition on the map.
        </div>
      </CardContent>
    </Card>
  );
};

export default AoETools;
