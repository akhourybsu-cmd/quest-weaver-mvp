import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Backpack, Coins } from "lucide-react";

interface Holding {
  id: string;
  item_id: string;
  quantity: number;
  is_attuned: boolean;
  owner_type: string;
  owner_id: string;
  items: {
    name: string;
    type: string;
    rarity: string;
    description: string;
  };
}

interface PlayerInventoryProps {
  characterId: string;
  campaignId: string;
}

export function PlayerInventory({ characterId, campaignId }: PlayerInventoryProps) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [currency, setCurrency] = useState({ cp: 0, sp: 0, gp: 0, pp: 0 });

  useEffect(() => {
    fetchHoldings();
    fetchCurrency();

    const channel = supabase
      .channel(`player-inventory:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'holdings',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => fetchHoldings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId, campaignId]);

  const fetchHoldings = async () => {
    const { data } = await supabase
      .from("holdings")
      .select(`
        *,
        items (
          name,
          type,
          rarity,
          description
        )
      `)
      .eq("campaign_id", campaignId)
      .or(`owner_id.eq.${characterId},owner_type.eq.PARTY`);

    if (data) {
      setHoldings(data as any);
    }
  };

  const fetchCurrency = async () => {
    const { data } = await supabase
      .from("characters")
      .select("resources")
      .eq("id", characterId)
      .maybeSingle();

    if (data?.resources && typeof data.resources === 'object' && 'currency' in data.resources) {
      const curr = (data.resources as any).currency;
      setCurrency(curr || { cp: 0, sp: 0, gp: 0, pp: 0 });
    }
  };

  const characterItems = holdings.filter(
    h => h.owner_type === 'CHARACTER' && h.owner_id === characterId
  );
  const partyItems = holdings.filter(h => h.owner_type === 'PARTY');

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      'COMMON': 'bg-slate-500',
      'UNCOMMON': 'bg-green-500',
      'RARE': 'bg-blue-500',
      'VERY RARE': 'bg-purple-500',
      'LEGENDARY': 'bg-orange-500',
      'ARTIFACT': 'bg-red-500',
    };
    return colors[rarity] || 'bg-muted';
  };

  const ItemList = ({ items }: { items: Holding[] }) => (
    <ScrollArea className="h-[300px] pr-4">
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No items</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((holding) => (
            <div
              key={holding.id}
              className="p-3 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-semibold">{holding.items.name}</h5>
                    {holding.quantity > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        x{holding.quantity}
                      </Badge>
                    )}
                    {holding.is_attuned && (
                      <Badge variant="outline" className="text-xs">
                        Attuned
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getRarityColor(holding.items.rarity)}`}
                    >
                      {holding.items.rarity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {holding.items.type}
                    </span>
                  </div>
                  {holding.items.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {holding.items.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Backpack className="w-5 h-5" />
            Inventory
          </CardTitle>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500" />
            <div className="flex gap-2 text-sm font-semibold">
              {currency.pp > 0 && <span className="text-purple-400">{currency.pp}pp</span>}
              {currency.gp > 0 && <span className="text-amber-400">{currency.gp}gp</span>}
              {currency.sp > 0 && <span className="text-slate-300">{currency.sp}sp</span>}
              {currency.cp > 0 && <span className="text-orange-400">{currency.cp}cp</span>}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">
              My Items ({characterItems.length})
            </TabsTrigger>
            <TabsTrigger value="party">
              Party ({partyItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-4">
            <ItemList items={characterItems} />
          </TabsContent>

          <TabsContent value="party" className="mt-4">
            <ItemList items={partyItems} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
