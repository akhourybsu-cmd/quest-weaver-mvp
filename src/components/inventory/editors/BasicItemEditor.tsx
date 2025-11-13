import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Currency, ITEM_CATEGORIES } from "@/lib/itemConstants";
import { ItemNameSection } from "./shared/ItemNameSection";
import { CurrencyFields } from "./shared/CurrencyFields";
import { DescriptionFields } from "./shared/DescriptionFields";
import { CommonItemFields } from "./shared/CommonItemFields";

interface BasicItemEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  existingItem?: any;
  onSave: () => void;
}

export const BasicItemEditor = ({ open, onOpenChange, campaignId, existingItem, onSave }: BasicItemEditorProps) => {
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [playerDescription, setPlayerDescription] = useState("");
  const [gmNotes, setGmNotes] = useState("");
  const [currency, setCurrency] = useState<Currency>({ cp: 0, sp: 0, gp: 0, pp: 0 });
  const [weight, setWeight] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [material, setMaterial] = useState("Standard");
  const [tags, setTags] = useState("");
  const [itemCategory, setItemCategory] = useState("");

  useEffect(() => {
    if (existingItem && open) {
      loadItem(existingItem);
    } else if (open) {
      resetForm();
    }
  }, [existingItem, open]);

  const loadItem = (item: any) => {
    const p = item.properties || {};
    setName(item.name || "");
    setDescription(item.description || "");
    setPlayerDescription(p.playerDescription || "");
    setGmNotes(p.gmNotes || "");
    setCurrency(p.currency || { cp: 0, sp: 0, gp: 0, pp: 0 });
    setWeight(p.weight?.toString() || "");
    setQuantity(p.quantity?.toString() || "1");
    setMaterial(p.material || "Standard");
    setTags(item.tags?.join(", ") || "");
    setItemCategory(p.itemCategory || p.category || "");
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPlayerDescription("");
    setGmNotes("");
    setCurrency({ cp: 0, sp: 0, gp: 0, pp: 0 });
    setWeight("");
    setQuantity("1");
    setMaterial("Standard");
    setTags("");
    setItemCategory("");
  };

  const handleSave = async () => {
    if (!name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    const properties = {
      itemCategory,
      category: itemCategory,
      playerDescription,
      gmNotes,
      currency,
      weight: weight ? parseFloat(weight) : undefined,
      quantity: quantity ? parseFloat(quantity) : 1,
      material,
    };

    const itemData = {
      campaign_id: campaignId,
      name,
      type: "MUNDANE",
      rarity: null,
      description,
      properties: properties as any,
      tags: tags.split(",").map((t) => t.trim()).filter((t) => t),
    };

    try {
      if (existingItem) {
        const { error } = await supabase
          .from("items")
          .update(itemData)
          .eq("id", existingItem.id);
        if (error) throw error;
        toast({ title: "Item updated successfully" });
      } else {
        const { error } = await supabase
          .from("items")
          .insert(itemData);
        if (error) throw error;
        toast({ title: "Item created successfully" });
      }

      onSave();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error saving item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>{existingItem ? "Edit Basic Item" : "Create Basic Item"}</DialogTitle>
          <DialogDescription>Create mundane items like tools, gear, trade goods, etc.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            <ItemNameSection name={name} setName={setName} />

            <Separator />

            <div className="space-y-2">
              <Label>Item Category</Label>
              <Select value={itemCategory} onValueChange={setItemCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <CurrencyFields currency={currency} setCurrency={setCurrency} />

            <Separator />

            <DescriptionFields
              description={description}
              setDescription={setDescription}
              playerDescription={playerDescription}
              setPlayerDescription={setPlayerDescription}
              gmNotes={gmNotes}
              setGmNotes={setGmNotes}
            />

            <Separator />

            <CommonItemFields
              weight={weight}
              setWeight={setWeight}
              quantity={quantity}
              setQuantity={setQuantity}
              material={material}
              setMaterial={setMaterial}
              tags={tags}
              setTags={setTags}
            />
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {existingItem ? "Update Item" : "Create Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
