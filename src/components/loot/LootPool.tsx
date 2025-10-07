import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Package, Plus } from "lucide-react";
import LootItemDialog from "./LootItemDialog";

interface LootItem {
  id: string;
  name: string;
  quantity: number;
  valueGp: number;
  identified: boolean;
  isMagic: boolean;
  assignedTo?: string;
}

interface LootPoolProps {
  campaignId: string;
  encounterId?: string;
  isDM: boolean;
}

const LootPool = ({ campaignId, encounterId, isDM }: LootPoolProps) => {
  const [items, setItems] = useState<LootItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const loadLoot = async () => {
      const query = supabase
        .from("loot_items")
        .select("*")
        .eq("campaign_id", campaignId)
        .is("assigned_to_character_id", null);

      if (encounterId) {
        query.eq("encounter_id", encounterId);
      }

      const { data } = await query;

      if (data) {
        setItems(
          data.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            valueGp: item.value_gp,
            identified: item.identified,
            isMagic: item.is_magic,
          }))
        );
      }
    };

    loadLoot();

    const channel = supabase
      .channel(`loot:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loot_items",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => loadLoot()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, encounterId]);

  const totalValue = items.reduce((sum, item) => sum + item.valueGp * item.quantity, 0);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Party Loot Pool
          </CardTitle>
          {isDM && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Loot
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Coins className="w-4 h-4 text-status-warning" />
          <span className="font-semibold">Total Value:</span>
          <span>{totalValue} gp</span>
        </div>

        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No loot in party pool
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Qty: {item.quantity} • {item.valueGp} gp each
                  </div>
                  <div className="flex gap-2 mt-1">
                    {item.isMagic && (
                      <Badge variant="outline" className="text-xs">
                        Magic
                      </Badge>
                    )}
                    {!item.identified && (
                      <Badge variant="outline" className="text-xs">
                        Unidentified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {isDM && (
        <LootItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          campaignId={campaignId}
          encounterId={encounterId}
        />
      )}
    </Card>
  );
};

export default LootPool;
