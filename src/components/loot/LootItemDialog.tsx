import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface LootItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  encounterId?: string;
}

const LootItemDialog = ({ open, onOpenChange, campaignId, encounterId }: LootItemDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [valueGp, setValueGp] = useState("");
  const [isMagic, setIsMagic] = useState(false);
  const [identified, setIdentified] = useState(true);
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!name) {
      toast({
        title: "Missing information",
        description: "Please provide an item name.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("loot_items").insert({
      campaign_id: campaignId,
      encounter_id: encounterId,
      name,
      description,
      quantity: parseInt(quantity) || 1,
      value_gp: parseInt(valueGp) || 0,
      is_magic: isMagic,
      identified,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Loot added!",
      description: `${name} added to party pool.`,
    });

    setName("");
    setDescription("");
    setQuantity("1");
    setValueGp("");
    setIsMagic(false);
    setIdentified(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Loot Item</DialogTitle>
          <DialogDescription>
            Add treasure, equipment, or magic items to the party loot pool.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Item Name</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Potion of Healing"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A small red vial..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value (GP)</Label>
              <Input
                id="value"
                type="number"
                min="0"
                value={valueGp}
                onChange={(e) => setValueGp(e.target.value)}
                placeholder="50"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="magic">Magic Item</Label>
            <Switch id="magic" checked={isMagic} onCheckedChange={setIsMagic} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="identified">Identified</Label>
            <Switch id="identified" checked={identified} onCheckedChange={setIdentified} />
          </div>
          <Button onClick={handleAdd} className="w-full">
            Add to Loot Pool
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LootItemDialog;
