import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Hammer, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CraftingDialogProps {
  campaignId: string;
  characterId: string;
  characterName: string;
}

// XGE magic item crafting costs and times by rarity
const MAGIC_ITEM_CRAFTING: Record<string, { days: number; costGp: number }> = {
  common: { days: 4, costGp: 50 },
  uncommon: { days: 20, costGp: 200 },
  rare: { days: 200, costGp: 2000 },
  very_rare: { days: 2000, costGp: 20000 },
  legendary: { days: 20000, costGp: 100000 },
};

export function CraftingDialog({ campaignId, characterId, characterName }: CraftingDialogProps) {
  const [open, setOpen] = useState(false);
  const [activityType, setActivityType] = useState<'crafting' | 'training'>('crafting');
  const [itemType, setItemType] = useState<'mundane' | 'magic'>('mundane');
  const [itemName, setItemName] = useState("");
  const [itemRarity, setItemRarity] = useState("common");
  const [customCost, setCustomCost] = useState(0);
  const [customDays, setCustomDays] = useState(0);
  const [description, setDescription] = useState("");

  const calculateCosts = () => {
    if (activityType === 'training') {
      return { days: 250, costGp: 250 }; // RAW: 250 days, 1 gp/day
    }
    
    if (itemType === 'mundane') {
      // RAW: 5 gp progress per day
      return { days: Math.ceil(customCost / 5), costGp: customCost };
    }
    
    // Magic item
    return MAGIC_ITEM_CRAFTING[itemRarity] || { days: 4, costGp: 50 };
  };

  const handleStartCrafting = async () => {
    try {
      const { days, costGp } = calculateCosts();

      await supabase.from('downtime_activities').insert({
        campaign_id: campaignId,
        character_id: characterId,
        activity_type: activityType,
        item_name: itemName,
        item_type: itemType,
        item_rarity: itemType === 'magic' ? itemRarity : null,
        total_cost_gp: costGp,
        total_days_required: days,
        days_completed: 0,
        description,
      });

      toast.success(`${characterName} starts ${activityType === 'crafting' ? 'crafting' : 'training'}: ${itemName}`);
      setOpen(false);
      
      // Reset form
      setItemName("");
      setDescription("");
      setCustomCost(0);
      setCustomDays(0);
    } catch (error) {
      console.error('Error starting crafting:', error);
      toast.error("Failed to start crafting");
    }
  };

  const { days, costGp } = calculateCosts();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Hammer className="w-4 h-4" />
          Start Crafting/Training
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hammer className="w-5 h-5" />
            Downtime Activity
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Activity Type */}
          <div className="space-y-2">
            <Label>Activity Type</Label>
            <Select value={activityType} onValueChange={(v: any) => setActivityType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crafting">Crafting</SelectItem>
                <SelectItem value="training">Training (Language/Tool)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activityType === 'crafting' && (
            <>
              {/* Item Type */}
              <div className="space-y-2">
                <Label>Item Type</Label>
                <Select value={itemType} onValueChange={(v: any) => setItemType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mundane">Mundane Item</SelectItem>
                    <SelectItem value="magic">Magic Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {itemType === 'magic' && (
                <div className="space-y-2">
                  <Label>Rarity</Label>
                  <Select value={itemRarity} onValueChange={setItemRarity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="very_rare">Very Rare</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {itemType === 'mundane' && (
                <div className="space-y-2">
                  <Label>Item Market Value (GP)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={customCost}
                    onChange={(e) => setCustomCost(parseInt(e.target.value) || 0)}
                  />
                </div>
              )}
            </>
          )}

          {/* Item/Skill Name */}
          <div className="space-y-2">
            <Label>{activityType === 'crafting' ? 'Item Name' : 'Language/Tool'}</Label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder={activityType === 'crafting' ? 'e.g., Longsword, Potion of Healing' : 'e.g., Elvish, Smith\'s Tools'}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Cost Summary */}
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">Time & Cost</div>
              <div className="text-sm">Days Required: {days}</div>
              <div className="text-sm">Total Cost: {costGp} gp</div>
              <div className="text-xs mt-1 text-muted-foreground">
                {activityType === 'training' 
                  ? 'RAW: 250 days, 1 gp/day (PHB 187)'
                  : itemType === 'mundane'
                  ? 'RAW: 5 gp progress per day (PHB 187)'
                  : 'RAW: XGE magic item crafting (XGE 128-129)'
                }
              </div>
            </AlertDescription>
          </Alert>

          {/* Start Button */}
          <Button
            onClick={handleStartCrafting}
            disabled={!itemName}
            className="w-full"
          >
            Start {activityType === 'crafting' ? 'Crafting' : 'Training'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
