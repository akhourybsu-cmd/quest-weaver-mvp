import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, GripVertical, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";

interface Era {
  id: string;
  name: string;
  sort_order: number;
  description: string | null;
}

interface EraManagerProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onErasChange?: () => void;
}

export default function EraManager({ campaignId, open, onOpenChange, onErasChange }: EraManagerProps) {
  const [eras, setEras] = useState<Era[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEraName, setNewEraName] = useState("");
  const [newEraDesc, setNewEraDesc] = useState("");

  useEffect(() => {
    if (open) {
      loadEras();
    }
  }, [open, campaignId]);

  const loadEras = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("campaign_eras")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setEras(data || []);
    } catch (error: any) {
      toast.error("Failed to load eras: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEra = async () => {
    if (!newEraName.trim()) {
      toast.error("Era name is required");
      return;
    }

    try {
      const maxOrder = eras.length > 0 ? Math.max(...eras.map(e => e.sort_order)) : -1;
      
      const { error } = await supabase.from("campaign_eras").insert({
        campaign_id: campaignId,
        name: newEraName.trim(),
        description: newEraDesc.trim() || null,
        sort_order: maxOrder + 1
      });

      if (error) throw error;
      
      setNewEraName("");
      setNewEraDesc("");
      await loadEras();
      onErasChange?.();
      toast.success("Era added");
    } catch (error: any) {
      toast.error("Failed to add era: " + error.message);
    }
  };

  const handleDeleteEra = async (eraId: string) => {
    try {
      const { error } = await supabase
        .from("campaign_eras")
        .delete()
        .eq("id", eraId);

      if (error) throw error;
      
      await loadEras();
      onErasChange?.();
      toast.success("Era deleted");
    } catch (error: any) {
      toast.error("Failed to delete era: " + error.message);
    }
  };

  const handleMoveEra = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === eras.length - 1)
    ) {
      return;
    }

    const newEras = [...eras];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    // Swap sort_order values
    const temp = newEras[index].sort_order;
    newEras[index].sort_order = newEras[targetIndex].sort_order;
    newEras[targetIndex].sort_order = temp;
    
    // Swap positions
    [newEras[index], newEras[targetIndex]] = [newEras[targetIndex], newEras[index]];

    try {
      // Update both eras
      await Promise.all([
        supabase.from("campaign_eras").update({ sort_order: newEras[index].sort_order }).eq("id", newEras[index].id),
        supabase.from("campaign_eras").update({ sort_order: newEras[targetIndex].sort_order }).eq("id", newEras[targetIndex].id)
      ]);
      
      setEras(newEras);
      onErasChange?.();
    } catch (error: any) {
      toast.error("Failed to reorder: " + error.message);
      loadEras(); // Reload on error
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md fantasy-border-brass">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-cinzel">
            <Clock className="h-5 w-5 text-amber-500" />
            Manage Eras
          </DialogTitle>
          <DialogDescription>
            Define and order the eras of your world's history. Earlier eras should be at the top.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Era */}
          <div className="space-y-2 p-3 bg-card/50 rounded-lg border border-brass/20">
            <Label>Add New Era</Label>
            <Input
              value={newEraName}
              onChange={(e) => setNewEraName(e.target.value)}
              placeholder="Era name (e.g., Age of Dragons)"
              className="bg-background/50"
            />
            <Input
              value={newEraDesc}
              onChange={(e) => setNewEraDesc(e.target.value)}
              placeholder="Description (optional)"
              className="bg-background/50"
            />
            <Button onClick={handleAddEra} size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Era
            </Button>
          </div>

          {/* Era List */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase">Era Order (earliest first)</Label>
            <ScrollArea className="h-[250px]">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
              ) : eras.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No eras defined yet. Add your first era above.
                </p>
              ) : (
                <div className="space-y-2 pr-2">
                  {eras.map((era, index) => (
                    <div
                      key={era.id}
                      className="flex items-center gap-2 p-2 bg-card/50 rounded-lg border border-brass/20"
                    >
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => handleMoveEra(index, "up")}
                          disabled={index === 0}
                        >
                          <GripVertical className="h-3 w-3 rotate-180" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => handleMoveEra(index, "down")}
                          disabled={index === eras.length - 1}
                        >
                          <GripVertical className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{era.name}</p>
                        {era.description && (
                          <p className="text-xs text-muted-foreground truncate">{era.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                        #{index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteEra(era.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}