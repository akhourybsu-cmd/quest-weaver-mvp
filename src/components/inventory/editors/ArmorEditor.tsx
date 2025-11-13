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
import { Currency, ARMOR_CATEGORIES } from "@/lib/itemConstants";
import { ITEM_TEMPLATES } from "@/lib/itemTemplates";
import { ItemNameSection } from "./shared/ItemNameSection";
import { CurrencyFields } from "./shared/CurrencyFields";
import { DescriptionFields } from "./shared/DescriptionFields";
import { CommonItemFields } from "./shared/CommonItemFields";

interface ArmorEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  existingItem?: any;
  onSave: () => void;
}

export const ArmorEditor = ({ open, onOpenChange, campaignId, existingItem, onSave }: ArmorEditorProps) => {
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
  const [rarity, setRarity] = useState("");
  
  const [armorCategory, setArmorCategory] = useState("");
  const [baseAC, setBaseAC] = useState("");
  const [dexCap, setDexCap] = useState("");
  const [armorType, setArmorType] = useState("");
  const [stealthDisadvantage, setStealthDisadvantage] = useState(false);
  const [strengthRequired, setStrengthRequired] = useState("");
  const [donTime, setDonTime] = useState("");
  const [doffTime, setDoffTime] = useState("");
  const [proficiencyGroup, setProficiencyGroup] = useState("");

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
    setRarity(item.rarity || "");
    
    setArmorCategory(p.armorCategory || "");
    setBaseAC(p.baseAC?.toString() || "");
    setDexCap(p.dexCap?.toString() || "");
    setArmorType(p.armorType || "");
    setStealthDisadvantage(p.stealthDisadvantage || false);
    setStrengthRequired(p.strengthRequired?.toString() || "");
    setDonTime(p.armorDonTime || p.donTime || "");
    setDoffTime(p.armorDoffTime || p.doffTime || "");
    setProficiencyGroup(p.proficiencyGroup || "");
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
    setRarity("");
    setArmorCategory("");
    setBaseAC("");
    setDexCap("");
    setArmorType("");
    setStealthDisadvantage(false);
    setStrengthRequired("");
    setDonTime("");
    setDoffTime("");
    setProficiencyGroup("");
  };

  const loadTemplate = (templateName: string) => {
    const template = ITEM_TEMPLATES.armor[templateName as keyof typeof ITEM_TEMPLATES.armor];
    if (template) {
      setName(templateName);
      setArmorCategory(template.category || "");
      setBaseAC(template.baseAC?.toString() || "");
      setDexCap(template.dexCap?.toString() || "");
      setArmorType(template.armorType || "");
      setCurrency(template.currency || { cp: 0, sp: 0, gp: 0, pp: 0 });
      setWeight(template.weight?.toString() || "");
      setStealthDisadvantage((template as any).stealthDisadvantage || false);
      setStrengthRequired((template as any).strengthRequired?.toString() || "");
      setDonTime(template.donTime || "");
      setDoffTime(template.doffTime || "");
      setProficiencyGroup(template.proficiencyGroup || "");
      toast({ title: "Template loaded" });
    }
  };

  const handleSave = async () => {
    if (!name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    const properties = {
      armorCategory,
      baseAC: baseAC ? parseInt(baseAC) : undefined,
      dexCap: dexCap ? parseInt(dexCap) : undefined,
      armorType,
      stealthDisadvantage,
      strengthRequired: strengthRequired ? parseInt(strengthRequired) : undefined,
      armorDonTime: donTime,
      armorDoffTime: doffTime,
      proficiencyGroup,
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
      type: "ARMOR",
      rarity: rarity || null,
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
        toast({ title: "Armor updated successfully" });
      } else {
        const { error } = await supabase
          .from("items")
          .insert(itemData);
        if (error) throw error;
        toast({ title: "Armor created successfully" });
      }

      onSave();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error saving armor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>{existingItem ? "Edit Armor" : "Create Armor"}</DialogTitle>
          <DialogDescription>Configure armor properties and stats</DialogDescription>
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
                    {Object.keys(ITEM_TEMPLATES.armor).map((armorName) => (
                      <SelectItem key={armorName} value={armorName}>
                        {armorName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Armor Category</Label>
                <Select value={armorCategory} onValueChange={setArmorCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARMOR_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Armor Type</Label>
                <Select value={armorType} onValueChange={setArmorType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="heavy">Heavy</SelectItem>
                    <SelectItem value="shield">Shield</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Base AC</Label>
                <Input
                  type="number"
                  value={baseAC}
                  onChange={(e) => setBaseAC(e.target.value)}
                  placeholder="14"
                />
              </div>

              <div className="space-y-2">
                <Label>DEX Cap</Label>
                <Input
                  type="number"
                  value={dexCap}
                  onChange={(e) => setDexCap(e.target.value)}
                  placeholder="2"
                />
              </div>

              <div className="space-y-2">
                <Label>STR Required</Label>
                <Input
                  type="number"
                  value={strengthRequired}
                  onChange={(e) => setStrengthRequired(e.target.value)}
                  placeholder="15"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Don Time</Label>
                <Input
                  value={donTime}
                  onChange={(e) => setDonTime(e.target.value)}
                  placeholder="1 minute, 5 minutes, etc."
                />
              </div>

              <div className="space-y-2">
                <Label>Doff Time</Label>
                <Input
                  value={doffTime}
                  onChange={(e) => setDoffTime(e.target.value)}
                  placeholder="1 minute, 5 minutes, etc."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="stealth"
                checked={stealthDisadvantage}
                onCheckedChange={setStealthDisadvantage}
              />
              <Label htmlFor="stealth">Stealth Disadvantage</Label>
            </div>

            <div className="space-y-2">
              <Label>Proficiency Group</Label>
              <Select value={proficiencyGroup} onValueChange={setProficiencyGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select proficiency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Light Armor">Light Armor</SelectItem>
                  <SelectItem value="Medium Armor">Medium Armor</SelectItem>
                  <SelectItem value="Heavy Armor">Heavy Armor</SelectItem>
                  <SelectItem value="Shields">Shields</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rarity (Optional)</Label>
              <Select value={rarity} onValueChange={setRarity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rarity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="Common">Common</SelectItem>
                  <SelectItem value="Uncommon">Uncommon</SelectItem>
                  <SelectItem value="Rare">Rare</SelectItem>
                  <SelectItem value="Very Rare">Very Rare</SelectItem>
                  <SelectItem value="Legendary">Legendary</SelectItem>
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
            {existingItem ? "Update Armor" : "Create Armor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
