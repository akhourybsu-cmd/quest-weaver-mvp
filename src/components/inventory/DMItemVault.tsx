import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus, Search, MoreVertical, ArrowRight, Trash2, Copy, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import EnhancedItemEditor from "./EnhancedItemEditor";
import ItemAssignDialog from "./ItemAssignDialog";
import ItemDeleteDialog from "./ItemDeleteDialog";
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
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterRarity, setFilterRarity] = useState<string>("ALL");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningItem, setAssigningItem] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadItems();
  }, [campaignId]);

  const loadItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("name");

    if (data) setItems(data);
  };

  const handleDeleteClick = (item: any) => {
    setDeletingItem({ id: item.id, name: item.name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (deleteFromInventories: boolean) => {
    if (!deletingItem) return;

    try {
      // CRITICAL: Delete in correct order to avoid foreign key violations
      // 1. First delete holding_events (they reference both items and holdings)
      const { error: eventsError } = await supabase
        .from("holding_events")
        .delete()
        .eq("item_id", deletingItem.id);

      if (eventsError) throw eventsError;

      // 2. Then delete holdings if requested (they reference items)
      if (deleteFromInventories) {
        const { error: holdingsError } = await supabase
          .from("holdings")
          .delete()
          .eq("item_id", deletingItem.id);

        if (holdingsError) throw holdingsError;
      }

      // 3. Finally delete the item itself
      const { error: itemError } = await supabase
        .from("items")
        .delete()
        .eq("id", deletingItem.id);

      if (itemError) throw itemError;

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
        <Button onClick={() => { setEditingItem(null); setEditorOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Item
        </Button>
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
                      <DropdownMenuItem onClick={() => { setAssigningItem(item); setAssignDialogOpen(true); }}>
                        <Send className="w-4 h-4 mr-2" />
                        Assign to Player/Party
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditingItem(item); setEditorOpen(true); }}>
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

                {item.properties?.ac && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">AC:</span>{" "}
                    <span className="font-medium">{item.properties.ac}</span>
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

      <EnhancedItemEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        campaignId={campaignId}
        existingItem={editingItem}
        onSave={() => {
          loadItems();
          onRefresh();
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
    </div>
  );
};

export default DMItemVault;
