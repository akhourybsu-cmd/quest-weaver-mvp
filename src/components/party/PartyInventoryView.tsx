import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Coins } from "lucide-react";

interface EquipmentItem {
  id: string;
  item_ref: string;
  qty: number | null;
  value_gp: number | null;
  weight: number | null;
  equipped: boolean | null;
  character_name: string;
}

interface PartyInventoryViewProps {
  campaignId: string;
}

export function PartyInventoryView({ campaignId }: PartyInventoryViewProps) {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, [campaignId]);

  const fetchInventory = async () => {
    try {
      // Get all characters in campaign
      const { data: chars } = await supabase
        .from("characters")
        .select("id, name")
        .eq("campaign_id", campaignId)
        .not("user_id", "is", null);

      if (!chars || chars.length === 0) {
        setLoading(false);
        return;
      }

      const charIds = chars.map(c => c.id);
      const charMap = new Map(chars.map(c => [c.id, c.name]));

      const { data: equipment } = await supabase
        .from("character_equipment")
        .select("id, item_ref, qty, value_gp, weight, equipped, character_id")
        .in("character_id", charIds);

      setItems((equipment || []).map(e => ({
        ...e,
        character_name: charMap.get(e.character_id) || "Unknown",
      })));
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading inventory...</div>;
  }

  const totalGold = items.reduce((sum, i) => sum + ((i.value_gp || 0) * (i.qty || 1)), 0);
  const totalWeight = items.reduce((sum, i) => sum + ((i.weight || 0) * (i.qty || 1)), 0);

  // Group by character
  const byCharacter = new Map<string, EquipmentItem[]>();
  items.forEach(i => {
    if (!byCharacter.has(i.character_name)) byCharacter.set(i.character_name, []);
    byCharacter.get(i.character_name)!.push(i);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-arcanePurple" />
        <h3 className="font-cinzel font-bold text-lg">Party Inventory</h3>
      </div>

      {/* Summary bar */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-yellow-500" />
          <span className="font-semibold">{totalGold.toLocaleString()} gp</span>
          <span className="text-muted-foreground">total value</span>
        </div>
        <div className="text-muted-foreground">
          {totalWeight.toFixed(1)} lbs total weight
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="border-brass/20">
          <CardContent className="py-8 text-center text-muted-foreground">
            No equipment found across party members.
          </CardContent>
        </Card>
      ) : (
        Array.from(byCharacter.entries()).map(([charName, charItems]) => (
          <Card key={charName} className="border-brass/20 bg-card/50">
            <CardContent className="p-4">
              <h4 className="font-cinzel font-semibold text-sm mb-2">{charName}</h4>
              <div className="space-y-1">
                {charItems.slice(0, 10).map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">
                      {item.item_ref}
                      {(item.qty || 1) > 1 && <span className="text-muted-foreground ml-1">×{item.qty}</span>}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.equipped && (
                        <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">E</Badge>
                      )}
                      {item.value_gp != null && item.value_gp > 0 && (
                        <span className="text-xs text-muted-foreground">{item.value_gp} gp</span>
                      )}
                    </div>
                  </div>
                ))}
                {charItems.length > 10 && (
                  <p className="text-xs text-muted-foreground">+{charItems.length - 10} more items</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
