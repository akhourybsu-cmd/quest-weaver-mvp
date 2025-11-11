import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, AlertTriangle, CheckCircle, Copy, Upload } from "lucide-react";
import { ITEM_CATEGORIES, WEAPON_CATEGORIES, ARMOR_CATEGORIES, MATERIALS, ACTIVATION_TIMES, CONSUMABLE_SUBTYPES, POISON_TYPES, ATTUNEMENT_CLASSES, WEAPON_SUBTYPES, ARMOR_SUBTYPES, CONTROLLED_TAGS, VISIBILITY_OPTIONS, Currency, AttunementPrereq, SpellGrant } from "@/lib/itemConstants";
import { validateItem, ValidationResult } from "@/lib/itemValidation";
import { ITEM_TEMPLATES, getTemplatesByCategory } from "@/lib/itemTemplates";

interface EnhancedItemEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  existingItem?: any;
  onSave: () => void;
}

const EnhancedItemEditor = ({ open, onOpenChange, campaignId, existingItem, onSave }: EnhancedItemEditorProps) => {
  const { toast } = useToast();
  
  // Basic properties (expanded)
  const [name, setName] = useState("");
  const [type, setType] = useState("MUNDANE");
  const [itemCategory, setItemCategory] = useState("");
  const [subtype, setSubtype] = useState("");
  const [proficiencyGroup, setProficiencyGroup] = useState("");
  const [rarity, setRarity] = useState("");
  const [description, setDescription] = useState("");
  const [playerDescription, setPlayerDescription] = useState("");
  const [gmNotes, setGmNotes] = useState("");
  const [tags, setTags] = useState("");
  const [controlledTags, setControlledTags] = useState<string[]>([]);
  const [currency, setCurrency] = useState<Currency>({ cp: 0, sp: 0, gp: 0, pp: 0 });
  const [weight, setWeight] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [bundleSize, setBundleSize] = useState("1");
  const [material, setMaterial] = useState("Standard");
  const [source, setSource] = useState("");
  const [author, setAuthor] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [homebrewId, setHomebrewId] = useState("");
  const [visibility, setVisibility] = useState<string>("draft");
  const [iconUrl, setIconUrl] = useState("");
  const [artistCredit, setArtistCredit] = useState("");
  const [donTime, setDonTime] = useState("");
  const [doffTime, setDoffTime] = useState("");
  const [useTime, setUseTime] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({ valid: true, warnings: [], errors: [] });
  
  // Weapon properties (expanded)
  const [weaponCategory, setWeaponCategory] = useState("");
  const [damage, setDamage] = useState("");
  const [damageType, setDamageType] = useState("");
  const [weaponProperties, setWeaponProperties] = useState<string[]>([]);
  const [attackBonus, setAttackBonus] = useState("");
  const [ammunitionType, setAmmunitionType] = useState("");
  const [ammoConsumption, setAmmoConsumption] = useState("1");
  const [abilityModRule, setAbilityModRule] = useState("STR");
  const [critRange, setCritRange] = useState("20");
  const [specialRules, setSpecialRules] = useState("");
  const [rangeNormal, setRangeNormal] = useState("");
  const [rangeLong, setRangeLong] = useState("");
  const [versatileDamage, setVersatileDamage] = useState("");
  const [offhandEligible, setOffhandEligible] = useState(false);
  
  // Armor properties (expanded)
  const [armorCategory, setArmorCategory] = useState("");
  const [baseAC, setBaseAC] = useState("");
  const [dexCap, setDexCap] = useState("");
  const [armorType, setArmorType] = useState("");
  const [stealthDisadvantage, setStealthDisadvantage] = useState(false);
  const [strengthRequired, setStrengthRequired] = useState("");
  const [shieldBonus, setShieldBonus] = useState("");
  const [armorDonTime, setArmorDonTime] = useState("");
  const [armorDoffTime, setArmorDoffTime] = useState("");
  
  // Magic properties (expanded)
  const [magicCategory, setMagicCategory] = useState("");
  const [requiresAttunement, setRequiresAttunement] = useState(false);
  const [attunementText, setAttunementText] = useState("");
  const [attunementClasses, setAttunementClasses] = useState<string[]>([]);
  const [cursed, setCursed] = useState(false);
  const [curseDetails, setCurseDetails] = useState("");
  const [curseRemoval, setCurseRemoval] = useState("");
  const [activationType, setActivationType] = useState("");
  const [activationTime, setActivationTime] = useState("");
  const [bonus, setBonus] = useState("");
  const [maxCharges, setMaxCharges] = useState("");
  const [currentCharges, setCurrentCharges] = useState("");
  const [rechargeExpression, setRechargeExpression] = useState("1d6+1 at dawn");
  const [usesPerRest, setUsesPerRest] = useState("");
  const [restType, setRestType] = useState("long-rest");
  const [spellDC, setSpellDC] = useState("");
  const [spellAttackBonus, setSpellAttackBonus] = useState("");
  const [dcScaling, setDcScaling] = useState("fixed");
  const [spellGrantText, setSpellGrantText] = useState("");
  const [identified, setIdentified] = useState(true);
  const [unidentifiedDesc, setUnidentifiedDesc] = useState("");
  
  // Consumable properties (expanded)
  const [consumableSubtype, setConsumableSubtype] = useState("");
  const [consumableActivation, setConsumableActivation] = useState("Action");
  const [doses, setDoses] = useState("1");
  const [healingAmount, setHealingAmount] = useState("");
  const [effectDuration, setEffectDuration] = useState("");
  const [effectType, setEffectType] = useState("");
  const [conditionsApplied, setConditionsApplied] = useState("");
  const [abilityBonus, setAbilityBonus] = useState("");
  const [consumableDamage, setConsumableDamage] = useState("");
  const [consumableDamageType, setConsumableDamageType] = useState("");
  const [saveType, setSaveType] = useState("");
  const [saveDC, setSaveDC] = useState("");
  const [targetRange, setTargetRange] = useState("");
  const [aoeType, setAoeType] = useState("");
  const [aoeSize, setAoeSize] = useState("");
  const [friendlyFire, setFriendlyFire] = useState(false);
  const [requiresIdentify, setRequiresIdentify] = useState(false);
  const [craftingIngredients, setCraftingIngredients] = useState("");
  const [craftingTime, setCraftingTime] = useState("");
  const [craftingCost, setCraftingCost] = useState("");
  
  // Poison-specific
  const [poisonType, setPoisonType] = useState("");
  const [poisonOnset, setPoisonOnset] = useState("");
  const [poisonDuration, setPoisonDuration] = useState("");
  const [poisonOnFail, setPoisonOnFail] = useState("");
  const [poisonOnSave, setPoisonOnSave] = useState("");
  
  // Scroll-specific
  const [scrollSpell, setScrollSpell] = useState("");
  const [scrollLevel, setScrollLevel] = useState("");
  const [scrollClassRestriction, setScrollClassRestriction] = useState<string[]>([]);
  const [scrollRequiresCheck, setScrollRequiresCheck] = useState(true);
  const [scrollCheckDC, setScrollCheckDC] = useState("");
  const [scrollFailure, setScrollFailure] = useState("");

  useEffect(() => {
    if (existingItem) {
      loadItem(existingItem);
    } else {
      resetForm();
    }
  }, [existingItem, open]);

  const loadItem = (item: any) => {
    const p = item.properties || {};
    setName(item.name || "");
    setType(item.type || "MUNDANE");
    setItemCategory(p.itemCategory || "");
    setSubtype(p.subtype || "");
    setProficiencyGroup(p.proficiencyGroup || "");
    setRarity(item.rarity || "");
    setDescription(item.description || "");
    setPlayerDescription(p.playerDescription || "");
    setGmNotes(p.gmNotes || "");
    setTags(item.tags?.join(", ") || "");
    setControlledTags(p.controlledTags || []);
    setCurrency(p.currency || { cp: 0, sp: 0, gp: 0, pp: 0 });
    setWeight(p.weight?.toString() || "");
    setQuantity(p.quantity?.toString() || "1");
    setBundleSize(p.bundleSize?.toString() || "1");
    setMaterial(p.material || "Standard");
    setSource(p.source || "");
    setAuthor(p.author || "");
    setVersion(p.version || "1.0.0");
    setHomebrewId(p.homebrewId || "");
    setVisibility(p.visibility || "draft");
    setIconUrl(p.iconUrl || "");
    setArtistCredit(p.artistCredit || "");
    setDonTime(p.donTime || "");
    setDoffTime(p.doffTime || "");
    setUseTime(p.useTime || "");

    // Weapon
    setWeaponCategory(p.weaponCategory || "");
    setDamage(p.damage || "");
    setDamageType(p.damageType || "");
    setWeaponProperties(p.weaponProperties || []);
    setAttackBonus(p.attackBonus?.toString() || "");
    setAmmunitionType(p.ammunitionType || "");
    setAmmoConsumption(p.ammoConsumption?.toString() || "1");
    setAbilityModRule(p.abilityModRule || "STR");
    setCritRange(p.critRange?.toString() || "20");
    setSpecialRules(p.specialRules || "");
    setRangeNormal(p.rangeNormal?.toString() || "");
    setRangeLong(p.rangeLong?.toString() || "");
    setVersatileDamage(p.versatileDamage || "");
    setOffhandEligible(p.offhandEligible || false);

    // Armor
    setArmorCategory(p.armorCategory || "");
    setBaseAC(p.baseAC?.toString() || "");
    setDexCap(p.dexCap?.toString() || "");
    setArmorType(p.armorType || "");
    setStealthDisadvantage(p.stealthDisadvantage || false);
    setStrengthRequired(p.strengthRequired?.toString() || "");
    setShieldBonus(p.shieldBonus?.toString() || "");
    setArmorDonTime(p.armorDonTime || "");
    setArmorDoffTime(p.armorDoffTime || "");

    // Magic
    setMagicCategory(p.magicCategory || "");
    setRequiresAttunement(p.requiresAttunement || false);
    setAttunementText(p.attunementText || "");
    setAttunementClasses(p.attunementClasses || []);
    setCursed(p.cursed || false);
    setCurseDetails(p.curseDetails || "");
    setCurseRemoval(p.curseRemoval || "");
    setActivationType(p.activationType || "");
    setActivationTime(p.activationTime || "");
    setBonus(p.bonus?.toString() || "");
    setMaxCharges(p.charges?.max?.toString() || "");
    setCurrentCharges(p.charges?.current?.toString() || "");
    setRechargeExpression(p.rechargeExpression || "1d6+1 at dawn");
    setUsesPerRest(p.usesPerRest?.toString() || "");
    setRestType(p.restType || "long-rest");
    setSpellDC(p.spellDC?.toString() || "");
    setSpellAttackBonus(p.spellAttackBonus?.toString() || "");
    setDcScaling(p.dcScaling || "fixed");
    setSpellGrantText(p.spellsGranted || "");
    setIdentified(p.identified !== false);
    setUnidentifiedDesc(p.unidentifiedDesc || "");

    // Consumable
    setConsumableSubtype(p.consumableSubtype || "");
    setConsumableActivation(p.consumableActivation || "Action");
    setDoses(p.doses?.toString() || "1");
    setHealingAmount(p.healingAmount || "");
    setEffectDuration(p.effectDuration || "");
    setEffectType(p.effectType || "");
    setConditionsApplied(p.conditionsApplied || "");
    setAbilityBonus(p.abilityBonus || "");
    setConsumableDamage(p.consumableDamage || "");
    setConsumableDamageType(p.consumableDamageType || "");
    setSaveType(p.saveType || "");
    setSaveDC(p.saveDC?.toString() || "");
    setTargetRange(p.targetRange || "");
    setAoeType(p.aoeType || "");
    setAoeSize(p.aoeSize || "");
    setFriendlyFire(p.friendlyFire || false);
    setRequiresIdentify(p.requiresIdentify || false);
    setCraftingIngredients(p.craftingIngredients || "");
    setCraftingTime(p.craftingTime || "");
    setCraftingCost(p.craftingCost?.toString() || "");

    // Poison
    setPoisonType(p.poisonType || "");
    setPoisonOnset(p.poisonOnset || "");
    setPoisonDuration(p.poisonDuration || "");
    setPoisonOnFail(p.poisonOnFail || "");
    setPoisonOnSave(p.poisonOnSave || "");

    // Scroll
    setScrollSpell(p.scrollSpell || "");
    setScrollLevel(p.scrollLevel?.toString() || "");
    setScrollClassRestriction(p.scrollClassRestriction || []);
    setScrollRequiresCheck(p.scrollRequiresCheck !== false);
    setScrollCheckDC(p.scrollCheckDC?.toString() || "");
    setScrollFailure(p.scrollFailure || "");
  };

  const resetForm = () => {
    setName("");
    setType("MUNDANE");
    setItemCategory("");
    setSubtype("");
    setProficiencyGroup("");
    setRarity("");
    setDescription("");
    setPlayerDescription("");
    setGmNotes("");
    setTags("");
    setControlledTags([]);
    setCurrency({ cp: 0, sp: 0, gp: 0, pp: 0 });
    setWeight("");
    setQuantity("1");
    setBundleSize("1");
    setMaterial("Standard");
    setSource("");
    setAuthor("");
    setVersion("1.0.0");
    setHomebrewId("");
    setVisibility("draft");
    setIconUrl("");
    setArtistCredit("");
    setDonTime("");
    setDoffTime("");
    setUseTime("");
    setValidation({ valid: true, warnings: [], errors: [] });

    // Reset weapon
    setWeaponCategory("");
    setDamage("");
    setDamageType("");
    setWeaponProperties([]);
    setAttackBonus("");
    setAmmunitionType("");
    setAmmoConsumption("1");
    setAbilityModRule("STR");
    setCritRange("20");
    setSpecialRules("");
    setRangeNormal("");
    setRangeLong("");
    setVersatileDamage("");
    setOffhandEligible(false);

    // Reset armor
    setArmorCategory("");
    setBaseAC("");
    setDexCap("");
    setArmorType("");
    setStealthDisadvantage(false);
    setStrengthRequired("");
    setShieldBonus("");
    setArmorDonTime("");
    setArmorDoffTime("");

    // Reset magic
    setMagicCategory("");
    setRequiresAttunement(false);
    setAttunementText("");
    setAttunementClasses([]);
    setCursed(false);
    setCurseDetails("");
    setCurseRemoval("");
    setActivationType("");
    setActivationTime("");
    setBonus("");
    setMaxCharges("");
    setCurrentCharges("");
    setRechargeExpression("1d6+1 at dawn");
    setUsesPerRest("");
    setRestType("long-rest");
    setSpellDC("");
    setSpellAttackBonus("");
    setDcScaling("fixed");
    setSpellGrantText("");
    setIdentified(true);
    setUnidentifiedDesc("");

    // Reset consumable
    setConsumableSubtype("");
    setConsumableActivation("Action");
    setDoses("1");
    setHealingAmount("");
    setEffectDuration("");
    setEffectType("");
    setConditionsApplied("");
    setAbilityBonus("");
    setConsumableDamage("");
    setConsumableDamageType("");
    setSaveType("");
    setSaveDC("");
    setTargetRange("");
    setAoeType("");
    setAoeSize("");
    setFriendlyFire(false);
    setRequiresIdentify(false);
    setCraftingIngredients("");
    setCraftingTime("");
    setCraftingCost("");

    // Reset poison
    setPoisonType("");
    setPoisonOnset("");
    setPoisonDuration("");
    setPoisonOnFail("");
    setPoisonOnSave("");

    // Reset scroll
    setScrollSpell("");
    setScrollLevel("");
    setScrollClassRestriction([]);
    setScrollRequiresCheck(true);
    setScrollCheckDC("");
    setScrollFailure("");
  };

  const handleValidate = () => {
    const itemData = buildItemData();
    const result = validateItem(itemData);
    setValidation(result);
    
    if (result.errors.length > 0) {
      toast({ 
        title: "Validation Errors", 
        description: result.errors[0],
        variant: "destructive" 
      });
    } else if (result.warnings.length > 0) {
      toast({ 
        title: "Validation Warnings", 
        description: `${result.warnings.length} warning(s) found. Check validation panel.` 
      });
    } else {
      toast({ title: "Validation passed ✓" });
    }
  };

  const buildItemData = () => {
    const properties: any = {
      itemCategory,
      subtype,
      proficiencyGroup,
      playerDescription,
      gmNotes,
      controlledTags,
      currency,
      weight: weight ? parseFloat(weight) : undefined,
      quantity: quantity ? parseFloat(quantity) : 1,
      bundleSize: bundleSize ? parseInt(bundleSize) : 1,
      material,
      source,
      author,
      version,
      homebrewId,
      visibility,
      iconUrl,
      artistCredit,
      donTime,
      doffTime,
      useTime,
    };

    // Weapon properties
    if (type === "WEAPON" || weaponCategory) {
      properties.weaponCategory = weaponCategory;
      properties.damage = damage;
      properties.damageType = damageType;
      properties.weaponProperties = weaponProperties;
      properties.attackBonus = attackBonus ? parseInt(attackBonus) : undefined;
      properties.ammunitionType = ammunitionType;
      properties.ammoConsumption = ammoConsumption ? parseInt(ammoConsumption) : 1;
      properties.abilityModRule = abilityModRule;
      properties.critRange = critRange ? parseInt(critRange) : 20;
      properties.specialRules = specialRules;
      properties.rangeNormal = rangeNormal ? parseInt(rangeNormal) : undefined;
      properties.rangeLong = rangeLong ? parseInt(rangeLong) : undefined;
      properties.versatileDamage = versatileDamage;
      properties.offhandEligible = offhandEligible;
    }

    // Armor properties
    if (type === "ARMOR" || armorCategory) {
      properties.armorCategory = armorCategory;
      properties.baseAC = baseAC ? parseInt(baseAC) : undefined;
      properties.dexCap = dexCap ? parseInt(dexCap) : undefined;
      properties.armorType = armorType;
      properties.stealthDisadvantage = stealthDisadvantage;
      properties.strengthRequired = strengthRequired ? parseInt(strengthRequired) : undefined;
      properties.shieldBonus = shieldBonus ? parseInt(shieldBonus) : undefined;
      properties.armorDonTime = armorDonTime;
      properties.armorDoffTime = armorDoffTime;
    }

    // Magic properties
    if (type === "MAGIC") {
      properties.magicCategory = magicCategory;
      properties.requiresAttunement = requiresAttunement;
      properties.attunementText = attunementText;
      properties.attunementClasses = attunementClasses;
      properties.cursed = cursed;
      properties.curseDetails = curseDetails;
      properties.curseRemoval = curseRemoval;
      properties.activationType = activationType;
      properties.activationTime = activationTime;
      properties.bonus = bonus ? parseInt(bonus) : undefined;
      if (maxCharges) {
        properties.charges = {
          max: parseInt(maxCharges),
          current: currentCharges ? parseInt(currentCharges) : parseInt(maxCharges),
        };
      }
      properties.rechargeExpression = rechargeExpression;
      properties.usesPerRest = usesPerRest ? parseInt(usesPerRest) : undefined;
      properties.restType = restType;
      properties.spellDC = spellDC ? parseInt(spellDC) : undefined;
      properties.spellAttackBonus = spellAttackBonus ? parseInt(spellAttackBonus) : undefined;
      properties.dcScaling = dcScaling;
      properties.spellsGranted = spellGrantText;
      properties.identified = identified;
      properties.unidentifiedDesc = unidentifiedDesc;
    }

    // Consumable properties
    if (type === "CONSUMABLE") {
      properties.consumableSubtype = consumableSubtype;
      properties.consumableActivation = consumableActivation;
      properties.doses = doses ? parseInt(doses) : 1;
      properties.healingAmount = healingAmount;
      properties.effectDuration = effectDuration;
      properties.effectType = effectType;
      properties.conditionsApplied = conditionsApplied;
      properties.abilityBonus = abilityBonus;
      properties.consumableDamage = consumableDamage;
      properties.consumableDamageType = consumableDamageType;
      properties.saveType = saveType;
      properties.saveDC = saveDC ? parseInt(saveDC) : undefined;
      properties.targetRange = targetRange;
      properties.aoeType = aoeType;
      properties.aoeSize = aoeSize;
      properties.friendlyFire = friendlyFire;
      properties.requiresIdentify = requiresIdentify;
      properties.craftingIngredients = craftingIngredients;
      properties.craftingTime = craftingTime;
      properties.craftingCost = craftingCost ? parseFloat(craftingCost) : undefined;

      // Poison
      if (consumableSubtype === "Poison") {
        properties.poisonType = poisonType;
        properties.poisonOnset = poisonOnset;
        properties.poisonDuration = poisonDuration;
        properties.poisonOnFail = poisonOnFail;
        properties.poisonOnSave = poisonOnSave;
      }

      // Scroll
      if (consumableSubtype === "Scroll") {
        properties.scrollSpell = scrollSpell;
        properties.scrollLevel = scrollLevel ? parseInt(scrollLevel) : undefined;
        properties.scrollClassRestriction = scrollClassRestriction;
        properties.scrollRequiresCheck = scrollRequiresCheck;
        properties.scrollCheckDC = scrollCheckDC ? parseInt(scrollCheckDC) : undefined;
        properties.scrollFailure = scrollFailure;
      }
    }

    return {
      name,
      type,
      rarity: (type === "MAGIC" || type === "WEAPON" || type === "ARMOR") && rarity ? rarity : null,
      description,
      properties,
      tags: tags.split(",").map((t) => t.trim()).filter((t) => t),
      ...properties
    };
  };

  const handleSave = async () => {
    if (!name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    const itemData = {
      campaign_id: campaignId,
      ...buildItemData()
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

  const handleDelete = async () => {
    if (!existingItem) return;

    try {
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", existingItem.id);

      if (error) throw error;

      toast({ title: "Item deleted successfully" });
      onSave();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadTemplate = (templateCategory: string, templateName: string) => {
    const templates = getTemplatesByCategory(templateCategory);
    const template = templates[templateName as keyof typeof templates];
    if (template) {
      Object.entries(template).forEach(([key, value]) => {
        // Map template fields to state setters
        switch(key) {
          case "type": setType(value as string); break;
          case "category": setItemCategory(value as string); break;
          case "subtype": setSubtype(value as string); break;
          case "currency": setCurrency(value as Currency); break;
          case "weight": setWeight(value.toString()); break;
          case "damage": setDamage(value as string); break;
          case "damageType": setDamageType(value as string); break;
          case "weaponProperties": setWeaponProperties(value as string[]); break;
          case "armorType": setArmorType(value as string); break;
          case "baseAC": setBaseAC(value.toString()); break;
          case "rarity": setRarity(value as string); break;
          case "activationTime": setConsumableActivation(value as string); break;
          case "healingAmount": setHealingAmount(value as string); break;
        }
      });
      toast({ title: "Template loaded" });
    }
  };

  const weaponPropertyOptions = [
    "Light", "Finesse", "Thrown", "Two-Handed", "Versatile", "Loading", "Heavy", "Reach", "Special", "Ammunition"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {existingItem ? "Edit Item" : "Create Homebrew Item"}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleValidate}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Validate
              </Button>
              {!validation.valid && (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {validation.errors.length} errors
                </Badge>
              )}
              {validation.warnings.length > 0 && (
                <Badge variant="secondary">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {validation.warnings.length} warnings
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Comprehensive D&D 5e homebrew item creation with RAW validation
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[75vh] pr-4">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="weapon">Weapon</TabsTrigger>
              <TabsTrigger value="armor">Armor</TabsTrigger>
              <TabsTrigger value="magic">Magic</TabsTrigger>
              <TabsTrigger value="consumable">Consumable</TabsTrigger>
            </TabsList>

            {/* BASIC TAB */}
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

              <div className="grid grid-cols-3 gap-4">
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
                    </SelectContent>
                  </Select>
                </div>

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

                <div className="space-y-2">
                  <Label>Subtype/Template</Label>
                  <Input
                    value={subtype}
                    onChange={(e) => setSubtype(e.target.value)}
                    placeholder="Longsword, Chain Shirt, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proficiency Group</Label>
                  <Input
                    value={proficiencyGroup}
                    onChange={(e) => setProficiencyGroup(e.target.value)}
                    placeholder="Simple Weapons, Martial Weapons, etc."
                  />
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

              <Separator />

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>CP</Label>
                  <Input
                    type="number"
                    min="0"
                    value={currency.cp}
                    onChange={(e) => setCurrency({...currency, cp: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SP</Label>
                  <Input
                    type="number"
                    min="0"
                    value={currency.sp}
                    onChange={(e) => setCurrency({...currency, sp: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>GP</Label>
                  <Input
                    type="number"
                    min="0"
                    value={currency.gp}
                    onChange={(e) => setCurrency({...currency, gp: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>PP</Label>
                  <Input
                    type="number"
                    min="0"
                    value={currency.pp}
                    onChange={(e) => setCurrency({...currency, pp: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Weight (lbs)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity/Stack Size</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bundle Size</Label>
                  <Input
                    type="number"
                    min="1"
                    value={bundleSize}
                    onChange={(e) => setBundleSize(e.target.value)}
                    placeholder="e.g., 20 for arrows"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Material/Composition</Label>
                <Select value={material} onValueChange={setMaterial}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIALS.map((mat) => (
                      <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Player Description</Label>
                <Textarea
                  value={playerDescription}
                  onChange={(e) => setPlayerDescription(e.target.value)}
                  placeholder="What players see..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>GM Notes (Private)</Label>
                <Textarea
                  value={gmNotes}
                  onChange={(e) => setGmNotes(e.target.value)}
                  placeholder="Secret information, plot hooks, etc."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Complete item description..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="sword, magical, fire"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Controlled Tags</Label>
                  <div className="border rounded-md p-2 space-y-1 max-h-32 overflow-y-auto">
                    {CONTROLLED_TAGS.slice(0, 8).map((tag) => (
                      <label key={tag} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={controlledTags.includes(tag)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setControlledTags([...controlledTags, tag]);
                            } else {
                              setControlledTags(controlledTags.filter(t => t !== tag));
                            }
                          }}
                        />
                        {tag}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Source/Author</Label>
                  <Input
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Campaign name, DM name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Version</Label>
                  <Input
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIBILITY_OPTIONS.map((vis) => (
                        <SelectItem key={vis} value={vis}>{vis}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Don Time</Label>
                  <Input
                    value={donTime}
                    onChange={(e) => setDonTime(e.target.value)}
                    placeholder="1 action, 1 minute, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Doff Time</Label>
                  <Input
                    value={doffTime}
                    onChange={(e) => setDoffTime(e.target.value)}
                    placeholder="1 action, 1 minute, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Use Time</Label>
                  <Input
                    value={useTime}
                    onChange={(e) => setUseTime(e.target.value)}
                    placeholder="Action, bonus action, etc."
                  />
                </div>
              </div>
            </TabsContent>

            {/* WEAPON TAB */}
            <TabsContent value="weapon" className="space-y-4">
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
                  <Label>Subtype Template</Label>
                  {weaponCategory && WEAPON_SUBTYPES[weaponCategory as keyof typeof WEAPON_SUBTYPES] && (
                    <Select value={subtype} onValueChange={setSubtype}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select weapon" />
                      </SelectTrigger>
                      <SelectContent>
                        {WEAPON_SUBTYPES[weaponCategory as keyof typeof WEAPON_SUBTYPES].map((w) => (
                          <SelectItem key={w} value={w}>{w}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Damage (e.g., 1d8, 2d6)</Label>
                  <Input
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
                      <SelectItem value="force">Force</SelectItem>
                      <SelectItem value="psychic">Psychic</SelectItem>
                      <SelectItem value="thunder">Thunder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Weapon Properties</Label>
                <div className="grid grid-cols-3 gap-2 border rounded-md p-3">
                  {weaponPropertyOptions.map((prop) => (
                    <label key={prop} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={weaponProperties.includes(prop)}
                        onCheckedChange={(checked) => {
                          if (checked) {
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

              {weaponProperties.includes("Ammunition") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ammunition Type</Label>
                    <Input
                      value={ammunitionType}
                      onChange={(e) => setAmmunitionType(e.target.value)}
                      placeholder="Arrows, Bolts, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ammo Consumption (per attack)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={ammoConsumption}
                      onChange={(e) => setAmmoConsumption(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Attack Bonus</Label>
                  <Input
                    type="number"
                    value={attackBonus}
                    onChange={(e) => setAttackBonus(e.target.value)}
                    placeholder="+1, +2, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Critical Range</Label>
                  <Input
                    type="number"
                    min="19"
                    max="20"
                    value={critRange}
                    onChange={(e) => setCritRange(e.target.value)}
                    placeholder="20 (or 19-20 for expanded)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ability Mod</Label>
                  <Select value={abilityModRule} onValueChange={setAbilityModRule}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STR">STR</SelectItem>
                      <SelectItem value="DEX">DEX</SelectItem>
                      <SelectItem value="FINESSE">Finesse (best of STR/DEX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(weaponProperties.includes("Thrown") || weaponProperties.includes("Ammunition")) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Range (Normal)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={rangeNormal}
                      onChange={(e) => setRangeNormal(e.target.value)}
                      placeholder="20, 30, 80, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Range (Long)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={rangeLong}
                      onChange={(e) => setRangeLong(e.target.value)}
                      placeholder="60, 120, 320, etc."
                    />
                  </div>
                </div>
              )}

              {weaponProperties.includes("Versatile") && (
                <div className="space-y-2">
                  <Label>Versatile Damage</Label>
                  <Input
                    value={versatileDamage}
                    onChange={(e) => setVersatileDamage(e.target.value)}
                    placeholder="1d10 (two-handed damage)"
                  />
                </div>
              )}

              {weaponProperties.includes("Special") && (
                <div className="space-y-2">
                  <Label>Special Rules Text</Label>
                  <Textarea
                    value={specialRules}
                    onChange={(e) => setSpecialRules(e.target.value)}
                    placeholder="Describe special weapon mechanics..."
                    rows={3}
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label>Off-hand Eligible (TWF override)</Label>
                <Switch
                  checked={offhandEligible}
                  onCheckedChange={setOffhandEligible}
                />
              </div>

              <div className="space-y-2">
                <Label>Material Interactions</Label>
                <p className="text-sm text-muted-foreground">
                  Material set in Basic tab. Silvered bypasses some resistances; Adamantine armor negates crits; Mithral removes Stealth disadvantage.
                </p>
              </div>
            </TabsContent>

            {/* ARMOR TAB */}
            <TabsContent value="armor" className="space-y-4">
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
                  <Label>Subtype Template</Label>
                  {armorCategory && ARMOR_SUBTYPES[armorCategory as keyof typeof ARMOR_SUBTYPES] && (
                    <Select value={subtype} onValueChange={setSubtype}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select armor" />
                      </SelectTrigger>
                      <SelectContent>
                        {ARMOR_SUBTYPES[armorCategory as keyof typeof ARMOR_SUBTYPES].map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>AC Formula Builder</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Base AC</Label>
                    <Input
                      type="number"
                      min="0"
                      value={baseAC}
                      onChange={(e) => setBaseAC(e.target.value)}
                      placeholder="11, 13, 16, 18, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>DEX Cap</Label>
                    <Input
                      type="number"
                      min="0"
                      value={dexCap}
                      onChange={(e) => setDexCap(e.target.value)}
                      placeholder="2 for medium, 0 for heavy"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Armor Type</Label>
                    <Select value={armorType} onValueChange={setArmorType}>
                      <SelectTrigger>
                        <SelectValue />
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
                <p className="text-sm text-muted-foreground mt-2">
                  Light: base + full DEX | Medium: base + DEX (max +2) | Heavy: base only
                </p>
              </div>

              {armorType === "shield" && (
                <div className="space-y-2">
                  <Label>Shield AC Bonus</Label>
                  <Input
                    type="number"
                    min="0"
                    value={shieldBonus}
                    onChange={(e) => setShieldBonus(e.target.value)}
                    placeholder="2 (standard shield)"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Strength Requirement</Label>
                  <Input
                    type="number"
                    min="0"
                    value={strengthRequired}
                    onChange={(e) => setStrengthRequired(e.target.value)}
                    placeholder="13, 15, etc."
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <Label>Stealth Disadvantage</Label>
                  <Switch
                    checked={stealthDisadvantage}
                    onCheckedChange={setStealthDisadvantage}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Don Time</Label>
                  <Input
                    value={armorDonTime}
                    onChange={(e) => setArmorDonTime(e.target.value)}
                    placeholder="1 minute, 5 minutes, 10 minutes"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Doff Time</Label>
                  <Input
                    value={armorDoffTime}
                    onChange={(e) => setArmorDoffTime(e.target.value)}
                    placeholder="1 minute, 5 minutes"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Material Effects</Label>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Mithral: Removes Stealth disadvantage</p>
                  <p>• Adamantine: Critical hits become normal hits</p>
                  <p>Material set in Basic tab</p>
                </div>
              </div>
            </TabsContent>

            {/* MAGIC TAB */}
            <TabsContent value="magic" className="space-y-4">
              <div className="space-y-2">
                <Label>Magic Item Category</Label>
                <Select value={magicCategory} onValueChange={setMagicCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wondrous Item">Wondrous Item</SelectItem>
                    <SelectItem value="Ring">Ring</SelectItem>
                    <SelectItem value="Rod">Rod</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Wand">Wand</SelectItem>
                    <SelectItem value="Weapon">Weapon (+1/+2/+3)</SelectItem>
                    <SelectItem value="Armor">Armor (+1/+2/+3)</SelectItem>
                    <SelectItem value="Ammunition">Ammunition</SelectItem>
                    <SelectItem value="Potion">Potion</SelectItem>
                    <SelectItem value="Scroll">Scroll</SelectItem>
                    <SelectItem value="Tattoo">Tattoo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Requires Attunement</Label>
                  <p className="text-sm text-muted-foreground">Max 3 attuned items per character</p>
                </div>
                <Switch
                  checked={requiresAttunement}
                  onCheckedChange={setRequiresAttunement}
                />
              </div>

              {requiresAttunement && (
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="space-y-2">
                    <Label>Attunement Prerequisites (Text)</Label>
                    <Input
                      value={attunementText}
                      onChange={(e) => setAttunementText(e.target.value)}
                      placeholder="Requires attunement by a spellcaster"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Class Restrictions</Label>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {ATTUNEMENT_CLASSES.map((cls) => (
                        <label key={cls} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={attunementClasses.includes(cls)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAttunementClasses([...attunementClasses, cls]);
                              } else {
                                setAttunementClasses(attunementClasses.filter(c => c !== cls));
                              }
                            }}
                          />
                          {cls}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Cursed Item</Label>
                  <p className="text-sm text-muted-foreground">Requires Remove Curse to unattune</p>
                </div>
                <Switch
                  checked={cursed}
                  onCheckedChange={setCursed}
                />
              </div>

              {cursed && (
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="space-y-2">
                    <Label>Curse Details</Label>
                    <Textarea
                      value={curseDetails}
                      onChange={(e) => setCurseDetails(e.target.value)}
                      placeholder="Describe the curse effects..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Removal Condition</Label>
                    <Input
                      value={curseRemoval}
                      onChange={(e) => setCurseRemoval(e.target.value)}
                      placeholder="Remove Curse spell, quest completion, etc."
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Activation Type</Label>
                  <Select value={activationType} onValueChange={setActivationType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="command">Command Word</SelectItem>
                      <SelectItem value="use">Use</SelectItem>
                      <SelectItem value="consume">Consume</SelectItem>
                      <SelectItem value="passive">Passive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Activation Time</Label>
                  <Select value={activationTime} onValueChange={setActivationTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVATION_TIMES.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Magic Bonus (+1, +2, +3)</Label>
                <Input
                  type="number"
                  min="0"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  placeholder="1"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Charges</Label>
                  <Input
                    type="number"
                    min="1"
                    value={maxCharges}
                    onChange={(e) => {
                      setMaxCharges(e.target.value);
                      if (!currentCharges) setCurrentCharges(e.target.value);
                    }}
                    placeholder="7"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Charges</Label>
                  <Input
                    type="number"
                    min="0"
                    value={currentCharges}
                    onChange={(e) => setCurrentCharges(e.target.value)}
                    placeholder="7"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Recharge Expression</Label>
                <Input
                  value={rechargeExpression}
                  onChange={(e) => setRechargeExpression(e.target.value)}
                  placeholder="1d6+1 at dawn, 1d4 at dusk, etc."
                />
                <p className="text-xs text-muted-foreground">
                  Supports dice notation: "1d6+1 at dawn", "1d4 at dusk", "all at long rest"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Uses per Rest/Day</Label>
                  <Input
                    type="number"
                    min="0"
                    value={usesPerRest}
                    onChange={(e) => setUsesPerRest(e.target.value)}
                    placeholder="3"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rest Type</Label>
                  <Select value={restType} onValueChange={setRestType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short-rest">Short Rest</SelectItem>
                      <SelectItem value="long-rest">Long Rest</SelectItem>
                      <SelectItem value="dawn">Dawn</SelectItem>
                      <SelectItem value="dusk">Dusk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Spell Save DC</Label>
                  <Input
                    type="number"
                    min="0"
                    value={spellDC}
                    onChange={(e) => setSpellDC(e.target.value)}
                    placeholder="15"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Spell Attack Bonus</Label>
                  <Input
                    type="number"
                    value={spellAttackBonus}
                    onChange={(e) => setSpellAttackBonus(e.target.value)}
                    placeholder="+7"
                  />
                </div>
                <div className="space-y-2">
                  <Label>DC Scaling</Label>
                  <Select value={dcScaling} onValueChange={setDcScaling}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed DC</SelectItem>
                      <SelectItem value="wearer">Wearer's Spell DC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Spells Granted</Label>
                <Textarea
                  value={spellGrantText}
                  onChange={(e) => setSpellGrantText(e.target.value)}
                  placeholder="Fireball (1/day), Shield (3/day at will), Cure Wounds (2 charges)"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Format: "Spell Name (uses/period or charges)"
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Identified</Label>
                  <p className="text-sm text-muted-foreground">Item properties are known</p>
                </div>
                <Switch
                  checked={identified}
                  onCheckedChange={setIdentified}
                />
              </div>

              {!identified && (
                <div className="space-y-2">
                  <Label>Unidentified Description</Label>
                  <Textarea
                    value={unidentifiedDesc}
                    onChange={(e) => setUnidentifiedDesc(e.target.value)}
                    placeholder="A plain silver ring..."
                    rows={2}
                  />
                </div>
              )}
            </TabsContent>

            {/* CONSUMABLE TAB */}
            <TabsContent value="consumable" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Consumable Subtype</Label>
                  <Select value={consumableSubtype} onValueChange={setConsumableSubtype}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subtype" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONSUMABLE_SUBTYPES.map((sub) => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Activation Time</Label>
                  <Select value={consumableActivation} onValueChange={setConsumableActivation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVATION_TIMES.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Doses / Uses</Label>
                <Input
                  type="number"
                  min="1"
                  value={doses}
                  onChange={(e) => setDoses(e.target.value)}
                  placeholder="1"
                />
              </div>

              <Separator />

              {/* SCROLL FIELDS */}
              {consumableSubtype === "Scroll" && (
                <div className="space-y-4 border rounded-lg p-4">
                  <h4 className="font-semibold">Spell Scroll Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Spell Name *</Label>
                      <Input
                        value={scrollSpell}
                        onChange={(e) => setScrollSpell(e.target.value)}
                        placeholder="Fireball"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Spell Level *</Label>
                      <Input
                        type="number"
                        min="0"
                        max="9"
                        value={scrollLevel}
                        onChange={(e) => setScrollLevel(e.target.value)}
                        placeholder="3"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Class Restriction</Label>
                    <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                      {ATTUNEMENT_CLASSES.map((cls) => (
                        <label key={cls} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={scrollClassRestriction.includes(cls)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setScrollClassRestriction([...scrollClassRestriction, cls]);
                              } else {
                                setScrollClassRestriction(scrollClassRestriction.filter(c => c !== cls));
                              }
                            }}
                          />
                          {cls}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label>Requires Ability Check (if spell not on class list)</Label>
                    <Switch
                      checked={scrollRequiresCheck}
                      onCheckedChange={setScrollRequiresCheck}
                    />
                  </div>

                  {scrollRequiresCheck && (
                    <div className="space-y-2">
                      <Label>Check DC</Label>
                      <Input
                        type="number"
                        min="0"
                        value={scrollCheckDC}
                        onChange={(e) => setScrollCheckDC(e.target.value)}
                        placeholder="10 + spell level"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Failure Handling</Label>
                    <Textarea
                      value={scrollFailure}
                      onChange={(e) => setScrollFailure(e.target.value)}
                      placeholder="Scroll is destroyed, spell has no effect"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {/* POISON FIELDS */}
              {consumableSubtype === "Poison" && (
                <div className="space-y-4 border rounded-lg p-4">
                  <h4 className="font-semibold">Poison Configuration</h4>
                  <div className="space-y-2">
                    <Label>Poison Type *</Label>
                    <Select value={poisonType} onValueChange={setPoisonType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {POISON_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Onset Time</Label>
                      <Input
                        value={poisonOnset}
                        onChange={(e) => setPoisonOnset(e.target.value)}
                        placeholder="1 minute, immediate, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input
                        value={poisonDuration}
                        onChange={(e) => setPoisonDuration(e.target.value)}
                        placeholder="1 hour, 24 hours, etc."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Save Type</Label>
                      <Select value={saveType} onValueChange={setSaveType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STR">Strength</SelectItem>
                          <SelectItem value="DEX">Dexterity</SelectItem>
                          <SelectItem value="CON">Constitution</SelectItem>
                          <SelectItem value="INT">Intelligence</SelectItem>
                          <SelectItem value="WIS">Wisdom</SelectItem>
                          <SelectItem value="CHA">Charisma</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Save DC *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={saveDC}
                        onChange={(e) => setSaveDC(e.target.value)}
                        placeholder="15"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>On Failed Save</Label>
                    <Textarea
                      value={poisonOnFail}
                      onChange={(e) => setPoisonOnFail(e.target.value)}
                      placeholder="Target takes 3d6 poison damage and is poisoned for 1 hour"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>On Successful Save</Label>
                    <Textarea
                      value={poisonOnSave}
                      onChange={(e) => setPoisonOnSave(e.target.value)}
                      placeholder="Target takes half damage and is not poisoned"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {/* GENERAL CONSUMABLE FIELDS */}
              <div className="space-y-2">
                <Label>Effect Type</Label>
                <Select value={effectType} onValueChange={setEffectType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select effect type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healing">Healing</SelectItem>
                    <SelectItem value="buff">Buff</SelectItem>
                    <SelectItem value="damage">Damage</SelectItem>
                    <SelectItem value="condition">Apply Condition</SelectItem>
                    <SelectItem value="utility">Utility</SelectItem>
                    <SelectItem value="restoration">Restoration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Healing Amount (e.g., 2d4+2)</Label>
                <Input
                  value={healingAmount}
                  onChange={(e) => setHealingAmount(e.target.value)}
                  placeholder="2d4+2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Damage (e.g., 3d6)</Label>
                  <Input
                    value={consumableDamage}
                    onChange={(e) => setConsumableDamage(e.target.value)}
                    placeholder="3d6"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Damage Type</Label>
                  <Select value={consumableDamageType} onValueChange={setConsumableDamageType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fire">Fire</SelectItem>
                      <SelectItem value="cold">Cold</SelectItem>
                      <SelectItem value="poison">Poison</SelectItem>
                      <SelectItem value="acid">Acid</SelectItem>
                      <SelectItem value="necrotic">Necrotic</SelectItem>
                      <SelectItem value="radiant">Radiant</SelectItem>
                      <SelectItem value="force">Force</SelectItem>
                      <SelectItem value="thunder">Thunder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Conditions Applied</Label>
                <Input
                  value={conditionsApplied}
                  onChange={(e) => setConditionsApplied(e.target.value)}
                  placeholder="Poisoned, Blinded, Invisible"
                />
              </div>

              <div className="space-y-2">
                <Label>Ability Score Bonus</Label>
                <Input
                  value={abilityBonus}
                  onChange={(e) => setAbilityBonus(e.target.value)}
                  placeholder="STR +2, DEX +1"
                />
              </div>

              <div className="space-y-2">
                <Label>Effect Duration</Label>
                <Input
                  value={effectDuration}
                  onChange={(e) => setEffectDuration(e.target.value)}
                  placeholder="1 hour, 8 hours, instantaneous"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target/Range</Label>
                  <Input
                    value={targetRange}
                    onChange={(e) => setTargetRange(e.target.value)}
                    placeholder="Self, Touch, 30 feet"
                  />
                </div>
                <div className="space-y-2">
                  <Label>AoE Type</Label>
                  <Select value={aoeType} onValueChange={setAoeType}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="sphere">Sphere</SelectItem>
                      <SelectItem value="cube">Cube</SelectItem>
                      <SelectItem value="cone">Cone</SelectItem>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="cylinder">Cylinder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {aoeType && aoeType !== "none" && (
                <>
                  <div className="space-y-2">
                    <Label>AoE Size</Label>
                    <Input
                      value={aoeSize}
                      onChange={(e) => setAoeSize(e.target.value)}
                      placeholder="20-foot radius, 60-foot cone, etc."
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label>Friendly Fire (affects allies)</Label>
                    <Switch
                      checked={friendlyFire}
                      onCheckedChange={setFriendlyFire}
                    />
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label>Requires Identify Spell</Label>
                <Switch
                  checked={requiresIdentify}
                  onCheckedChange={setRequiresIdentify}
                />
              </div>

              <div className="space-y-2">
                <Label>Crafting Ingredients</Label>
                <Textarea
                  value={craftingIngredients}
                  onChange={(e) => setCraftingIngredients(e.target.value)}
                  placeholder="Dragon's blood, rare herbs, etc."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Crafting Time</Label>
                  <Input
                    value={craftingTime}
                    onChange={(e) => setCraftingTime(e.target.value)}
                    placeholder="1 day, 1 week, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Crafting Cost (gp)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={craftingCost}
                    onChange={(e) => setCraftingCost(e.target.value)}
                    placeholder="50"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Validation Panel */}
          {(validation.warnings.length > 0 || validation.errors.length > 0) && (
            <div className="mt-4 p-4 border rounded-lg space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Validation Results
              </h4>
              {validation.errors.map((err, i) => (
                <p key={i} className="text-sm text-destructive">❌ {err}</p>
              ))}
              {validation.warnings.map((warn, i) => (
                <p key={i} className="text-sm text-muted-foreground">⚠️ {warn}</p>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between gap-2 pt-4 border-t">
          {existingItem && (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {existingItem ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </div>
      </DialogContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default EnhancedItemEditor;
