import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { X, Trash2, Sparkles, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";
import LoreLinkSelector from "@/components/lore/LoreLinkSelector";
import { AIGenerateButton } from "@/components/ai/AIGenerateButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FACTION_TYPES } from "@/lib/factionUtils";

interface Faction {
  id: string;
  name: string;
  description?: string;
  motto?: string;
  banner_url?: string;
  influence_score: number;
  tags: string[];
  goals?: string[];
  lore_page_id?: string | null;
  faction_type?: string | null;
}

interface FactionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  faction: Faction | null;
  onSaved: () => void;
}

const FactionEditor = ({ open, onOpenChange, campaignId, faction, onSaved }: FactionEditorProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [motto, setMotto] = useState("");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [influenceScore, setInfluenceScore] = useState(50);
  const [goals, setGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reputationScore, setReputationScore] = useState(0);
  const [existingReputation, setExistingReputation] = useState<{ id: string } | null>(null);
  const [lorePageId, setLorePageId] = useState<string | null>(null);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [factionType, setFactionType] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return; // Only run when dialog opens
    
    if (faction) {
      setName(faction.name);
      setDescription(faction.description || "");
      setMotto(faction.motto || "");
      setBannerUrl(faction.banner_url || null);
      setTags(faction.tags || []);
      setInfluenceScore(faction.influence_score ?? 50);
      setGoals(faction.goals || []);
      setLorePageId(faction.lore_page_id || null);
      setPlayerVisible((faction as any).player_visible ?? false);
      setFactionType((faction as any).faction_type || "");
      setTagInput("");
      setGoalInput("");
      
      // Fetch reputation for this faction
      const fetchReputation = async () => {
        const { data } = await supabase
          .from("faction_reputation")
          .select("id, score")
          .eq("faction_id", faction.id)
          .eq("campaign_id", campaignId)
          .maybeSingle();
        
        if (data) {
          setReputationScore(data.score);
          setExistingReputation({ id: data.id });
        } else {
          setReputationScore(0);
          setExistingReputation(null);
        }
      };
      fetchReputation();
    } else {
      // New faction - clear all fields
      setName("");
      setDescription("");
      setMotto("");
      setBannerUrl(null);
      setTags([]);
      setInfluenceScore(50);
      setGoals([]);
      setReputationScore(0);
      setExistingReputation(null);
      setLorePageId(null);
      setPlayerVisible(false);
      setFactionType("");
      setTagInput("");
      setGoalInput("");
    }
  }, [faction, open, campaignId]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddGoal = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && goalInput.trim()) {
      e.preventDefault();
      if (!goals.includes(goalInput.trim())) {
        setGoals([...goals, goalInput.trim()]);
      }
      setGoalInput("");
    }
  };

  const handleRemoveGoal = (goal: string) => {
    setGoals(goals.filter((g) => g !== goal));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the faction",
        variant: "destructive",
      });
      return;
    }

    // Auto-commit any pending goal input
    const finalGoals = [...goals];
    if (goalInput.trim() && !goals.includes(goalInput.trim())) {
      finalGoals.push(goalInput.trim());
    }

    // Auto-commit any pending tag input
    const finalTags = [...tags];
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      finalTags.push(tagInput.trim());
    }

    try {
      const factionData = {
        campaign_id: campaignId,
        name: name.trim(),
        description: description.trim() || null,
        motto: motto.trim() || null,
        banner_url: bannerUrl,
        tags: finalTags,
        influence_score: influenceScore,
        goals: finalGoals,
        lore_page_id: lorePageId,
        player_visible: playerVisible,
        faction_type: factionType || null,
      };

      if (faction) {
        const { error } = await supabase
          .from("factions")
          .update(factionData)
          .eq("id", faction.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("factions").insert(factionData);
        if (error) throw error;
      }

      // Save reputation if editing an existing faction
      if (faction) {
        if (existingReputation) {
          await supabase
            .from("faction_reputation")
            .update({ score: reputationScore })
            .eq("id", existingReputation.id);
        } else {
          await supabase
            .from("faction_reputation")
            .insert({
              campaign_id: campaignId,
              faction_id: faction.id,
              score: reputationScore,
            });
        }
      }

      toast({
        title: faction ? "Faction updated" : "Faction created",
        description: `${name} has been ${faction ? "updated" : "created"} successfully`,
      });

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error saving faction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!faction) return;

    try {
      const { error } = await supabase
        .from("factions")
        .delete()
        .eq("id", faction.id);

      if (error) throw error;

      toast({
        title: "Faction deleted",
        description: `${name} has been deleted successfully`,
      });

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error deleting faction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{faction ? "Edit Faction" : "New Faction"}</DialogTitle>
           <AIGenerateButton
             campaignId={campaignId}
             assetType="faction"
             getFormValues={() => ({
               name,
               description,
               motto,
               tags,
               goals,
               influence_score: influenceScore,
             })}
             onApply={(fields) => {
               if (fields.name) setName(fields.name);
               if (fields.description) setDescription(fields.description);
               if (fields.motto) setMotto(fields.motto);
               if (fields.public_goal) setDescription(prev => prev ? `${prev}\n\n**Public Goal:** ${fields.public_goal}` : fields.public_goal);
               if (fields.true_goal) setDescription(prev => prev ? `${prev}\n\n**True Goal:** ${fields.true_goal}` : fields.true_goal);
               if (fields.leadership) setDescription(prev => prev ? `${prev}\n\n**Leadership:** ${fields.leadership}` : fields.leadership);
               if (fields.weakness) setDescription(prev => prev ? `${prev}\n\n**Weakness:** ${fields.weakness}` : fields.weakness);
               if (fields.goals && Array.isArray(fields.goals)) {
                 setGoals(prev => [...prev, ...fields.goals.filter((g: string) => !prev.includes(g))]);
               }
               if (fields.quest_hooks && Array.isArray(fields.quest_hooks)) {
                 setGoals(prev => [...prev, ...fields.quest_hooks.filter((g: string) => !prev.includes(g))]);
               }
               if (fields.rumors && Array.isArray(fields.rumors)) {
                 setDescription(prev => {
                   const rumors = fields.rumors.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n');
                   return prev ? `${prev}\n\n**Rumors:**\n${rumors}` : `**Rumors:**\n${rumors}`;
                 });
               }
             }}
             className="ml-auto"
           />
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Faction name"
              />
            </div>
            <div>
              <Label htmlFor="faction-type">Type</Label>
              <Select value={factionType || "none"} onValueChange={(v) => setFactionType(v === "none" ? "" : v)}>
                <SelectTrigger id="faction-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {FACTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Faction Banner/Emblem Upload */}
          <ImageUpload
            bucket="maps"
            path={`${campaignId}/factions`}
            currentImageUrl={bannerUrl}
            onImageUploaded={setBannerUrl}
            label="Banner / Emblem"
            aspectRatio="landscape"
          />

          <div>
            <Label htmlFor="motto">Motto</Label>
            <Input
              id="motto"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="Their rallying cry or motto..."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this faction about?"
              className="min-h-[100px]"
            />
          </div>

          {/* Influence Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Influence</Label>
              <span className="text-sm text-muted-foreground">{influenceScore}%</span>
            </div>
            <Slider
              value={[influenceScore]}
              onValueChange={(v) => setInfluenceScore(v[0])}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>None</span>
              <span>Moderate</span>
              <span>Dominant</span>
            </div>
          </div>

          {/* Reputation Slider - Only show when editing */}
          {faction && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Party Reputation</Label>
                <span className="text-sm text-muted-foreground">
                  {reputationScore > 0 ? "+" : ""}{reputationScore}
                </span>
              </div>
              <Slider
                value={[reputationScore]}
                onValueChange={(v) => setReputationScore(v[0])}
                min={-100}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Hated</span>
                <span>Neutral</span>
                <span>Revered</span>
              </div>
            </div>
          )}

          {/* Lore Link */}
          <LoreLinkSelector
            campaignId={campaignId}
            category="factions"
            value={lorePageId}
            onChange={setLorePageId}
            label="Linked Lore Entry"
            entityName={name.trim() || undefined}
          />

          {/* Goals */}
          <div>
            <Label htmlFor="goals">Goals</Label>
            <Input
              id="goals"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={handleAddGoal}
              placeholder="Type a goal and press Enter..."
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {goals.map((goal) => (
                <Badge key={goal} variant="outline" className="text-xs">
                  {goal}
                  <button onClick={() => handleRemoveGoal(goal)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type and press Enter..."
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Player Visibility Toggle */}
          <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-brass/20 bg-muted/30">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="player-visible" className="text-sm font-medium">Player Visible</Label>
                <p className="text-xs text-muted-foreground">Allow players to see this faction</p>
              </div>
            </div>
            <Switch
              id="player-visible"
              checked={playerVisible}
              onCheckedChange={setPlayerVisible}
            />
          </div>

          <div className="flex justify-between gap-2 pt-4 border-t">
            {faction && (
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
                {faction ? "Save Changes" : "Create Faction"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Faction</AlertDialogTitle>
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

export default FactionEditor;
