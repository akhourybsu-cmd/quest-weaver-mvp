import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resilientChannel } from "@/lib/realtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreVertical, ArrowRight, Trash2, Copy, Send, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WeaponEditor } from "./editors/WeaponEditor";
import { ArmorEditor } from "./editors/ArmorEditor";
import { MagicItemEditor } from "./editors/MagicItemEditor";
import { ConsumableEditor } from "./editors/ConsumableEditor";
import { BasicItemEditor } from "./editors/BasicItemEditor";
import ItemAssignDialog from "./ItemAssignDialog";
import ItemDeleteDialog from "./ItemDeleteDialog";
import { AddItemToSessionDialog } from "@/components/campaign/AddItemToSessionDialog";
import { useToast } from "@/hooks/use-toast";

interface DMItemVaultProps {
  campaignId: string;
  onRefresh: () => void;
}

const rarityColors = {
  Common: "bg-zinc-500",
  Uncommon: "bg-green-500",
  Rare: "bg-blue-500",
  "Very Rare": "bg-purple-500",
  Legendary: "bg-orange-500",
  Artifact: "bg-red-500",
};

const DMItemVault = ({ campaignId, onRefresh }: DMItemVaultProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [weaponEditorOpen, setWeaponEditorOpen] = useState(false);
  const [armorEditorOpen, setArmorEditorOpen] = useState(false);
  const [magicEditorOpen, setMagicEditorOpen] = useState(false);
  const [consumableEditorOpen, setConsumableEditorOpen] = useState(false);
  const [basicEditorOpen, setBasicEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterRarity, setFilterRarity] = useState<string>("ALL");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningItem, setAssigningItem] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string } | null>(null);
  const [addToSessionDialogOpen, setAddToSessionDialogOpen] = useState(false);
  const [addingItem, setAddingItem] = useState<any>(null);

  const loadItems = useCallback(async () => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("name");

    if (data) setItems(data);
  }, [campaignId]);

  useEffect(() => {
    loadItems();

    // Real-time subscription for items
    const channel = resilientChannel(supabase, `items:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          loadItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, loadItems]);

  const handleDeleteClick = (item: any) => {
    setDeletingItem({ id: item.id, name: item.name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (deleteFromInventories: boolean) => {
    if (!deletingItem) return;

    try {
      // CRITICAL: Delete in correct order to avoid foreign key violations
      
      // 1. First delete ALL holding_events for this item (they reference both items and holdings)
      await supabase
        .from("holding_events")
        .delete()
        .eq("item_id", deletingItem.id)
        .throwOnError();

      // 2. Then delete holdings if requested (they reference items)
      if (deleteFromInventories) {
        await supabase
          .from("holdings")
          .delete()
          .eq("item_id", deletingItem.id)
          .throwOnError();
      } else {
        // Even if not deleting from inventories, we need to clear the item_id reference
        // to avoid foreign key constraint when deleting the item
        await supabase
          .from("holdings")
          .update({ item_id: null })
          .eq("item_id", deletingItem.id)
          .throwOnError();
      }

      // 3. Finally delete the item itself
      await supabase
        .from("items")
        .delete()
        .eq("id", deletingItem.id)
        .throwOnError();

      toast({ 
        title: "Item deleted successfully",
        description: deleteFromInventories 
          ? "Item removed from vault and all inventories"
          : "Item removed from vault only"
      });
      await loadItems();
      onRefresh();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({ 
        title: "Error deleting item", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleDuplicate = async (item: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("items")
      .insert({
        campaign_id: campaignId,
        name: `${item.name} (Copy)`,
        type: item.type,
        rarity: item.rarity,
        description: item.description,
        properties: item.properties,
        tags: item.tags,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error duplicating item", variant: "destructive" });
      return;
    }

    toast({ title: "Item duplicated" });
    loadItems();
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === "ALL" || item.type === filterType;
    const matchesRarity = filterRarity === "ALL" || item.rarity === filterRarity;

    return matchesSearch && matchesType && matchesRarity;
  });

  const openEditorForItem = (item: any) => {
    setEditingItem(item);
    const type = item.type;
    if (type === "WEAPON") setWeaponEditorOpen(true);
    else if (type === "ARMOR") setArmorEditorOpen(true);
    else if (type === "MAGIC") setMagicEditorOpen(true);
    else if (type === "CONSUMABLE") setConsumableEditorOpen(true);
    else setBasicEditorOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Item
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background">
            <DropdownMenuItem onClick={() => { setEditingItem(null); setWeaponEditorOpen(true); }}>
              ⚔️ Create Weapon
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingItem(null); setArmorEditorOpen(true); }}>
              🛡️ Create Armor
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingItem(null); setMagicEditorOpen(true); }}>
              ✨ Create Magic Item
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingItem(null); setConsumableEditorOpen(true); }}>
              🧪 Create Consumable
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingItem(null); setBasicEditorOpen(true); }}>
              📦 Create Basic Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex gap-2">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background text-sm"
        >
          <option value="ALL">All Types</option>
          <option value="MUNDANE">Mundane</option>
          <option value="CONSUMABLE">Consumable</option>
          <option value="MAGIC">Magic</option>
          <option value="WEAPON">Weapon</option>
          <option value="ARMOR">Armor</option>
          <option value="CURRENCY">Currency</option>
        </select>

        <select
          value={filterRarity}
          onChange={(e) => setFilterRarity(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background text-sm"
        >
          <option value="ALL">All Rarities</option>
          <option value="Common">Common</option>
          <option value="Uncommon">Uncommon</option>
          <option value="Rare">Rare</option>
          <option value="Very Rare">Very Rare</option>
          <option value="Legendary">Legendary</option>
          <option value="Artifact">Artifact</option>
        </select>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary">{item.type}</Badge>
                      {item.rarity && (
                        <Badge className={`${rarityColors[item.rarity as keyof typeof rarityColors]} text-white`}>
                          {item.rarity}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setAddingItem(item); setAddToSessionDialogOpen(true); }}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Add to Session Pack
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setAssigningItem(item); setAssignDialogOpen(true); }}>
                        <Send className="w-4 h-4 mr-2" />
                        Assign to Player/Party
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditorForItem(item)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(item)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(item)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.description}
                  </p>
                )}

                {item.properties?.damage && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Damage:</span>{" "}
                    <span className="font-medium">{item.properties.damage} {item.properties.damageType}</span>
                  </div>
                )}

                {(item.properties?.ac || item.properties?.baseAC) && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">AC:</span>{" "}
                    <span className="font-medium">{item.properties.baseAC || item.properties.ac}{item.properties?.dexCap != null ? ` (max Dex +${item.properties.dexCap})` : ""}</span>
                  </div>
                )}

                {item.properties?.bonus && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Bonus:</span>{" "}
                    <span className="font-medium">+{item.properties.bonus}</span>
                  </div>
                )}

                {item.properties?.charges && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Max Charges:</span>{" "}
                    <span className="font-medium">{item.properties.charges.max}</span>
                  </div>
                )}

                {item.properties?.requiresAttunement && (
                  <Badge variant="outline" className="text-xs">Requires Attunement</Badge>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No items found. Create your first item to get started.
            </CardContent>
          </Card>
        )}
      </ScrollArea>

      <WeaponEditor
        open={weaponEditorOpen}
        onOpenChange={setWeaponEditorOpen}
        campaignId={campaignId}
        existingItem={editingItem}
        onSave={() => {
          loadItems();
          onRefresh();
          setEditingItem(null);
        }}
      />

      <ArmorEditor
        open={armorEditorOpen}
        onOpenChange={setArmorEditorOpen}
        campaignId={campaignId}
        existingItem={editingItem}
        onSave={() => {
          loadItems();
          onRefresh();
          setEditingItem(null);
        }}
      />

      <MagicItemEditor
        open={magicEditorOpen}
        onOpenChange={setMagicEditorOpen}
        campaignId={campaignId}
        existingItem={editingItem}
        onSave={() => {
          loadItems();
          onRefresh();
          setEditingItem(null);
        }}
      />

      <ConsumableEditor
        open={consumableEditorOpen}
        onOpenChange={setConsumableEditorOpen}
        campaignId={campaignId}
        existingItem={editingItem}
        onSave={() => {
          loadItems();
          onRefresh();
          setEditingItem(null);
        }}
      />

      <BasicItemEditor
        open={basicEditorOpen}
        onOpenChange={setBasicEditorOpen}
        campaignId={campaignId}
        existingItem={editingItem}
        onSave={() => {
          loadItems();
          onRefresh();
          setEditingItem(null);
        }}
      />

      <ItemAssignDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        item={assigningItem}
        campaignId={campaignId}
        onSuccess={onRefresh}
      />

      <ItemDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemId={deletingItem?.id || null}
        itemName={deletingItem?.name || ""}
        onConfirm={handleDeleteConfirm}
      />

      {addingItem && (
        <AddItemToSessionDialog
          open={addToSessionDialogOpen}
          onOpenChange={setAddToSessionDialogOpen}
          campaignId={campaignId}
          itemType="item"
          itemId={addingItem.id}
          itemName={addingItem.name}
        />
      )}
    </div>
  );
};

export default DMItemVault;
