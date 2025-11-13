import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Currency } from "@/lib/itemConstants";
import { ITEM_TEMPLATES } from "@/lib/itemTemplates";
import { ItemNameSection } from "./shared/ItemNameSection";
import { CurrencyFields } from "./shared/CurrencyFields";
import { DescriptionFields } from "./shared/DescriptionFields";
import { CommonItemFields } from "./shared/CommonItemFields";

interface MagicItemEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  existingItem?: any;
  onSave: () => void;
}

export const MagicItemEditor = ({ open, onOpenChange, campaignId, existingItem, onSave }: MagicItemEditorProps) => {
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
  
  const [rarity, setRarity] = useState("Common");
  const [requiresAttunement, setRequiresAttunement] = useState(false);
  const [attunementText, setAttunementText] = useState("");
  const [bonus, setBonus] = useState("");
  const [maxCharges, setMaxCharges] = useState("");
  const [currentCharges, setCurrentCharges] = useState("");
  const [rechargeExpression, setRechargeExpression] = useState("1d6+1 at dawn");
  const [category, setCategory] = useState("Wondrous Item");

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
    
    setRarity(item.rarity || "Common");
    setRequiresAttunement(p.requiresAttunement || false);
    setAttunementText(p.attunementText || "");
    setBonus(p.bonus?.toString() || "");
    setMaxCharges(p.charges?.max?.toString() || "");
    setCurrentCharges(p.charges?.current?.toString() || "");
    setRechargeExpression(p.rechargeExpression || "1d6+1 at dawn");
    setCategory(p.magicCategory || p.category || "Wondrous Item");
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
    setRarity("Common");
    setRequiresAttunement(false);
    setAttunementText("");
    setBonus("");
    setMaxCharges("");
    setCurrentCharges("");
    setRechargeExpression("1d6+1 at dawn");
    setCategory("Wondrous Item");
  };

  const loadTemplate = (templateName: string) => {
    const template = ITEM_TEMPLATES.wondrous[templateName as keyof typeof ITEM_TEMPLATES.wondrous];
    if (template) {
      setName(templateName);
      setRarity(template.rarity || "Common");
      setCategory(template.category || "Wondrous Item");
      setCurrency(template.currency || { cp: 0, sp: 0, gp: 0, pp: 0 });
      setWeight(template.weight?.toString() || "");
      setRequiresAttunement((template as any).requiresAttunement || false);
      setBonus((template as any).bonus?.toString() || "");
      setDescription(template.description || "");
      toast({ title: "Template loaded" });
    }
  };

  const handleSave = async () => {
    if (!name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    const properties = {
      magicCategory: category,
      category,
      requiresAttunement,
      attunementText,
      bonus: bonus ? parseInt(bonus) : undefined,
      playerDescription,
      gmNotes,
      currency,
      weight: weight ? parseFloat(weight) : undefined,
      quantity: quantity ? parseFloat(quantity) : 1,
      material,
      rechargeExpression,
    };

    if (maxCharges) {
      (properties as any).charges = {
        max: parseInt(maxCharges),
        current: currentCharges ? parseInt(currentCharges) : parseInt(maxCharges),
      };
    }

    const itemData = {
      campaign_id: campaignId,
      name,
      type: "MAGIC",
      rarity,
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
        toast({ title: "Magic item updated successfully" });
      } else {
        const { error } = await supabase
          .from("items")
          .insert(itemData);
        if (error) throw error;
        toast({ title: "Magic item created successfully" });
      }

      onSave();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error saving magic item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>{existingItem ? "Edit Magic Item" : "Create Magic Item"}</DialogTitle>
          <DialogDescription>Configure magic item properties and effects</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            <ItemNameSection name={name} setName={setName} />

            {!existingItem && (
              <div className="space-y-2">
                <Label>Quick Start Template (Optional)</Label>
                <Select onValueChange={loadTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(ITEM_TEMPLATES.wondrous).map((itemName) => (
                      <SelectItem key={itemName} value={itemName}>
                        {itemName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wondrous Item">Wondrous Item</SelectItem>
                    <SelectItem value="Ring">Ring</SelectItem>
                    <SelectItem value="Rod">Rod</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Wand">Wand</SelectItem>
                    <SelectItem value="Potion">Potion</SelectItem>
                    <SelectItem value="Scroll">Scroll</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rarity *</Label>
                <Select value={rarity} onValueChange={setRarity}>
                  <SelectTrigger>
                    <SelectValue />
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
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="attunement"
                  checked={requiresAttunement}
                  onCheckedChange={setRequiresAttunement}
                />
                <Label htmlFor="attunement">Requires Attunement</Label>
              </div>

              {requiresAttunement && (
                <div className="space-y-2">
                  <Label>Attunement Requirements (Optional)</Label>
                  <Input
                    value={attunementText}
                    onChange={(e) => setAttunementText(e.target.value)}
                    placeholder="by a spellcaster, by a cleric, etc."
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bonus (Optional)</Label>
                <Input
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  placeholder="+1, +2, etc."
                />
              </div>

              <div className="space-y-2">
                <Label>Max Charges (Optional)</Label>
                <Input
                  type="number"
                  value={maxCharges}
                  onChange={(e) => {
                    setMaxCharges(e.target.value);
                    if (!currentCharges) setCurrentCharges(e.target.value);
                  }}
                  placeholder="10"
                />
              </div>
            </div>

            {maxCharges && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Charges</Label>
                  <Input
                    type="number"
                    value={currentCharges}
                    onChange={(e) => setCurrentCharges(e.target.value)}
                    placeholder="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Recharge Expression</Label>
                  <Input
                    value={rechargeExpression}
                    onChange={(e) => setRechargeExpression(e.target.value)}
                    placeholder="1d6+1 at dawn"
                  />
                </div>
              </div>
            )}

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
            {existingItem ? "Update Magic Item" : "Create Magic Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
