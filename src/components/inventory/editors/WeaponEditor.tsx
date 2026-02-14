import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Currency, WEAPON_CATEGORIES } from "@/lib/itemConstants";
import { ITEM_TEMPLATES } from "@/lib/itemTemplates";
import { ItemNameSection } from "./shared/ItemNameSection";
import { CurrencyFields } from "./shared/CurrencyFields";
import { DescriptionFields } from "./shared/DescriptionFields";
import { CommonItemFields } from "./shared/CommonItemFields";

interface WeaponEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  existingItem?: any;
  onSave: () => void;
}

const weaponPropertyOptions = [
  "Light", "Finesse", "Thrown", "Two-Handed", "Versatile", "Loading", "Heavy", "Reach", "Special", "Ammunition"
];

export const WeaponEditor = ({ open, onOpenChange, campaignId, existingItem, onSave }: WeaponEditorProps) => {
  const { toast } = useToast();
  
  // Basic fields
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
  
  // Weapon-specific fields
  const [weaponCategory, setWeaponCategory] = useState("");
  const [damage, setDamage] = useState("");
  const [damageType, setDamageType] = useState("");
  const [weaponProperties, setWeaponProperties] = useState<string[]>([]);
  const [attackBonus, setAttackBonus] = useState("");
  const [rangeNormal, setRangeNormal] = useState("");
  const [rangeLong, setRangeLong] = useState("");
  const [versatileDamage, setVersatileDamage] = useState("");
  const [ammunitionType, setAmmunitionType] = useState("");
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
    
    setWeaponCategory(p.weaponCategory || "");
    setDamage(p.damage || "");
    setDamageType(p.damageType || "");
    setWeaponProperties(p.weaponProperties || []);
    setAttackBonus(p.attackBonus?.toString() || "");
    setRangeNormal(p.rangeNormal?.toString() || "");
    setRangeLong(p.rangeLong?.toString() || "");
    setVersatileDamage(p.versatileDamage || "");
    setAmmunitionType(p.ammunitionType || "");
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
    setWeaponCategory("");
    setDamage("");
    setDamageType("");
    setWeaponProperties([]);
    setAttackBonus("");
    setRangeNormal("");
    setRangeLong("");
    setVersatileDamage("");
    setAmmunitionType("");
    setProficiencyGroup("");
  };

  const loadTemplate = (templateName: string) => {
    const template = ITEM_TEMPLATES.weapons[templateName as keyof typeof ITEM_TEMPLATES.weapons] as any;
    if (template) {
      setName(templateName);
      setWeaponCategory(template.category || "");
      setDamage(template.damage || "");
      setDamageType(template.damageType || "");
      setWeaponProperties(template.weaponProperties || []);
      setCurrency(template.currency || { cp: 0, sp: 0, gp: 0, pp: 0 });
      setWeight(template.weight?.toString() || "");
      setVersatileDamage(template.versatileDamage || "");
      setRangeNormal(template.rangeNormal?.toString() || "");
      setRangeLong(template.rangeLong?.toString() || "");
      setAmmunitionType(template.ammunitionType || "");
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
      weaponCategory,
      damage,
      damageType,
      weaponProperties,
      attackBonus: attackBonus ? parseInt(attackBonus) : undefined,
      rangeNormal: rangeNormal ? parseInt(rangeNormal) : undefined,
      rangeLong: rangeLong ? parseInt(rangeLong) : undefined,
      versatileDamage,
      ammunitionType,
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
      type: "WEAPON",
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
        toast({ title: "Weapon updated successfully" });
      } else {
        const { error } = await supabase
          .from("items")
          .insert(itemData);
        if (error) throw error;
        toast({ title: "Weapon created successfully" });
      }

      onSave();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error saving weapon",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleProperty = (prop: string) => {
    setWeaponProperties(prev =>
      prev.includes(prop) ? prev.filter(p => p !== prop) : [...prev, prop]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>{existingItem ? "Edit Weapon" : "Create Weapon"}</DialogTitle>
          <DialogDescription>Configure weapon properties and stats</DialogDescription>
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
                    {Object.keys(ITEM_TEMPLATES.weapons).map((weaponName) => (
                      <SelectItem key={weaponName} value={weaponName}>
                        {weaponName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Weapon Category</Label>
                <Select value={weaponCategory} onValueChange={setWeaponCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEAPON_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Proficiency Group</Label>
                <Select value={proficiencyGroup} onValueChange={setProficiencyGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select proficiency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simple">Simple</SelectItem>
                    <SelectItem value="Martial">Martial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Damage Dice</Label>
                <Input
                  value={damage}
                  onChange={(e) => setDamage(e.target.value)}
                  placeholder="1d8, 2d6, etc."
                />
              </div>

              <div className="space-y-2">
                <Label>Damage Type</Label>
                <Select value={damageType} onValueChange={setDamageType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slashing">Slashing</SelectItem>
                    <SelectItem value="piercing">Piercing</SelectItem>
                    <SelectItem value="bludgeoning">Bludgeoning</SelectItem>
                    <SelectItem value="fire">Fire</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                    <SelectItem value="lightning">Lightning</SelectItem>
                    <SelectItem value="thunder">Thunder</SelectItem>
                    <SelectItem value="acid">Acid</SelectItem>
                    <SelectItem value="poison">Poison</SelectItem>
                    <SelectItem value="necrotic">Necrotic</SelectItem>
                    <SelectItem value="radiant">Radiant</SelectItem>
                    <SelectItem value="force">Force</SelectItem>
                    <SelectItem value="psychic">Psychic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Attack Bonus</Label>
                <Input
                  type="number"
                  value={attackBonus}
                  onChange={(e) => setAttackBonus(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Weapon Properties</Label>
              <div className="grid grid-cols-3 gap-3">
                {weaponPropertyOptions.map((prop) => (
                  <div key={prop} className="flex items-center space-x-2">
                    <Checkbox
                      id={prop}
                      checked={weaponProperties.includes(prop)}
                      onCheckedChange={() => toggleProperty(prop)}
                    />
                    <label htmlFor={prop} className="text-sm cursor-pointer">
                      {prop}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {weaponProperties.includes("Versatile") && (
              <div className="space-y-2">
                <Label>Versatile Damage</Label>
                <Input
                  value={versatileDamage}
                  onChange={(e) => setVersatileDamage(e.target.value)}
                  placeholder="1d10"
                />
              </div>
            )}

            {(weaponProperties.includes("Ammunition") || weaponProperties.includes("Thrown")) && (
              <div className="grid grid-cols-3 gap-4">
                {weaponProperties.includes("Ammunition") && (
                  <div className="space-y-2">
                    <Label>Ammunition Type</Label>
                    <Input
                      value={ammunitionType}
                      onChange={(e) => setAmmunitionType(e.target.value)}
                      placeholder="Arrows, Bolts, etc."
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Range (Normal)</Label>
                  <Input
                    type="number"
                    value={rangeNormal}
                    onChange={(e) => setRangeNormal(e.target.value)}
                    placeholder={weaponProperties.includes("Thrown") ? "20" : "80"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Range (Long)</Label>
                  <Input
                    type="number"
                    value={rangeLong}
                    onChange={(e) => setRangeLong(e.target.value)}
                    placeholder={weaponProperties.includes("Thrown") ? "60" : "320"}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Rarity (Optional)</Label>
              <Select value={rarity || "none"} onValueChange={(v) => setRarity(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rarity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
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
            {existingItem ? "Update Weapon" : "Create Weapon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
