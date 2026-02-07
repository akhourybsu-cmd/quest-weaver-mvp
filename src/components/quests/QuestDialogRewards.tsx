import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Coins, Package, X, Plus, Users, Shield } from "lucide-react";
import LoreLinkSelector from "@/components/lore/LoreLinkSelector";

interface RewardItem {
  id: string;
  name: string;
  quantity: number;
}

interface QuestDialogRewardsProps {
  campaignId: string;
  rewardXP: string;
  onRewardXPChange: (val: string) => void;
  rewardGP: string;
  onRewardGPChange: (val: string) => void;
  rewardItems: RewardItem[];
  onRewardItemsChange: (items: RewardItem[]) => void;
  characters: { id: string; name: string }[];
  selectedCharacters: string[];
  onToggleCharacter: (charId: string) => void;
  factions: { id: string; name: string }[];
  selectedFaction: string;
  onFactionChange: (val: string) => void;
  parentQuestId: string;
  onParentQuestChange: (val: string) => void;
  quests: { id: string; title: string }[];
  currentQuestId?: string;
  playerVisible: boolean;
  onPlayerVisibleChange: (val: boolean) => void;
  lorePageId: string | null;
  onLorePageIdChange: (val: string | null) => void;
  title: string;
}

export function QuestDialogRewards({
  campaignId,
  rewardXP, onRewardXPChange,
  rewardGP, onRewardGPChange,
  rewardItems, onRewardItemsChange,
  characters, selectedCharacters, onToggleCharacter,
  factions, selectedFaction, onFactionChange,
  parentQuestId, onParentQuestChange, quests, currentQuestId,
  playerVisible, onPlayerVisibleChange,
  lorePageId, onLorePageIdChange,
  title,
}: QuestDialogRewardsProps) {
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [showItemPicker, setShowItemPicker] = useState(false);

  useEffect(() => {
    const fetchVaultItems = async () => {
      const { data } = await supabase
        .from("items")
        .select("id, name, rarity, item_type")
        .eq("campaign_id", campaignId)
        .order("name");
      if (data) setVaultItems(data);
    };
    fetchVaultItems();
  }, [campaignId]);

  const addRewardItem = (item: any) => {
    if (!rewardItems.find(r => r.id === item.id)) {
      onRewardItemsChange([...rewardItems, { id: item.id, name: item.name, quantity: 1 }]);
    }
    setShowItemPicker(false);
  };

  const removeRewardItem = (id: string) => {
    onRewardItemsChange(rewardItems.filter(r => r.id !== id));
  };

  const updateRewardItemQty = (id: string, qty: number) => {
    onRewardItemsChange(rewardItems.map(r => r.id === id ? { ...r, quantity: Math.max(1, qty) } : r));
  };

  // Filter out current quest from parent quest options
  const parentQuestOptions = quests.filter(q => q.id !== currentQuestId);

  return (
    <div className="space-y-5">
      {/* Currency Rewards */}
      <div>
        <Label className="text-sm font-cinzel text-foreground/80 mb-2 block">Currency Rewards</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reward-xp" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Award className="w-3.5 h-3.5 text-warning-amber" />
              Experience Points
            </Label>
            <Input
              id="reward-xp"
              type="number"
              value={rewardXP}
              onChange={(e) => onRewardXPChange(e.target.value)}
              placeholder="0"
              className="h-8 text-sm border-brass/20"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reward-gp" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Coins className="w-3.5 h-3.5 text-brass" />
              Gold Pieces
            </Label>
            <Input
              id="reward-gp"
              type="number"
              step="0.01"
              value={rewardGP}
              onChange={(e) => onRewardGPChange(e.target.value)}
              placeholder="0"
              className="h-8 text-sm border-brass/20"
            />
          </div>
        </div>
      </div>

      {/* Item Rewards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package className="w-3.5 h-3.5" />
            Item Rewards
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowItemPicker(!showItemPicker)}
            className="h-7 text-xs border-brass/30 hover:bg-brass/10"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Item
          </Button>
        </div>

        {showItemPicker && (
          <div className="border border-brass/20 rounded-lg p-2 mb-2 max-h-32 overflow-y-auto bg-card/50">
            {vaultItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">No items in the vault yet.</p>
            ) : (
              vaultItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors flex items-center justify-between"
                  onClick={() => addRewardItem(item)}
                >
                  <span>{item.name}</span>
                  {item.rarity && (
                    <Badge variant="outline" className="text-[10px] ml-2">{item.rarity}</Badge>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {rewardItems.length > 0 ? (
          <div className="space-y-1.5">
            {rewardItems.map(item => (
              <div key={item.id} className="flex items-center gap-2 bg-secondary/50 rounded px-2 py-1.5 text-sm">
                <span className="flex-1">{item.name}</span>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={e => updateRewardItemQty(item.id, parseInt(e.target.value) || 1)}
                  className="w-16 h-6 text-xs border-brass/20"
                />
                <button type="button" onClick={() => removeRewardItem(item.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No item rewards added.</p>
        )}
      </div>

      {/* Assignments */}
      {characters.length > 0 && (
        <div>
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Users className="w-3.5 h-3.5" />
            Assign to Characters
          </Label>
          <div className="border border-brass/20 rounded-lg p-2 space-y-1.5 max-h-28 overflow-y-auto">
            {characters.map(char => (
              <div key={char.id} className="flex items-center gap-2">
                <Checkbox
                  id={`char-${char.id}`}
                  checked={selectedCharacters.includes(char.id)}
                  onCheckedChange={() => onToggleCharacter(char.id)}
                />
                <Label htmlFor={`char-${char.id}`} className="cursor-pointer font-normal text-sm">
                  {char.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Faction */}
      {factions.length > 0 && (
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            Associated Faction
          </Label>
          <Select value={selectedFaction} onValueChange={onFactionChange}>
            <SelectTrigger className="h-8 text-sm border-brass/20">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {factions.map(faction => (
                <SelectItem key={faction.id} value={faction.id}>{faction.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Quest Chain Parent */}
      {parentQuestOptions.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Part of Quest Chain</Label>
          <Select value={parentQuestId} onValueChange={onParentQuestChange}>
            <SelectTrigger className="h-8 text-sm border-brass/20">
              <SelectValue placeholder="None (standalone quest)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (standalone)</SelectItem>
              {parentQuestOptions.map(q => (
                <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Lore Link */}
      <LoreLinkSelector
        campaignId={campaignId}
        category="history"
        value={lorePageId}
        onChange={onLorePageIdChange}
        label="Linked Lore Entry"
        entityName={title.trim() || undefined}
      />

      {/* Player Visibility */}
      <div className="flex items-center gap-2 pt-1">
        <Checkbox
          id="player-visible"
          checked={playerVisible}
          onCheckedChange={(checked) => onPlayerVisibleChange(!!checked)}
        />
        <Label htmlFor="player-visible" className="text-sm cursor-pointer font-normal">
          Visible to Players
        </Label>
      </div>
    </div>
  );
}
