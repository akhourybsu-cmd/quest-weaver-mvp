import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EnhancedItemEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  existingItem?: any;
  onSave: () => void;
}

const EnhancedItemEditor = ({ open, onOpenChange, campaignId, existingItem, onSave }: EnhancedItemEditorProps) => {
  const { toast } = useToast();
  
  // Basic properties
  const [name, setName] = useState("");
  const [type, setType] = useState("MUNDANE");
  const [rarity, setRarity] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [value, setValue] = useState("");
  const [weight, setWeight] = useState("");
  
  // Magic properties
  const [requiresAttunement, setRequiresAttunement] = useState(false);
  const [maxCharges, setMaxCharges] = useState("");
  const [rechargeRate, setRechargeRate] = useState("dawn");
  const [bonus, setBonus] = useState("");
  
  // Weapon properties
  const [damage, setDamage] = useState("");
  const [damageType, setDamageType] = useState("");
  const [weaponProperties, setWeaponProperties] = useState<string[]>([]);
  const [attackBonus, setAttackBonus] = useState("");
  
  // Armor properties
  const [ac, setAc] = useState("");
  const [armorType, setArmorType] = useState("");
  const [stealthDisadvantage, setStealthDisadvantage] = useState(false);
  const [strengthRequirement, setStrengthRequirement] = useState("");
  
  // Consumable properties
  const [healingAmount, setHealingAmount] = useState("");
  const [effectDuration, setEffectDuration] = useState("");
  const [saveDC, setSaveDC] = useState("");

  useEffect(() => {
    if (existingItem) {
      setName(existingItem.name || "");
      setType(existingItem.type || "MUNDANE");
      setRarity(existingItem.rarity || "");
      setDescription(existingItem.description || "");
      setTags(existingItem.tags?.join(", ") || "");
      setValue(existingItem.properties?.value || "");
      setWeight(existingItem.properties?.weight || "");
      
      setRequiresAttunement(existingItem.properties?.requiresAttunement || false);
      setMaxCharges(existingItem.properties?.charges?.max || "");
      setRechargeRate(existingItem.properties?.charges?.recharge || "dawn");
      setBonus(existingItem.properties?.bonus || "");
      
      setDamage(existingItem.properties?.damage || "");
      setDamageType(existingItem.properties?.damageType || "");
      setWeaponProperties(existingItem.properties?.weaponProperties || []);
      setAttackBonus(existingItem.properties?.attackBonus || "");
      
      setAc(existingItem.properties?.ac || "");
      setArmorType(existingItem.properties?.armorType || "");
      setStealthDisadvantage(existingItem.properties?.stealthDisadvantage || false);
      setStrengthRequirement(existingItem.properties?.strengthRequirement || "");
      
      setHealingAmount(existingItem.properties?.healingAmount || "");
      setEffectDuration(existingItem.properties?.effectDuration || "");
      setSaveDC(existingItem.properties?.saveDC || "");
    } else {
      resetForm();
    }
  }, [existingItem, open]);

  const resetForm = () => {
    setName("");
    setType("MUNDANE");
    setRarity("");
    setDescription("");
    setTags("");
    setValue("");
    setWeight("");
    setRequiresAttunement(false);
    setMaxCharges("");
    setRechargeRate("dawn");
    setBonus("");
    setDamage("");
    setDamageType("");
    setWeaponProperties([]);
    setAttackBonus("");
    setAc("");
    setArmorType("");
    setStealthDisadvantage(false);
    setStrengthRequirement("");
    setHealingAmount("");
    setEffectDuration("");
    setSaveDC("");
  };

  const handleSave = async () => {
    if (!name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    const properties: any = {
      value: value ? parseFloat(value) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
    };

    if (requiresAttunement) properties.requiresAttunement = true;
    
    if (maxCharges) {
      const charges = parseInt(maxCharges);
      properties.charges = { max: charges, current: charges, recharge: rechargeRate };
    }
    
    if (bonus) properties.bonus = parseInt(bonus);
    
    // Weapon properties
    if (type === "WEAPON" || type === "MAGIC") {
      if (damage) properties.damage = damage;
      if (damageType) properties.damageType = damageType;
      if (weaponProperties.length > 0) properties.weaponProperties = weaponProperties;
      if (attackBonus) properties.attackBonus = parseInt(attackBonus);
    }
    
    // Armor properties
    if (type === "ARMOR" || type === "MAGIC") {
      if (ac) properties.ac = parseInt(ac);
      if (armorType) properties.armorType = armorType;
      if (stealthDisadvantage) properties.stealthDisadvantage = true;
      if (strengthRequirement) properties.strengthRequirement = parseInt(strengthRequirement);
    }
    
    // Consumable properties
    if (type === "CONSUMABLE") {
      if (healingAmount) properties.healingAmount = healingAmount;
      if (effectDuration) properties.effectDuration = effectDuration;
      if (saveDC) properties.saveDC = parseInt(saveDC);
    }

    const itemData = {
      campaign_id: campaignId,
      name,
      type,
      rarity: (type === "MAGIC" || type === "WEAPON" || type === "ARMOR") && rarity ? rarity : null,
      description,
      properties,
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

  const weaponPropertyOptions = [
    "Light", "Finesse", "Thrown", "Two-Handed", "Versatile", "Loading", "Heavy", "Reach", "Special"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{existingItem ? "Edit Item" : "Create Homebrew Item"}</DialogTitle>
          <DialogDescription>
            Create custom items with full D&D 5e attributes
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="weapon">Weapon</TabsTrigger>
              <TabsTrigger value="armor">Armor</TabsTrigger>
              <TabsTrigger value="magic">Magic</TabsTrigger>
              <TabsTrigger value="consumable">Consumable</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sword of Flames"
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
                      <SelectItem value="WEAPON">Weapon</SelectItem>
                      <SelectItem value="ARMOR">Armor</SelectItem>
                      <SelectItem value="CONSUMABLE">Consumable</SelectItem>
                      <SelectItem value="MAGIC">Magic Item</SelectItem>
                      <SelectItem value="CURRENCY">Currency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(type === "MAGIC" || type === "WEAPON" || type === "ARMOR") && (
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
                  placeholder="A beautifully crafted longsword with flames dancing along its blade..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Value (gp)</Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="sword, magical, fire"
                />
              </div>
            </TabsContent>

            <TabsContent value="weapon" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="damage">Damage (e.g., 1d8, 2d6)</Label>
                  <Input
                    id="damage"
                    value={damage}
                    onChange={(e) => setDamage(e.target.value)}
                    placeholder="1d8"
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
                      <SelectItem value="poison">Poison</SelectItem>
                      <SelectItem value="acid">Acid</SelectItem>
                      <SelectItem value="necrotic">Necrotic</SelectItem>
                      <SelectItem value="radiant">Radiant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attackBonus">Attack Bonus (e.g., +1, +2)</Label>
                <Input
                  id="attackBonus"
                  type="number"
                  value={attackBonus}
                  onChange={(e) => setAttackBonus(e.target.value)}
                  placeholder="1"
                />
              </div>

              <div className="space-y-2">
                <Label>Weapon Properties</Label>
                <div className="grid grid-cols-3 gap-2">
                  {weaponPropertyOptions.map((prop) => (
                    <label key={prop} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={weaponProperties.includes(prop)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWeaponProperties([...weaponProperties, prop]);
                          } else {
                            setWeaponProperties(weaponProperties.filter((p) => p !== prop));
                          }
                        }}
                      />
                      {prop}
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="armor" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ac">Armor Class</Label>
                  <Input
                    id="ac"
                    type="number"
                    min="0"
                    value={ac}
                    onChange={(e) => setAc(e.target.value)}
                    placeholder="16"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Armor Type</Label>
                  <Select value={armorType} onValueChange={setArmorType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light Armor</SelectItem>
                      <SelectItem value="medium">Medium Armor</SelectItem>
                      <SelectItem value="heavy">Heavy Armor</SelectItem>
                      <SelectItem value="shield">Shield</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strengthReq">Strength Requirement</Label>
                <Input
                  id="strengthReq"
                  type="number"
                  min="0"
                  value={strengthRequirement}
                  onChange={(e) => setStrengthRequirement(e.target.value)}
                  placeholder="13"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="stealthDis">Stealth Disadvantage</Label>
                <Switch
                  id="stealthDis"
                  checked={stealthDisadvantage}
                  onCheckedChange={setStealthDisadvantage}
                />
              </div>
            </TabsContent>

            <TabsContent value="magic" className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="attunement">Requires Attunement</Label>
                <Switch
                  id="attunement"
                  checked={requiresAttunement}
                  onCheckedChange={setRequiresAttunement}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonus">Magic Bonus</Label>
                <Input
                  id="bonus"
                  type="number"
                  min="0"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  placeholder="1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="charges">Max Charges</Label>
                  <Input
                    id="charges"
                    type="number"
                    min="1"
                    value={maxCharges}
                    onChange={(e) => setMaxCharges(e.target.value)}
                    placeholder="7"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Recharge Rate</Label>
                  <Select value={rechargeRate} onValueChange={setRechargeRate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dawn">Dawn</SelectItem>
                      <SelectItem value="dusk">Dusk</SelectItem>
                      <SelectItem value="long-rest">Long Rest</SelectItem>
                      <SelectItem value="short-rest">Short Rest</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="consumable" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="healing">Healing Amount (e.g., 2d4+2)</Label>
                <Input
                  id="healing"
                  value={healingAmount}
                  onChange={(e) => setHealingAmount(e.target.value)}
                  placeholder="2d4+2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Effect Duration</Label>
                <Input
                  id="duration"
                  value={effectDuration}
                  onChange={(e) => setEffectDuration(e.target.value)}
                  placeholder="1 hour"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="saveDC">Save DC</Label>
                <Input
                  id="saveDC"
                  type="number"
                  min="0"
                  value={saveDC}
                  onChange={(e) => setSaveDC(e.target.value)}
                  placeholder="15"
                />
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSave} className="flex-1">
            {existingItem ? "Update Item" : "Create Item"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedItemEditor;
