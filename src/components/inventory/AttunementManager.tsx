import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Link2, Unlink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AttunedItem {
  id: string;
  item_ref: string;
  data: {
    name?: string;
    rarity?: string;
    description?: string;
  } | null;
  equipped: boolean;
}

interface AttunementManagerProps {
  characterId: string;
  maxSlots?: number;
}

const RARITY_COLORS: Record<string, string> = {
  common: "bg-muted text-muted-foreground",
  uncommon: "bg-green-500/20 text-green-400",
  rare: "bg-blue-500/20 text-blue-400",
  "very rare": "bg-purple-500/20 text-purple-400",
  legendary: "bg-amber-500/20 text-amber-400",
  artifact: "bg-red-500/20 text-red-400",
};

export function AttunementManager({ characterId, maxSlots = 3 }: AttunementManagerProps) {
  const { toast } = useToast();
  const [attunedItems, setAttunedItems] = useState<AttunedItem[]>([]);
  const [availableItems, setAvailableItems] = useState<AttunedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [characterId]);

  const fetchItems = async () => {
    setLoading(true);
    
    // Fetch all equipment that requires attunement
    const { data, error } = await supabase
      .from('character_equipment')
      .select('id, item_ref, data, equipped, attunement_required')
      .eq('character_id', characterId)
      .eq('attunement_required', true);

    if (error) {
      console.error('Error fetching equipment:', error);
      setLoading(false);
      return;
    }

    const items = (data || []) as AttunedItem[];
    
    // Separate attuned vs available (using equipped as attunement proxy for now)
    // In a real implementation, you'd have a separate 'attuned' column
    const attuned = items.filter(i => i.equipped);
    const available = items.filter(i => !i.equipped);
    
    setAttunedItems(attuned);
    setAvailableItems(available);
    setLoading(false);
  };

  const handleAttune = async (item: AttunedItem) => {
    if (attunedItems.length >= maxSlots) {
      toast({
        title: "Attunement Limit",
        description: `You can only attune to ${maxSlots} items at a time.`,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('character_equipment')
      .update({ equipped: true })
      .eq('id', item.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to attune item",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Attuned",
      description: `You are now attuned to ${item.data?.name || item.item_ref}`,
    });
    
    fetchItems();
  };

  const handleUnattune = async (item: AttunedItem) => {
    const { error } = await supabase
      .from('character_equipment')
      .update({ equipped: false })
      .eq('id', item.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to end attunement",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Unattune",
      description: `You ended attunement with ${item.data?.name || item.item_ref}`,
    });
    
    fetchItems();
  };

  const getItemName = (item: AttunedItem) => item.data?.name || item.item_ref;
  const getRarity = (item: AttunedItem) => item.data?.rarity || 'common';

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading attunement...</div>;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Attunement ({attunedItems.length}/{maxSlots})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Attunement Slots */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Attuned Items</p>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: maxSlots }).map((_, idx) => {
              const item = attunedItems[idx];
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border text-center min-h-[60px] flex flex-col items-center justify-center ${
                    item ? 'border-primary/40 bg-primary/5' : 'border-dashed border-muted-foreground/30'
                  }`}
                >
                  {item ? (
                    <>
                      <p className="text-xs font-medium truncate w-full">{getItemName(item)}</p>
                      <Badge className={`text-[10px] mt-1 ${RARITY_COLORS[getRarity(item)]}`}>
                        {getRarity(item)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 text-xs mt-1 text-destructive hover:text-destructive"
                        onClick={() => handleUnattune(item)}
                      >
                        <Unlink className="h-3 w-3 mr-1" />
                        End
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Empty</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Available Items */}
        {availableItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Available to Attune</p>
            <div className="space-y-1">
              {availableItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getItemName(item)}</span>
                    <Badge className={`text-[10px] ${RARITY_COLORS[getRarity(item)]}`}>
                      {getRarity(item)}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => handleAttune(item)}
                    disabled={attunedItems.length >= maxSlots}
                  >
                    <Link2 className="h-3 w-3 mr-1" />
                    Attune
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {attunedItems.length === 0 && availableItems.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No items requiring attunement
          </p>
        )}
      </CardContent>
    </Card>
  );
}
