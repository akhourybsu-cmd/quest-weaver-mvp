import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package, Coins, Sparkles, History, Users, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsDM } from "@/hooks/useIsDM";
import ItemEditor from "@/components/inventory/ItemEditor";
import ItemCard from "@/components/inventory/ItemCard";
import HistoryLog from "@/components/inventory/HistoryLog";
import PlayerInventoryOverview from "@/components/inventory/PlayerInventoryOverview";
import GoldManager from "@/components/inventory/GoldManager";
import DMItemVault from "@/components/inventory/DMItemVault";

interface Item {
  id: string;
  name: string;
  type: string;
  rarity: string | null;
  description: string | null;
  properties: any;
  tags: string[];
}

interface Holding {
  id: string;
  item_id: string;
  owner_type: string;
  owner_id: string | null;
  quantity: number;
  is_attuned: boolean;
  attuned_to: string | null;
  notes: string | null;
  items: Item;
}

const Inventory = () => {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get("campaign");
  const { toast } = useToast();
  const { isDM, isLoading: dmLoading } = useIsDM(campaignId);

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      loadInventory();
      loadCurrentCharacter();
    }
  }, [campaignId]);

  const loadCurrentCharacter = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("characters")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("user_id", user.id)
      .single();

    if (data) setCurrentCharacterId(data.id);
  };

  const loadInventory = async () => {
    setLoading(true);
    
    const { data: holdingsData } = await supabase
      .from("holdings")
      .select(`
        *,
        items (*)
      `)
      .eq("campaign_id", campaignId);

    const { data: itemsData } = await supabase
      .from("items")
      .select("*")
      .eq("campaign_id", campaignId);

    if (holdingsData) setHoldings(holdingsData as any);
    if (itemsData) setItems(itemsData);
    setLoading(false);
  };

  const partyHoldings = holdings.filter(h => h.owner_type === "PARTY");
  const myHoldings = holdings.filter(h => 
    h.owner_type === "CHARACTER" && h.owner_id === currentCharacterId
  );

  const filteredPartyHoldings = partyHoldings.filter(h =>
    h.items.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.items.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredMyHoldings = myHoldings.filter(h =>
    h.items.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.items.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalGold = partyHoldings
    .filter(h => h.items.type === "CURRENCY" && h.items.name.toLowerCase().includes("gold"))
    .reduce((sum, h) => sum + Number(h.quantity), 0);

  const totalMagicItems = holdings.filter(h => h.items.type === "MAGIC").length;
  const attunedCount = holdings.filter(h => h.is_attuned).length;

  if (dmLoading || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // DM View
  if (isDM) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">DM Inventory Management</h1>
            <p className="text-muted-foreground">Comprehensive inventory and treasure management</p>
          </div>
        </div>

        <Tabs defaultValue="players" className="space-y-4">
          <TabsList>
            <TabsTrigger value="players">
              <Users className="w-4 h-4 mr-2" />
              Player Inventories
            </TabsTrigger>
            <TabsTrigger value="vault">
              <BookOpen className="w-4 h-4 mr-2" />
              DM Item Vault
            </TabsTrigger>
            <TabsTrigger value="gold">
              <Coins className="w-4 h-4 mr-2" />
              Gold Management
            </TabsTrigger>
            <TabsTrigger value="party">
              Party Stash ({partyHoldings.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <PlayerInventoryOverview
              campaignId={campaignId!}
              onRefresh={loadInventory}
            />
          </TabsContent>

          <TabsContent value="vault">
            <DMItemVault
              campaignId={campaignId!}
              onRefresh={loadInventory}
            />
          </TabsContent>

          <TabsContent value="gold">
            <GoldManager
              campaignId={campaignId!}
              onUpdate={loadInventory}
            />
          </TabsContent>

          <TabsContent value="party" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search party stash..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setEditorOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item to Party
              </Button>
            </div>

            {filteredPartyHoldings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No items in party stash
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPartyHoldings.map((holding) => (
                  <ItemCard
                    key={holding.id}
                    holding={holding}
                    campaignId={campaignId!}
                    onUpdate={loadInventory}
                    currentCharacterId={currentCharacterId}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <HistoryLog campaignId={campaignId!} />
          </TabsContent>
        </Tabs>

        <ItemEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          campaignId={campaignId!}
          onSave={loadInventory}
        />
      </div>
    );
  }

  // Player View
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Party Inventory</h1>
          <p className="text-muted-foreground">Manage items, equipment, and treasure</p>
        </div>
        <Button onClick={() => setEditorOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Party Gold</CardTitle>
            <Coins className="h-4 w-4 text-status-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGold.toLocaleString()} gp</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{holdings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Magic Items</CardTitle>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMagicItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attuned Items</CardTitle>
            <Sparkles className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attunedCount} / 3</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items by name or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="party" className="space-y-4">
        <TabsList>
          <TabsTrigger value="party">
            Party Stash ({partyHoldings.length})
          </TabsTrigger>
          <TabsTrigger value="my-character">
            My Character ({myHoldings.length})
          </TabsTrigger>
          <TabsTrigger value="all-items">
            All Items ({items.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="party" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredPartyHoldings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No items in party stash
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPartyHoldings.map((holding) => (
                <ItemCard
                  key={holding.id}
                  holding={holding}
                  campaignId={campaignId!}
                  onUpdate={loadInventory}
                  currentCharacterId={currentCharacterId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-character" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredMyHoldings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No items in your inventory
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMyHoldings.map((holding) => (
                <ItemCard
                  key={holding.id}
                  holding={holding}
                  campaignId={campaignId!}
                  onUpdate={loadInventory}
                  currentCharacterId={currentCharacterId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-items" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items
              .filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      {item.rarity && (
                        <Badge variant="outline">{item.rarity}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge>{item.type}</Badge>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <HistoryLog campaignId={campaignId!} />
        </TabsContent>
      </Tabs>

      <ItemEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        campaignId={campaignId!}
        onSave={loadInventory}
      />
    </div>
  );
};

export default Inventory;
