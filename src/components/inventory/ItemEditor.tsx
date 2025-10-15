import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface ItemEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  onSave: () => void;
}

const ItemEditor = ({ open, onOpenChange, campaignId, onSave }: ItemEditorProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState("MUNDANE");
  const [rarity, setRarity] = useState<string>("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [requiresAttunement, setRequiresAttunement] = useState(false);
  const [maxCharges, setMaxCharges] = useState("");
  const [tags, setTags] = useState("");
  const [ownerType, setOwnerType] = useState("PARTY");

  const handleSave = async () => {
    if (!name) {
      toast({
        title: "Missing information",
        description: "Please provide an item name",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create item
    const properties: any = {};
    if (requiresAttunement) {
      properties.requiresAttunement = true;
    }
    if (maxCharges) {
      const charges = parseInt(maxCharges);
      properties.charges = {
        max: charges,
        current: charges,
        recharge: "dawn",
      };
    }

    const { data: item, error: itemError } = await supabase
      .from("items")
      .insert({
        campaign_id: campaignId,
        name,
        type,
        rarity: type === "MAGIC" && rarity ? rarity : null,
        description,
        properties,
        tags: tags.split(",").map((t) => t.trim()).filter((t) => t),
      })
      .select()
      .single();

    if (itemError) {
      toast({
        title: "Error creating item",
        description: itemError.message,
        variant: "destructive",
      });
      return;
    }

    // Create holding
    const { error: holdingError } = await supabase.from("holdings").insert({
      campaign_id: campaignId,
      item_id: item.id,
      owner_type: ownerType,
      owner_id: null,
      quantity: parseFloat(quantity),
    });

    if (holdingError) {
      toast({
        title: "Error creating holding",
        description: holdingError.message,
        variant: "destructive",
      });
      return;
    }

    // Log event
    await supabase.from("holding_events").insert({
      campaign_id: campaignId,
      event_type: "CREATE",
      item_id: item.id,
      to_owner_type: ownerType,
      to_owner_id: null,
      quantity_delta: parseFloat(quantity),
      author_id: user.id,
    });

    toast({ title: "Item created successfully" });
    onSave();
    onOpenChange(false);
    
    // Reset form
    setName("");
    setType("MUNDANE");
    setRarity("");
    setDescription("");
    setQuantity("1");
    setRequiresAttunement(false);
    setMaxCharges("");
    setTags("");
    setOwnerType("PARTY");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Create a new item and add it to the inventory
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Potion of Healing"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MUNDANE">Mundane</SelectItem>
                  <SelectItem value="CONSUMABLE">Consumable</SelectItem>
                  <SelectItem value="MAGIC">Magic</SelectItem>
                  <SelectItem value="CURRENCY">Currency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === "MAGIC" && (
              <div className="space-y-2">
                <Label>Rarity</Label>
                <Select value={rarity} onValueChange={setRarity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rarity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Common">Common</SelectItem>
                    <SelectItem value="Uncommon">Uncommon</SelectItem>
                    <SelectItem value="Rare">Rare</SelectItem>
                    <SelectItem value="Very Rare">Very Rare</SelectItem>
                    <SelectItem value="Legendary">Legendary</SelectItem>
                    <SelectItem value="Artifact">Artifact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A small red vial that restores 2d4+2 hit points..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Add To</Label>
              <Select value={ownerType} onValueChange={setOwnerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARTY">Party Stash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === "MAGIC" && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="attunement">Requires Attunement</Label>
                <Switch
                  id="attunement"
                  checked={requiresAttunement}
                  onCheckedChange={setRequiresAttunement}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="charges">Max Charges (optional)</Label>
                <Input
                  id="charges"
                  type="number"
                  min="1"
                  value={maxCharges}
                  onChange={(e) => setMaxCharges(e.target.value)}
                  placeholder="e.g., 7"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="weapon, longsword, silvered"
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            Create Item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemEditor;
