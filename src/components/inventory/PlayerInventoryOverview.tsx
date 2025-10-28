import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sparkles, ShieldCheck, Coins, Package, Plus, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import TransferDialog from "./TransferDialog";

interface PlayerInventoryOverviewProps {
  campaignId: string;
  onRefresh: () => void;
}

const rarityColors = {
  Common: "border-l-4 border-l-zinc-500",
  Uncommon: "border-l-4 border-l-green-500",
  Rare: "border-l-4 border-l-blue-500",
  "Very Rare": "border-l-4 border-l-purple-500",
  Legendary: "border-l-4 border-l-orange-500",
  Artifact: "border-l-4 border-l-red-500",
};

const PlayerInventoryOverview = ({ campaignId, onRefresh }: PlayerInventoryOverviewProps) => {
  const [characters, setCharacters] = useState<any[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferHolding, setTransferHolding] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const loadData = async () => {
    setLoading(true);

    // Load all characters in campaign
    const { data: chars } = await supabase
      .from("characters")
      .select("*")
      .eq("campaign_id", campaignId);

    // Load all holdings
    const { data: holdingsData } = await supabase
      .from("holdings")
      .select(`
        *,
        items (*)
      `)
      .eq("campaign_id", campaignId)
      .eq("owner_type", "CHARACTER");

    if (chars) setCharacters(chars);
    if (holdingsData) setHoldings(holdingsData as any);
    setLoading(false);
  };

  const getCharacterHoldings = (characterId: string) => {
    return holdings.filter(h => h.owner_id === characterId);
  };

  const getCharacterGold = (characterId: string) => {
    const charHoldings = getCharacterHoldings(characterId);
    return charHoldings
      .filter(h => h.items.type === "CURRENCY" && h.items.name.toLowerCase().includes("gold"))
      .reduce((sum, h) => sum + Number(h.quantity), 0);
  };

  const getCharacterMagicItems = (characterId: string) => {
    return getCharacterHoldings(characterId).filter(h => h.items.type === "MAGIC");
  };

  const getAttunedItems = (characterId: string) => {
    return getCharacterHoldings(characterId).filter(h => h.is_attuned);
  };

  const getEquippedItems = (characterId: string) => {
    return getCharacterHoldings(characterId).filter(h => 
      h.items.properties?.equipped === true ||
      h.items.type === "MAGIC" && h.items.tags?.includes("equipped")
    );
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading player inventories...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <Accordion type="multiple" className="space-y-4">
          {characters.map((character) => {
            const charHoldings = getCharacterHoldings(character.id);
            const gold = getCharacterGold(character.id);
            const magicItems = getCharacterMagicItems(character.id);
            const attunedItems = getAttunedItems(character.id);
            const equippedItems = getEquippedItems(character.id);

            return (
              <AccordionItem key={character.id} value={character.id} className="border rounded-lg">
                <Card>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-left">{character.name}</h3>
                          <p className="text-sm text-muted-foreground text-left">
                            {character.class} • Level {character.level}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-status-warning" />
                          <span className="font-medium">{gold.toLocaleString()} gp</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{charHoldings.length} items</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-sm">{magicItems.length} magic</span>
                        </div>
                        <Badge variant="secondary">
                          {attunedItems.length}/3 attuned
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="pt-4 space-y-6">
                      {/* Equipped Gear */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" />
                          Equipped Gear
                        </h4>
                        {equippedItems.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No equipped items</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {equippedItems.map((holding) => (
                              <div
                                key={holding.id}
                                className={`p-3 rounded-lg bg-card border ${
                                  holding.items.rarity ? rarityColors[holding.items.rarity as keyof typeof rarityColors] : ""
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">{holding.items.name}</p>
                                      {holding.is_attuned && (
                                        <Sparkles className="w-3 h-3 text-accent" />
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {holding.items.type} {holding.items.rarity && `• ${holding.items.rarity}`}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setTransferHolding(holding)}
                                  >
                                    <ArrowRight className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Magic Items */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Magic Items ({attunedItems.length}/3 attuned)
                        </h4>
                        {magicItems.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No magic items</p>
                        ) : (
                          <ScrollArea className="h-[200px]">
                            <div className="space-y-2 pr-4">
                              {magicItems.map((holding) => (
                                <div
                                  key={holding.id}
                                  className={`p-3 rounded-lg bg-card border ${
                                    holding.items.rarity ? rarityColors[holding.items.rarity as keyof typeof rarityColors] : ""
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm">{holding.items.name}</p>
                                        {holding.is_attuned && (
                                          <Sparkles className="w-3 h-3 text-accent" />
                                        )}
                                        {holding.items.rarity && (
                                          <Badge variant="outline" className="text-xs">
                                            {holding.items.rarity}
                                          </Badge>
                                        )}
                                      </div>
                                      {holding.items.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                          {holding.items.description}
                                        </p>
                                      )}
                                      {holding.items.properties?.charges && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Charges: {holding.items.properties.charges.current}/{holding.items.properties.charges.max}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setTransferHolding(holding)}
                                    >
                                      <ArrowRight className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>

                      {/* All Carried Items */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          All Carried Items
                        </h4>
                        {charHoldings.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No items</p>
                        ) : (
                          <ScrollArea className="h-[200px]">
                            <div className="space-y-2 pr-4">
                              {charHoldings
                                .filter(h => h.items.type !== "CURRENCY")
                                .map((holding) => (
                                  <div
                                    key={holding.id}
                                    className="p-3 rounded-lg bg-card border"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium text-sm">{holding.items.name}</p>
                                          <Badge variant="secondary" className="text-xs">
                                            ×{holding.quantity}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {holding.items.type}
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setTransferHolding(holding)}
                                      >
                                        <ArrowRight className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>

        {characters.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No players have created characters yet
            </CardContent>
          </Card>
        )}
      </div>

      {transferHolding && (
        <TransferDialog
          open={!!transferHolding}
          onOpenChange={(open) => !open && setTransferHolding(null)}
          holding={transferHolding}
          campaignId={campaignId}
          onSuccess={() => {
            loadData();
            onRefresh();
          }}
        />
      )}
    </>
  );
};

export default PlayerInventoryOverview;
