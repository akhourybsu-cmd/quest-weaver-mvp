import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Currency, CONSUMABLE_SUBTYPES } from "@/lib/itemConstants";
import { ITEM_TEMPLATES } from "@/lib/itemTemplates";
import { ItemNameSection } from "./shared/ItemNameSection";
import { CurrencyFields } from "./shared/CurrencyFields";
import { DescriptionFields } from "./shared/DescriptionFields";
import { CommonItemFields } from "./shared/CommonItemFields";

interface ConsumableEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  existingItem?: any;
  onSave: () => void;
}

export const ConsumableEditor = ({ open, onOpenChange, campaignId, existingItem, onSave }: ConsumableEditorProps) => {
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
  
  const [consumableSubtype, setConsumableSubtype] = useState("");
  const [activationTime, setActivationTime] = useState("Action");
  const [doses, setDoses] = useState("1");
  const [healingAmount, setHealingAmount] = useState("");
  const [effectType, setEffectType] = useState("");
  
  // Scroll-specific
  const [scrollSpell, setScrollSpell] = useState("");
  const [scrollLevel, setScrollLevel] = useState("");
  const [scrollCheckDC, setScrollCheckDC] = useState("");
  
  // Poison-specific
  const [poisonType, setPoisonType] = useState("");
  const [saveDC, setSaveDC] = useState("");
  const [saveType, setSaveType] = useState("CON");
  const [consumableDamage, setConsumableDamage] = useState("");
  const [consumableDamageType, setConsumableDamageType] = useState("poison");

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
    
    setConsumableSubtype(p.consumableSubtype || "");
    setActivationTime(p.activationTime || p.consumableActivation || "Action");
    setDoses(p.doses?.toString() || "1");
    setHealingAmount(p.healingAmount || "");
    setEffectType(p.effectType || "");
    setScrollSpell(p.scrollSpell || "");
    setScrollLevel(p.scrollLevel?.toString() || "");
    setScrollCheckDC(p.scrollCheckDC?.toString() || p.checkDC?.toString() || "");
    setPoisonType(p.poisonType || "");
    setSaveDC(p.saveDC?.toString() || "");
    setSaveType(p.saveType || "CON");
    setConsumableDamage(p.consumableDamage || "");
    setConsumableDamageType(p.consumableDamageType || "poison");
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
    setConsumableSubtype("");
    setActivationTime("Action");
    setDoses("1");
    setHealingAmount("");
    setEffectType("");
    setScrollSpell("");
    setScrollLevel("");
    setScrollCheckDC("");
    setPoisonType("");
    setSaveDC("");
    setSaveType("CON");
    setConsumableDamage("");
    setConsumableDamageType("poison");
  };

  const loadTemplate = (category: string, templateName: string) => {
    const templates = category === "potion" ? ITEM_TEMPLATES.potions : 
                      category === "scroll" ? ITEM_TEMPLATES.scrolls : 
                      ITEM_TEMPLATES.poisons;
    const template = templates[templateName as keyof typeof templates] as any;
    if (template) {
      setName(templateName);
      setConsumableSubtype(template.subtype || "");
      setRarity(template.rarity || "");
      setCurrency(template.currency || { cp: 0, sp: 0, gp: 0, pp: 0 });
      setWeight(template.weight?.toString() || "");
      setActivationTime(template.activationTime || "Action");
      setDoses(template.doses?.toString() || "1");
      
      if (category === "potion") {
        setHealingAmount(template.healingAmount || "");
        setEffectType(template.effectType || "");
      } else if (category === "scroll") {
        setScrollLevel(template.scrollLevel?.toString() || "");
        setScrollCheckDC(template.checkDC?.toString() || "");
      } else if (category === "poison") {
        setPoisonType(template.poisonType || "");
        setSaveDC(template.saveDC?.toString() || "");
        setSaveType(template.saveType || "CON");
        setConsumableDamage(template.consumableDamage || "");
        setConsumableDamageType(template.consumableDamageType || "poison");
      }
      
      toast({ title: "Template loaded" });
    }
  };

  const handleSave = async () => {
    if (!name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    const properties: any = {
      consumableSubtype,
      consumableActivation: activationTime,
      activationTime,
      doses: doses ? parseInt(doses) : 1,
      healingAmount,
      effectType,
      playerDescription,
      gmNotes,
      currency,
      weight: weight ? parseFloat(weight) : undefined,
      quantity: quantity ? parseFloat(quantity) : 1,
      material,
    };

    if (consumableSubtype === "Scroll") {
      properties.scrollSpell = scrollSpell;
      properties.scrollLevel = scrollLevel ? parseInt(scrollLevel) : undefined;
      properties.scrollCheckDC = scrollCheckDC ? parseInt(scrollCheckDC) : undefined;
      properties.requiresCheck = true;
    }

    if (consumableSubtype === "Poison") {
      properties.poisonType = poisonType;
      properties.saveDC = saveDC ? parseInt(saveDC) : undefined;
      properties.saveType = saveType;
      properties.consumableDamage = consumableDamage;
      properties.consumableDamageType = consumableDamageType;
    }

    const itemData = {
      campaign_id: campaignId,
      name,
      type: "CONSUMABLE",
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
        toast({ title: "Consumable updated successfully" });
      } else {
        const { error } = await supabase
          .from("items")
          .insert(itemData);
        if (error) throw error;
        toast({ title: "Consumable created successfully" });
      }

      onSave();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error saving consumable",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>{existingItem ? "Edit Consumable" : "Create Consumable"}</DialogTitle>
          <DialogDescription>Configure consumable properties (potions, scrolls, poisons, etc.)</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            <ItemNameSection name={name} setName={setName} />

            {!existingItem && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Potion Templates</Label>
                  <Select onValueChange={(val) => loadTemplate("potion", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(ITEM_TEMPLATES.potions).map((potionName) => (
                        <SelectItem key={potionName} value={potionName}>
                          {potionName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Scroll Templates</Label>
                  <Select onValueChange={(val) => loadTemplate("scroll", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(ITEM_TEMPLATES.scrolls).map((scrollName) => (
                        <SelectItem key={scrollName} value={scrollName}>
                          {scrollName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Poison Templates</Label>
                  <Select onValueChange={(val) => loadTemplate("poison", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(ITEM_TEMPLATES.poisons).map((poisonName) => (
                        <SelectItem key={poisonName} value={poisonName}>
                          {poisonName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Consumable Type</Label>
                <Select value={consumableSubtype} onValueChange={setConsumableSubtype}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSUMABLE_SUBTYPES.map((subtype) => (
                      <SelectItem key={subtype} value={subtype}>{subtype}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Activation Time</Label>
                <Select value={activationTime} onValueChange={setActivationTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Action">Action</SelectItem>
                    <SelectItem value="Bonus Action">Bonus Action</SelectItem>
                    <SelectItem value="Reaction">Reaction</SelectItem>
                    <SelectItem value="1 Minute">1 Minute</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Doses/Uses</Label>
                <Input
                  type="number"
                  value={doses}
                  onChange={(e) => setDoses(e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>

            {consumableSubtype === "Potion" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Healing Amount</Label>
                    <Input
                      value={healingAmount}
                      onChange={(e) => setHealingAmount(e.target.value)}
                      placeholder="2d4+2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Effect Type</Label>
                    <Input
                      value={effectType}
                      onChange={(e) => setEffectType(e.target.value)}
                      placeholder="healing, buff, etc."
                    />
                  </div>
                </div>
              </>
            )}

            {consumableSubtype === "Scroll" && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Spell Name</Label>
                  <Input
                    value={scrollSpell}
                    onChange={(e) => setScrollSpell(e.target.value)}
                    placeholder="Fireball"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Spell Level</Label>
                  <Input
                    type="number"
                    value={scrollLevel}
                    onChange={(e) => setScrollLevel(e.target.value)}
                    placeholder="3"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check DC</Label>
                  <Input
                    type="number"
                    value={scrollCheckDC}
                    onChange={(e) => setScrollCheckDC(e.target.value)}
                    placeholder="13"
                  />
                </div>
              </div>
            )}

            {consumableSubtype === "Poison" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Poison Type</Label>
                    <Select value={poisonType} onValueChange={setPoisonType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Injury">Injury</SelectItem>
                        <SelectItem value="Ingested">Ingested</SelectItem>
                        <SelectItem value="Contact">Contact</SelectItem>
                        <SelectItem value="Inhaled">Inhaled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Save Type</Label>
                    <Select value={saveType} onValueChange={setSaveType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CON">Constitution</SelectItem>
                        <SelectItem value="WIS">Wisdom</SelectItem>
                        <SelectItem value="DEX">Dexterity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Save DC</Label>
                    <Input
                      type="number"
                      value={saveDC}
                      onChange={(e) => setSaveDC(e.target.value)}
                      placeholder="15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Damage</Label>
                    <Input
                      value={consumableDamage}
                      onChange={(e) => setConsumableDamage(e.target.value)}
                      placeholder="3d6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Damage Type</Label>
                    <Input
                      value={consumableDamageType}
                      onChange={(e) => setConsumableDamageType(e.target.value)}
                      placeholder="poison"
                    />
                  </div>
                </div>
              </>
            )}

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
            {existingItem ? "Update Consumable" : "Create Consumable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
