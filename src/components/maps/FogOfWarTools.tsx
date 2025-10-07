import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Square, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FogOfWarToolsProps {
  mapId: string;
  onToolChange: (tool: "reveal" | "hide" | null) => void;
  activeTool: "reveal" | "hide" | null;
}

const FogOfWarTools = ({ mapId, onToolChange, activeTool }: FogOfWarToolsProps) => {
  const { toast } = useToast();

  const handleRevealAll = async () => {
    const { error } = await supabase
      .from("fog_regions")
      .update({ is_hidden: false })
      .eq("map_id", mapId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Fog cleared",
      description: "All areas revealed to players.",
    });
  };

  const handleHideAll = async () => {
    const { error } = await supabase
      .from("fog_regions")
      .update({ is_hidden: true })
      .eq("map_id", mapId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Fog applied",
      description: "All areas hidden from players.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Fog of War (DM Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={activeTool === "reveal" ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange(activeTool === "reveal" ? null : "reveal")}
          >
            <Eye className="w-4 h-4 mr-2" />
            Reveal
          </Button>
          <Button
            variant={activeTool === "hide" ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange(activeTool === "hide" ? null : "hide")}
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Hide
          </Button>
        </div>
        <div className="border-t pt-3 space-y-2">
          <Button variant="outline" size="sm" className="w-full" onClick={handleRevealAll}>
            Reveal All
          </Button>
          <Button variant="outline" size="sm" className="w-full" onClick={handleHideAll}>
            Hide All
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Click and drag on the map to create fog regions. Revealed areas are visible to all players.
        </div>
      </CardContent>
    </Card>
  );
};

export default FogOfWarTools;
