import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Faction {
  id: string;
  name: string;
}

interface Reputation {
  id: string;
  faction_id: string;
  score: number;
  notes?: string;
}

interface ReputationAdjusterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  faction: Faction;
  currentReputation?: Reputation;
  onSaved: () => void;
}

const ReputationAdjuster = ({
  open,
  onOpenChange,
  campaignId,
  faction,
  currentReputation,
  onSaved,
}: ReputationAdjusterProps) => {
  const [score, setScore] = useState(0);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (currentReputation) {
      setScore(currentReputation.score);
      setNotes(currentReputation.notes || "");
    } else {
      setScore(0);
      setNotes("");
    }
  }, [currentReputation, open]);

  const getReputationLabel = (score: number) => {
    if (score >= 75) return "Revered";
    if (score >= 50) return "Friendly";
    if (score >= 25) return "Favorable";
    if (score >= -25) return "Neutral";
    if (score >= -50) return "Unfriendly";
    if (score >= -75) return "Hostile";
    return "Hated";
  };

  const getReputationColor = (score: number) => {
    if (score >= 50) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (score >= 20) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (score >= -20) return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    if (score >= -50) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20";
  };

  const handleSave = async () => {
    try {
      if (currentReputation) {
        const { error } = await supabase
          .from("faction_reputation")
          .update({
            score,
            notes: notes.trim() || null,
            last_changed_at: new Date().toISOString(),
          })
          .eq("id", currentReputation.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("faction_reputation").insert({
          campaign_id: campaignId,
          faction_id: faction.id,
          score,
          notes: notes.trim() || null,
        });

        if (error) throw error;
      }

      toast({
        title: "Reputation updated",
        description: `Party standing with ${faction.name} is now ${getReputationLabel(score)}`,
      });

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error updating reputation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Reputation: {faction.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">
              {score > 0 && "+"}
              {score}
            </div>
            <Badge variant="outline" className={getReputationColor(score)}>
              {getReputationLabel(score)}
            </Badge>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setScore(Math.max(-100, score - 5))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Slider
                value={[score]}
                onValueChange={(value) => setScore(value[0])}
                min={-100}
                max={100}
                step={1}
                className="flex-1 mx-4"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => setScore(Math.min(100, score + 5))}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Hated (-100)</span>
              <span>Neutral (0)</span>
              <span>Revered (+100)</span>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why did the reputation change?"
              className="min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReputationAdjuster;
